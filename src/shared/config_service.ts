import * as vscode from 'vscode';
import { CONFIG_KEYS, TIMING } from './constants';

class ConfigService {
    private readonly configSection = 'myAgyUsage';

    getRefreshIntervalMs(): number {
        const config = vscode.workspace.getConfiguration(this.configSection);
        const seconds = config.get<number>(
            CONFIG_KEYS.REFRESH_INTERVAL,
            TIMING.DEFAULT_REFRESH_INTERVAL_MS / 1000,
        );
        const clampedSeconds = Math.max(20, Math.min(3600, seconds ?? 20));
        return clampedSeconds * 1000;
    }

    getNotifyOnReset(): boolean {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<boolean>(CONFIG_KEYS.NOTIFY_ON_RESET, true);
    }

    getStatusBarModel(): 'all' | 'gemini' | 'claudeGpt' {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<'all' | 'gemini' | 'claudeGpt'>(CONFIG_KEYS.STATUS_BAR_MODEL, 'all');
    }

    getStatusBarMetric(): 'all' | 'percentOnly' | 'hourlyWeeklyOnly' {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return config.get<'all' | 'percentOnly' | 'hourlyWeeklyOnly'>(CONFIG_KEYS.STATUS_BAR_METRIC, 'all');
    }
}

export const configService = new ConfigService();
