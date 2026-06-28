import * as https from 'https';
import * as vscode from 'vscode';
import { logger } from '../shared/log_service';
import { QuotaSnapshot, ModelQuotaInfo, FamilyQuotaSummary } from '../shared/types';
import { API_ENDPOINTS } from '../shared/constants';

/** Threshold in ms — reset times within 12 hours are classified as "sprint". */
const SPRINT_THRESHOLD_MS = 12 * 60 * 60 * 1000;

export class ReactorCore {
    private connectPort?: number;
    private csrfToken?: string;
    private timer?: NodeJS.Timeout;
    private snapshotChangeEmitter = new vscode.EventEmitter<QuotaSnapshot>();

    public readonly onSnapshotChange = this.snapshotChangeEmitter.event;

    engage(port: number, token: string, diagnostics: any) {
        this.connectPort = port;
        this.csrfToken = token;
        logger.info(`Reactor engaged on port ${port}`);
    }

    startReactor(intervalMs: number) {
        if (this.timer) { clearInterval(this.timer); }
        this.syncTelemetry();
        this.timer = setInterval(() => this.syncTelemetry(), intervalMs);
    }

    shutdown() {
        if (this.timer) { clearInterval(this.timer); }
        this.snapshotChangeEmitter.dispose();
    }

    async syncTelemetry() {
        if (!this.connectPort || !this.csrfToken) { return; }
        try {
            const data = await this.fetchLocalQuota();
            let summaryData: any = null;
            try {
                summaryData = await this.fetchQuotaSummary();
            } catch (e) {
                logger.warn(`Quota summary fetch failed, fallback to basic telemetry: ${e}`);
            }
            const snapshot = this.parseResponse(data, summaryData);
            this.snapshotChangeEmitter.fire(snapshot);
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            logger.error(`Sync error: ${errorMsg}`);
            
            // Send error state to UI with empty models and isConnected = false
            this.snapshotChangeEmitter.fire({
                timestamp: new Date(),
                isConnected: false,
                models: [],
                errorMessage: errorMsg
            });
        }
    }

    private fetchQuotaSummary(): Promise<any> {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                metadata: { ideName: 'antigravity', extensionName: 'antigravity', locale: 'en' }
            });
            const req = https.request({
                hostname: '127.0.0.1',
                port: this.connectPort,
                path: '/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': this.csrfToken,
                },
                rejectUnauthorized: false,
                timeout: 10000,
                agent: false
            }, res => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => {
                    try { resolve(JSON.parse(body)); } catch(e) { reject(new Error('JSON Parse failed')); }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            req.write(data);
            req.end();
        });
    }

    private fetchLocalQuota(): Promise<any> {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                metadata: { ideName: 'antigravity', extensionName: 'antigravity', locale: 'en' }
            });
            const req = https.request({
                hostname: '127.0.0.1',
                port: this.connectPort,
                path: API_ENDPOINTS.GET_USER_STATUS,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                    'Connect-Protocol-Version': '1',
                    'X-Codeium-Csrf-Token': this.csrfToken,
                },
                rejectUnauthorized: false,
                timeout: 10000,
                agent: false
            }, res => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => {
                    try { resolve(JSON.parse(body)); } catch(e) { reject(new Error('JSON Parse failed')); }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            req.write(data);
            req.end();
        });
    }

    /**
     * Format a duration in milliseconds into a compact human-readable string.
     * Examples: "1h32m", "4d15h", "23m", "0m"
     */
    private formatCountdown(ms: number): string {
        if (ms <= 0) { return '0m'; }

        const totalMinutes = Math.floor(ms / 60000);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        const remainingHours = totalHours % 24;
        const remainingMinutes = totalMinutes % 60;

        if (totalDays > 0) {
            return `${totalDays}d${remainingHours}h`;
        }
        if (totalHours > 0) {
            return `${totalHours}h${remainingMinutes}m`;
        }
        return `${totalMinutes}m`;
    }

    /**
     * Classify a model label into a family name.
     */
    private classifyFamily(label: string): string {
        const lower = label.toLowerCase();
        if (lower.includes('gemini')) { return 'Gemini'; }
        if (lower.includes('claude') || lower.includes('gpt')) { return 'Claude/GPT'; }
        return 'Other';
    }

    private parseResponse(data: any, summaryData?: any): QuotaSnapshot {
        const models: ModelQuotaInfo[] = [];
        const now = Date.now();
        const status = data?.userStatus;

        if (status?.cascadeModelConfigData?.clientModelConfigs) {
            for (const m of status.cascadeModelConfigData.clientModelConfigs) {
                if (m.quotaInfo) {
                    const resetDate = m.quotaInfo.resetTime ? new Date(m.quotaInfo.resetTime) : new Date();
                    const timeUntilReset = Math.max(0, resetDate.getTime() - now);
                    const remainingPct = m.quotaInfo.remainingFraction !== undefined
                        ? m.quotaInfo.remainingFraction * 100
                        : undefined;

                    // Classify as sprint or weekly based on reset time distance
                    const quotaWindow: 'sprint' | 'weekly' =
                        timeUntilReset <= SPRINT_THRESHOLD_MS ? 'sprint' : 'weekly';

                    models.push({
                        label: m.label || m.modelOrAlias?.model || 'Unknown',
                        modelId: m.modelOrAlias?.model || 'unknown',
                        remainingPercentage: remainingPct,
                        resetTime: resetDate,
                        resetTimeDisplay: resetDate.toLocaleTimeString(),
                        timeUntilResetFormatted: this.formatCountdown(timeUntilReset),
                        isExhausted: m.quotaInfo.remainingFraction === 0,
                        remainingFraction: m.quotaInfo.remainingFraction,
                        timeUntilReset,
                        resetTimeValid: !isNaN(resetDate.getTime()),
                        quotaWindow,
                    });
                }
            }
        }

        // Build family summaries from all models
        const familySummaries = this.buildFamilySummaries(models);
        const serverQuotaGroups = summaryData?.response?.groups;

        return {
            timestamp: new Date(),
            isConnected: true,
            models,
            familySummaries,
            serverQuotaGroups,
        };
    }

    /**
     * Group models into families (Gemini, Claude/GPT) and produce
     * sprint + weekly summaries for each family.
     */
    private buildFamilySummaries(models: ModelQuotaInfo[]): FamilyQuotaSummary[] {
        // Bucket models by family + window
        const buckets = new Map<string, { sprint: ModelQuotaInfo[]; weekly: ModelQuotaInfo[] }>();

        for (const m of models) {
            const family = this.classifyFamily(m.label);
            if (family === 'Other') { continue; }

            if (!buckets.has(family)) {
                buckets.set(family, { sprint: [], weekly: [] });
            }
            const bucket = buckets.get(family)!;
            if (m.quotaWindow === 'sprint') {
                bucket.sprint.push(m);
            } else {
                bucket.weekly.push(m);
            }
        }

        const summaries: FamilyQuotaSummary[] = [];

        // Iterate in a stable order: Gemini first, then Claude/GPT
        const familyOrder = ['Gemini', 'Claude/GPT'];
        for (const familyName of familyOrder) {
            const bucket = buckets.get(familyName);
            if (!bucket) { continue; }

            // Pick the most conservative (lowest) percentage within each window.
            // If a window has no entries, fall back to the other window's data or show N/A.
            const sprintPct = bucket.sprint.length > 0
                ? Math.min(...bucket.sprint.map(m => m.remainingPercentage ?? 0))
                : (bucket.weekly.length > 0
                    ? Math.min(...bucket.weekly.map(m => m.remainingPercentage ?? 0))
                    : 0);

            const sprintCountdown = bucket.sprint.length > 0
                ? this.formatCountdown(Math.min(...bucket.sprint.map(m => m.timeUntilReset)))
                : '--';

            const weeklyPct = bucket.weekly.length > 0
                ? Math.min(...bucket.weekly.map(m => m.remainingPercentage ?? 0))
                : (bucket.sprint.length > 0
                    ? Math.min(...bucket.sprint.map(m => m.remainingPercentage ?? 0))
                    : 0);

            const weeklyCountdown = bucket.weekly.length > 0
                ? this.formatCountdown(Math.min(...bucket.weekly.map(m => m.timeUntilReset)))
                : '--';

            summaries.push({
                familyName,
                sprintPct: Math.floor(sprintPct),
                sprintCountdown,
                weeklyPct: Math.floor(weeklyPct),
                weeklyCountdown,
            });
        }

        return summaries;
    }
}

