import * as vscode from 'vscode';
import { exec } from 'child_process';
import { QuotaSnapshot, FamilyQuotaSummary } from '../shared/types';
import { configService } from '../shared/config_service';

function showOsNotification(title: string, message: string): void {
    try {
        if (process.platform === 'win32') {
            const cleanTitle = title.replace(/'/g, "''");
            const cleanMessage = message.replace(/'/g, "''");
            const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$xml = [xml]$template.GetXml()
$nodes = $xml.GetElementsByTagName('text')
$nodes[0].InnerText = '${cleanTitle}'
$nodes[1].InnerText = '${cleanMessage}'
$toastXml = New-Object Windows.Data.Xml.Dom.XmlDocument
$toastXml.LoadXml($xml.OuterXml)
$toast = [Windows.UI.Notifications.ToastNotification]::new($toastXml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Antigravity IDE').Show($toast)
`;
            const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
            exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, () => {});
        } else if (process.platform === 'darwin') {
            const cleanTitle = title.replace(/"/g, '\\"');
            const cleanMessage = message.replace(/"/g, '\\"');
            exec(`osascript -e 'display notification "${cleanMessage}" with title "${cleanTitle}"'`, () => {});
        } else if (process.platform === 'linux') {
            const cleanTitle = title.replace(/"/g, '\\"');
            const cleanMessage = message.replace(/"/g, '\\"');
            exec(`notify-send "${cleanTitle}" "${cleanMessage}"`, () => {});
        }
    } catch (e) {
        // Fallback or ignore OS notification errors silently
    }
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}

function describePieSlice(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    if (endAngle >= 360) endAngle = 359.999;
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
}

function getRingSvgDataUri(pct: number): string {
    const color = pct <= 15 ? '#f44336' : (pct <= 30 ? '#ff9800' : '#4caf50');
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32">`;
    svg += `<circle cx="16" cy="16" r="12" fill="none" stroke="#404040" stroke-width="4"/>`;
    if (pct > 0) {
        if (pct >= 100) {
            svg += `<circle cx="16" cy="16" r="12" fill="none" stroke="${color}" stroke-width="4"/>`;
        } else {
            const angle = (pct / 100) * 360;
            const d = describeArc(16, 16, 12, 0, angle);
            svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
        }
    }
    svg += `</svg>`;
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function getPieSvgDataUri(pct: number): string {
    const color = pct <= 15 ? '#f44336' : (pct <= 30 ? '#ff9800' : '#4caf50');
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32">`;
    svg += `<circle cx="16" cy="16" r="13" fill="#404040"/>`;
    if (pct > 0) {
        if (pct >= 100) {
            svg += `<circle cx="16" cy="16" r="13" fill="${color}"/>`;
        } else {
            const angle = (pct / 100) * 360;
            const d = describePieSlice(16, 16, 13, 0, angle);
            svg += `<path d="${d}" fill="${color}"/>`;
        }
    }
    svg += `</svg>`;
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

const GEMINI_SVG_DATA_URI = 'data:image/svg+xml;base64,' + Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#cccccc"><path d="M12 2C12 7.52285 16.4771 12 22 12C16.4771 12 12 16.4771 12 22C12 16.4771 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"/></svg>`
).toString('base64');

const ROBOT_SVG_DATA_URI = 'data:image/svg+xml;base64,' + Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#cccccc"><path d="M12 2a1 1 0 0 1 1 1v2.071A7.001 7.001 0 0 1 19 12v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a7.001 7.001 0 0 1 6-6.929V3a1 1 0 0 1 1-1zM3 11a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1zm18 0a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1zM8.5 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 17a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H9z"/></svg>`
).toString('base64');

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
        this.statusBarItem.text = `Loading Quota...`;
        this.statusBarItem.show();

        context.subscriptions.push(this.statusBarItem);
    }

    public update(snapshot: QuotaSnapshot): void {
        if (!snapshot.isConnected) {
            this.statusBarItem.text = `Quota Error`;
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
            this.statusBarItem.text = `Quota OK`;
            this.statusBarItem.tooltip = 'Quota synced — no model data available';
        }
    }

    public repaint(): void {
        if (this.lastSnapshot) {
            this.update(this.lastSnapshot);
        }
    }

    public setLoading(text?: string): void {
        this.statusBarItem.text = text ? `Loading ${text}...` : `Loading...`;
    }

    public setError(message: string): void {
        this.statusBarItem.text = `Quota Error`;
        this.statusBarItem.tooltip = message;
    }

    public setReady(): void {
        this.statusBarItem.text = `Quota Ready`;
    }

    private checkResetNotifications(groups: any[]): void {
        if (!configService.getNotifyOnReset()) { return; }

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

                    // 1. In-App Notification Toast
                    vscode.window.showInformationMessage(
                        `⚡ Antigravity Quota Refreshed! ${familyName} (${bucketName}) is back to ${pctStr}%.`
                    );

                    // 2. OS-Level Native System Notification
                    showOsNotification(
                        `⚡ Antigravity Quota Refreshed!`,
                        `${familyName} (${bucketName}) is back to ${pctStr}%.`
                    );

                    // 3. Antigravity IDE Task Completion Sound Effect
                    try {
                        vscode.commands.executeCommand('accessibility.signals.taskCompleted');
                    } catch (e) {
                        // ignore if signal command unavailable in environment
                    }
                }

                this.previousBucketFractions.set(key, currentFraction);
            }
        }
    }

    private formatCountdown(resetTimeStr?: string): string {
        if (!resetTimeStr) return '--';
        const resetDate = new Date(resetTimeStr);
        const ms = Math.max(0, resetDate.getTime() - Date.now());
        if (ms <= 0) return '0m';
        const totalMinutes = Math.floor(ms / 60000);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;
        const remainingMinutes = totalMinutes % 60;
        if (totalDays > 0) return `${totalDays}d${remainingHours}h`;
        if (totalHours > 0) return `${totalHours}h${remainingMinutes}m`;
        return `${totalMinutes}m`;
    }

    private formatFriendlyDateTime(resetTimeStr?: string): string {
        if (!resetTimeStr) return '--';
        const d = new Date(resetTimeStr);
        if (isNaN(d.getTime())) return '--';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayName = days[d.getDay()];
        const monthName = months[d.getMonth()];
        const dayNum = d.getDate();
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${dayName}, ${monthName} ${dayNum} ${hours}:${minutes} ${ampm}`;
    }

    private formatFriendlyTimeOnly(resetTimeStr?: string): string {
        if (!resetTimeStr) return '--';
        const d = new Date(resetTimeStr);
        if (isNaN(d.getTime())) return '--';
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    private getFontChartIcon(type: 'ring' | 'pie', fraction?: number): string {
        if (fraction === undefined) return `$(myagy-${type}-0)`;
        const pct = Math.max(0, Math.min(100, fraction * 100));
        const rounded = Math.round(pct / 5) * 5;
        return `$(myagy-${type}-${rounded})`;
    }

    private formatServerQuotaGroupsText(groups: any[]): string {
        const parts = groups.map(g => {
            let icon = '$(robot)';
            let familyName = g.displayName || '';
            if (familyName.includes('Gemini')) {
                icon = '$(myagy-gemini)';
            } else if (familyName.includes('Claude') || familyName.includes('GPT')) {
                icon = '$(robot)';
            }

            const buckets = g.buckets || [];
            const sprintBucket = buckets.find((b: any) => b.window === '5h') || buckets[1];
            const weeklyBucket = buckets.find((b: any) => b.window === 'weekly') || buckets[0];

            const sprintFraction = sprintBucket?.remainingFraction;
            const sprintPctNum = sprintFraction !== undefined ? Math.floor(sprintFraction * 100) : 100;
            const sprintIcon = this.getFontChartIcon('ring', sprintFraction);
            const sprintCountdown = sprintBucket ? this.formatCountdown(sprintBucket.resetTime) : '--';

            const weeklyFraction = weeklyBucket?.remainingFraction;
            const weeklyPctNum = weeklyFraction !== undefined ? Math.floor(weeklyFraction * 100) : 100;
            const weeklyIcon = this.getFontChartIcon('pie', weeklyFraction);
            const weeklyCountdown = weeklyBucket ? this.formatCountdown(weeklyBucket.resetTime) : '--';

            return `${icon} ${sprintIcon} ${sprintPctNum}% (${sprintCountdown}), ${weeklyIcon} ${weeklyPctNum}% (${weeklyCountdown})`;
        });
        return parts.join(' | ');
    }

    private generateServerTooltip(snapshot: QuotaSnapshot): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString();
        tooltip.isTrusted = true;
        tooltip.supportHtml = true;
        tooltip.supportThemeIcons = true;

        tooltip.appendMarkdown('### Antigravity Quota\n\n');

        for (const g of snapshot.serverQuotaGroups!) {
            let title = (g.displayName || 'Model').replace(/\s+Models$/i, '').replace(/\s+Limit$/i, '');
            if (g.displayName.includes('Gemini')) {
                const geminiSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C12 7.52285 16.4771 12 22 12C16.4771 12 12 16.4771 12 22C12 16.4771 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"/></svg>`;
                const geminiDataUri = 'data:image/svg+xml;base64,' + Buffer.from(geminiSvg).toString('base64');
                tooltip.appendMarkdown(`<img src="${geminiDataUri}" width="14" height="14" /> **${title}**\n\n`);
            } else {
                tooltip.appendMarkdown(`$(robot) **${title}**\n\n`);
            }

            const sortedBuckets = [...(g.buckets || [])].sort((a, b) => {
                const aIs5h = a.window === '5h' || a.displayName?.toLowerCase().includes('5');
                const bIs5h = b.window === '5h' || b.displayName?.toLowerCase().includes('5');
                if (aIs5h && !bIs5h) return -1;
                if (!aIs5h && bIs5h) return 1;
                return 0;
            });

            for (const b of sortedBuckets) {
                const fraction = b.remainingFraction;
                const pctNum = fraction !== undefined ? fraction * 100 : 0;
                const pctStr = fraction !== undefined ? (fraction * 100).toFixed(2) + '%' : '0.00%';
                const countdown = this.formatCountdown(b.resetTime);
                
                const isWeekly = b.window === 'weekly';
                const exactTime = isWeekly 
                    ? this.formatFriendlyDateTime(b.resetTime)
                    : this.formatFriendlyTimeOnly(b.resetTime);
                
                const chartDataUri = isWeekly ? getPieSvgDataUri(pctNum) : getRingSvgDataUri(pctNum);
                const bucketName = (b.displayName || '')
                    .replace(/\s+Limit$/i, '')
                    .replace(/\bFive Hour\b/gi, '5-Hour');

                tooltip.appendMarkdown(`<img src="${chartDataUri}" width="14" height="14" /> ${bucketName}: **${pctStr}** — ${countdown} (${exactTime})\n\n`);
            }
            tooltip.appendMarkdown('---\n\n');
        }

        tooltip.appendMarkdown(`*Updated ${snapshot.timestamp.toLocaleTimeString()} · Click to refresh*`);
        return tooltip;
    }

    private formatStatusBarText(summaries: FamilyQuotaSummary[]): string {
        const parts = summaries.map(s =>
            `${s.familyName}: ${s.sprintPct}% (${s.sprintCountdown}), $(pie-chart) ${s.weeklyPct}% (${s.weeklyCountdown})`
        );
        return parts.join(' | ');
    }

    private generateTooltip(snapshot: QuotaSnapshot): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString();
        tooltip.isTrusted = true;
        tooltip.supportHtml = true;
        tooltip.supportThemeIcons = true;

        tooltip.appendMarkdown('### Antigravity Quota\n\n');

        if (snapshot.familySummaries && snapshot.familySummaries.length > 0) {
            for (const s of snapshot.familySummaries) {
                tooltip.appendMarkdown(`**${s.familyName}**\n\n`);
                tooltip.appendMarkdown(`$(clock) 5-Hour: **${s.sprintPct}%** — ${s.sprintCountdown}\n\n`);
                tooltip.appendMarkdown(`$(calendar) Weekly: **${s.weeklyPct}%** — ${s.weeklyCountdown}\n\n`);
                tooltip.appendMarkdown('---\n\n');
            }
        } else {
            tooltip.appendMarkdown('No quota data available\n\n');
        }

        tooltip.appendMarkdown(`*Updated ${snapshot.timestamp.toLocaleTimeString()} · Click to refresh*`);
        return tooltip;
    }
}
