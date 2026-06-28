import * as vscode from 'vscode';
import * as path from 'path';
import { ProcessHunter } from './engine/hunter';
import { ReactorCore } from './engine/reactor';
import { logger } from './shared/log_service';
import { setAntigravityRemoteName, setAntigravityUserDataDir } from './shared/antigravity_paths';
import { configService } from './shared/config_service';
import { StatusBarController } from './controller/status_bar_controller';

let hunter: ProcessHunter;
let reactor: ReactorCore;
let statusBar: StatusBarController;

let systemOnline = false;
let autoRetryCount = 0;
const MAX_AUTO_RETRY = 3;
const AUTO_RETRY_DELAY_MS = 5000;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    logger.init();

    try {
        const userDataDir = path.resolve(context.globalStorageUri.fsPath, '..', '..', '..');
        setAntigravityRemoteName(vscode.env.remoteName ?? null);
        setAntigravityUserDataDir(userDataDir);
        logger.info(`[Startup] Resolved user-data-dir: ${userDataDir}, remote=${vscode.env.remoteName ?? 'local'}`);
    } catch (err) {
        logger.warn(`[Startup] Failed to resolve user-data-dir`);
    }

    hunter = new ProcessHunter();
    reactor = new ReactorCore();
    statusBar = new StatusBarController(context);

    context.subscriptions.push(vscode.commands.registerCommand('myAgyUsage.refresh', async () => {
        logger.info('Manual refresh triggered');
        statusBar.setLoading();
        reactor.startReactor(configService.getRefreshIntervalMs());
        await bootSystems();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('myAgyUsage.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'myAgyUsage');
    }));

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('myAgyUsage')) {
            statusBar.repaint();
        }
    }));

    context.subscriptions.push(
        reactor.onSnapshotChange((snapshot) => {
            statusBar.update(snapshot);
        })
    );

    await bootSystems();
}

async function bootSystems(): Promise<void> {
    if (systemOnline) {
        return;
    }

    statusBar.setLoading();

    try {
        const info = await hunter.scanEnvironment(3);
        if (info) {
            reactor.engage(info.connectPort, info.csrfToken, hunter.getLastDiagnostics());
            reactor.startReactor(configService.getRefreshIntervalMs());
            systemOnline = true;
            autoRetryCount = 0;
            statusBar.setReady();
        } else {
            if (autoRetryCount < MAX_AUTO_RETRY) {
                autoRetryCount++;
                statusBar.setLoading(`(${autoRetryCount}/${MAX_AUTO_RETRY})`);
                setTimeout(bootSystems, AUTO_RETRY_DELAY_MS);
            } else {
                autoRetryCount = 0;
                statusBar.setError("Offline");
            }
        }
    } catch (e) {
        if (autoRetryCount < MAX_AUTO_RETRY) {
            autoRetryCount++;
            statusBar.setLoading(`(${autoRetryCount}/${MAX_AUTO_RETRY})`);
            setTimeout(bootSystems, AUTO_RETRY_DELAY_MS);
        } else {
            autoRetryCount = 0;
            statusBar.setError("Error connecting");
        }
    }
}

export async function deactivate(): Promise<void> {
    reactor?.shutdown();
    logger.dispose();
}
