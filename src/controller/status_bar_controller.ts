import * as vscode from 'vscode';
import { QuotaSnapshot, FamilyQuotaSummary, ServerQuotaGroup } from '../shared/types';
import { configService } from '../shared/config_service';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg - 90) * Math.PI / 180.0;
    return {
        x: cx + (r * Math.cos(rad)),
        y: cy + (r * Math.sin(rad)),
    };
}

function getRingSvgUri(pct: number): string {
    const color = pct <= 15 ? '#f44336' : (pct <= 30 ? '#ff9800' : '#4caf50');
    const cy = 14.5;
    let content = `<circle cx="16" cy="${cy}" r="11.5" fill="none" stroke="#404040" stroke-width="3.5"/>`;
    if (pct >= 100) {
        content += `<circle cx="16" cy="${cy}" r="11.5" fill="none" stroke="${color}" stroke-width="3.5"/>`;
    } else if (pct > 0) {
        const angle = (pct / 100) * 360;
        const start = polarToCartesian(16, cy, 11.5, angle);
        const end = polarToCartesian(16, cy, 11.5, 0);
        const largeArc = angle <= 180 ? '0' : '1';
        const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A 11.5 11.5 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
        content += `<path d="${d}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32">${content}</svg>`;
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function getPieSvgUri(pct: number): string {
    const color = pct <= 15 ? '#f44336' : (pct <= 30 ? '#ff9800' : '#4caf50');
    const cy = 14.5;
    let content = `<circle cx="16" cy="${cy}" r="12" fill="#404040"/>`;
    if (pct >= 100) {
        content += `<circle cx="16" cy="${cy}" r="12" fill="${color}"/>`;
    } else if (pct > 0) {
        const angle = Math.min(359.999, (pct / 100) * 360);
        const start = polarToCartesian(16, cy, 12, angle);
        const end = polarToCartesian(16, cy, 12, 0);
        const largeArc = angle <= 180 ? '0' : '1';
        const d = `M 16 ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A 12 12 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
        content += `<path d="${d}" fill="${color}"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32">${content}</svg>`;
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

export class StatusBarController {
    private statusBarItem: vscode.StatusBarItem;
    private lastSnapshot?: QuotaSnapshot;
    private previousBucketFractions: Map<string, number> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100,
        );
        this.statusBarItem.command = 'myAgyUsage.refresh';
        this.statusBarItem.text = 'Loading Quota...';
        this.statusBarItem.show();

        context.subscriptions.push(this.statusBarItem);
    }

    public update(snapshot: QuotaSnapshot): void {
        if (!snapshot.isConnected) {
            this.statusBarItem.text = 'Quota Error';
            this.statusBarItem.tooltip = snapshot.errorMessage || 'Failed to sync quota';
            return;
        }

        if (snapshot.serverQuotaGroups && snapshot.serverQuotaGroups.length > 0) {
            this.checkResetNotifications(snapshot.serverQuotaGroups);
        }

        this.lastSnapshot = snapshot;

        if (snapshot.serverQuotaGroups && snapshot.serverQuotaGroups.length > 0) {
            this.statusBarItem.text = this.formatServerQuotaGroupsText(snapshot.serverQuotaGroups);
            this.statusBarItem.tooltip = this.generateServerTooltip(snapshot);
        } else if (snapshot.familySummaries && snapshot.familySummaries.length > 0) {
            this.statusBarItem.text = this.formatStatusBarText(snapshot.familySummaries);
            this.statusBarItem.tooltip = this.generateTooltip(snapshot);
        } else {
            this.statusBarItem.text = 'Quota OK';
            this.statusBarItem.tooltip = 'Quota synced — no model data available';
        }
    }

    public repaint(): void {
        if (this.lastSnapshot) {
            this.update(this.lastSnapshot);
        }
    }

    public setLoading(text?: string): void {
        this.statusBarItem.text = text ? `Loading ${text}...` : 'Loading...';
    }

    public setError(message: string): void {
        this.statusBarItem.text = 'Quota Error';
        this.statusBarItem.tooltip = message;
    }

    public setReady(): void {
        this.statusBarItem.text = 'Quota Ready';
    }

    private checkResetNotifications(groups: ServerQuotaGroup[]): void {
        if (!configService.getNotifyOnReset()) {
            return;
        }

        for (const g of groups) {
            const familyName = g.displayName || 'Model';
            for (const b of g.buckets || []) {
                const key = `${familyName}_${b.bucketId || b.displayName}`;
                const currentFraction = b.remainingFraction ?? 0;
                const prevFraction = this.previousBucketFractions.get(key);

                if (prevFraction !== undefined && prevFraction < 0.95 && currentFraction > prevFraction + 0.05) {
                    const pctStr = (currentFraction * 100).toFixed(0);
                    const rawBucketName = b.displayName || '';
                    const bucketName = rawBucketName.replace(/\s+Limit$/i, '').replace(/\bFive Hour\b/gi, '5-Hour');

                    vscode.window.showInformationMessage(
                        `⚡ Antigravity Quota Refreshed! ${familyName} (${bucketName}) is back to ${pctStr}%.`,
                    );

                    try {
                        vscode.commands.executeCommand('accessibility.signals.taskCompleted');
                    } catch {
                        // ignore if signal command unavailable in environment
                    }
                }

                this.previousBucketFractions.set(key, currentFraction);
            }
        }
    }

    private formatCountdown(resetTimeStr?: string): string {
        if (!resetTimeStr) {
            return '--';
        }
        const resetDate = new Date(resetTimeStr);
        const diff = resetDate.getTime() - Date.now();
        if (diff <= 0) {
            return '0m';
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (h >= 24) {
            const d = Math.floor(h / 24);
            const remainingH = h % 24;
            return `${d}d ${remainingH}h`;
        }
        if (h > 0) {
            return `${h}h ${m}m`;
        }
        return `${m}m`;
    }

    private getFontChartIcon(type: 'ring' | 'pie', fraction?: number): string {
        if (fraction === undefined) {
            return `$(myagy-${type}-0)`;
        }
        const pct = Math.max(0, Math.min(100, fraction * 100));
        const rounded = Math.round(pct / 5) * 5;
        return `$(myagy-${type}-${rounded})`;
    }

    private formatServerQuotaGroupsText(groups: ServerQuotaGroup[]): string {
        const selectedModel = configService.getStatusBarModel();

        let filteredGroups = groups;
        if (selectedModel === 'gemini') {
            filteredGroups = groups.filter(g => (g.displayName || '').includes('Gemini'));
        } else if (selectedModel === 'claudeGpt') {
            filteredGroups = groups.filter(g => (g.displayName || '').includes('Claude') || (g.displayName || '').includes('GPT'));
        }

        if (filteredGroups.length === 0) {
            filteredGroups = groups;
        }

        const parts = filteredGroups.map(g => {
            const familyName = g.displayName || '';
            const initial = familyName.includes('Gemini') ? 'G' : 'C';

            const buckets = g.buckets || [];
            const sprintBucket = buckets.find(b => b.window === '5h') || buckets[1];

            const sprintFraction = sprintBucket?.remainingFraction;
            const sprintPctNum = sprintFraction !== undefined ? Math.floor(sprintFraction * 100) : 100;
            const sprintIcon = this.getFontChartIcon('ring', sprintFraction);

            return `${initial} ${sprintIcon} ${sprintPctNum}%`;
        });
        return parts.join(' | ');
    }

    private generateServerTooltip(snapshot: QuotaSnapshot): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString();
        tooltip.isTrusted = true;
        tooltip.supportHtml = true;

        const lines: string[] = [];

        for (const g of snapshot.serverQuotaGroups!) {
            const familyName = g.displayName.includes('Gemini') ? 'Gemini' : 'Claude';
            const buckets = g.buckets || [];
            const sprintBucket = buckets.find(b => b.window === '5h') || buckets[1];
            const weeklyBucket = buckets.find(b => b.window === 'weekly') || buckets[0];

            const sprintFraction = sprintBucket?.remainingFraction;
            const sprintPct = sprintFraction !== undefined
                ? Math.floor(sprintFraction * 100)
                : 100;
            const ringImg = `<img src="${getRingSvgUri(sprintPct)}" width="14" height="14" align="absmiddle" />`;
            const sprintCountdown = sprintBucket ? this.formatCountdown(sprintBucket.resetTime) : '--';

            const weeklyFraction = weeklyBucket?.remainingFraction;
            const weeklyPct = weeklyFraction !== undefined
                ? Math.floor(weeklyFraction * 100)
                : 100;
            const pieImg = `<img src="${getPieSvgUri(weeklyPct)}" width="14" height="14" align="absmiddle" />`;
            const weeklyCountdown = weeklyBucket ? this.formatCountdown(weeklyBucket.resetTime) : '--';

            lines.push(`**${familyName}** ${ringImg} 5h ${sprintPct}% ${sprintCountdown} · ${pieImg} 7d ${weeklyPct}% ${weeklyCountdown}`);
        }

        tooltip.appendMarkdown(lines.join('  \n'));
        return tooltip;
    }

    private formatStatusBarText(summaries: FamilyQuotaSummary[]): string {
        const selectedModel = configService.getStatusBarModel();

        let filteredSummaries = summaries;
        if (selectedModel === 'gemini') {
            filteredSummaries = summaries.filter(s => s.familyName.includes('Gemini'));
        } else if (selectedModel === 'claudeGpt') {
            filteredSummaries = summaries.filter(s => s.familyName.includes('Claude') || s.familyName.includes('GPT'));
        }

        if (filteredSummaries.length === 0) {
            filteredSummaries = summaries;
        }

        const parts = filteredSummaries.map(s => {
            const initial = s.familyName.includes('Gemini') ? 'G' : 'C';
            const sprintIcon = this.getFontChartIcon('ring', s.sprintPct / 100);
            return `${initial} ${sprintIcon} ${s.sprintPct}%`;
        });
        return parts.join(' | ');
    }

    private generateTooltip(snapshot: QuotaSnapshot): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString();
        tooltip.isTrusted = true;
        tooltip.supportHtml = true;

        if (snapshot.familySummaries && snapshot.familySummaries.length > 0) {
            const lines: string[] = [];
            for (const s of snapshot.familySummaries) {
                const name = s.familyName.includes('Gemini') ? 'Gemini' : 'Claude';
                const ringImg = `<img src="${getRingSvgUri(s.sprintPct)}" width="14" height="14" align="absmiddle" />`;
                const pieImg = `<img src="${getPieSvgUri(s.weeklyPct)}" width="14" height="14" align="absmiddle" />`;
                lines.push(`**${name}** ${ringImg} 5h ${s.sprintPct}% ${s.sprintCountdown} · ${pieImg} 7d ${s.weeklyPct}% ${s.weeklyCountdown}`);
            }
            tooltip.appendMarkdown(lines.join('  \n'));
        } else {
            tooltip.appendMarkdown('No quota data available');
        }

        return tooltip;
    }
}
