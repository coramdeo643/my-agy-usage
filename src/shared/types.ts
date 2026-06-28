

export interface PromptCreditsInfo {
    
    available: number;
    
    monthly: number;
    
    usedPercentage: number;
    
    remainingPercentage: number;
}

export interface ModelQuotaInfo {
    
    label: string;
    
    modelId: string;
    
    remainingFraction?: number;
    
    remainingPercentage?: number;
    
    isExhausted: boolean;
    
    resetTime: Date;
    
    timeUntilReset: number;
    
    timeUntilResetFormatted: string;
    
    resetTimeDisplay: string;
    
    resetTimeValid?: boolean;
    
    supportsImages?: boolean;
    
    isRecommended?: boolean;
    
    tagTitle?: string;
    
    supportedMimeTypes?: Record<string, boolean>;

    /** Whether this entry represents a sprint (hourly) or weekly quota window. */
    quotaWindow?: 'sprint' | 'weekly';
}

export interface QuotaGroup {
    
    groupId: string;
    
    groupName: string;
    
    models: ModelQuotaInfo[];
    
    remainingPercentage: number;
    
    resetTime: Date;
    
    resetTimeDisplay: string;
    
    timeUntilResetFormatted: string;
    
    isExhausted: boolean;
}

/**
 * Aggregated quota summary for a model family (e.g. "Gemini" or "Claude/GPT").
 * Contains both the sprint (short-term / hourly) and weekly (long-term) metrics.
 */
export interface FamilyQuotaSummary {
    /** Display name, e.g. "Gemini" or "Claude/GPT" */
    familyName: string;
    /** Sprint remaining percentage (0-100) */
    sprintPct: number;
    /** Human-readable sprint countdown, e.g. "1h32m" */
    sprintCountdown: string;
    /** Weekly remaining percentage (0-100) */
    weeklyPct: number;
    /** Human-readable weekly countdown, e.g. "4d15h" */
    weeklyCountdown: string;
}

export interface ServerQuotaBucket {
    bucketId: string;
    displayName: string;
    description?: string;
    window?: 'weekly' | '5h' | string;
    remainingFraction?: number;
    resetTime?: string;
}

export interface ServerQuotaGroup {
    displayName: string;
    description?: string;
    buckets: ServerQuotaBucket[];
}

export interface ServerQuotaSummaryResponse {
    response?: {
        groups?: ServerQuotaGroup[];
        description?: string;
    };
}

export interface QuotaSnapshot {
    
    timestamp: Date;
    
    availableAICredits?: number;
    /** Prompt Credits */
    promptCredits?: PromptCreditsInfo;
    
    userInfo?: UserInfo;
    
    models: ModelQuotaInfo[];
    
    allModels?: ModelQuotaInfo[];
    
    groups?: QuotaGroup[];

    /** Aggregated per-family sprint + weekly summaries for status bar display. */
    familySummaries?: FamilyQuotaSummary[];

    /** Native server quota groups directly from RetrieveUserQuotaSummary */
    serverQuotaGroups?: ServerQuotaGroup[];
    
    isConnected: boolean;
    
    errorMessage?: string;
    
    localAccountEmail?: string;
}

export enum QuotaLevel {
    
    Normal = 'normal',
    
    Warning = 'warning',
    
    Critical = 'critical',
    
    Depleted = 'depleted',
}

export interface ModelOrAlias {
    model: string;
}

export interface QuotaInfo {
    remainingFraction?: number;
    resetTime: string;
}

export interface ClientModelConfig {
    label: string;
    modelOrAlias?: ModelOrAlias;
    quotaInfo?: QuotaInfo;
    supportsImages?: boolean;
    isRecommended?: boolean;
    allowedTiers?: string[];
    
    tagTitle?: string;
    
    supportedMimeTypes?: Record<string, boolean>;
}

export interface DefaultTeamConfig {
    allowMcpServers?: boolean;
    allowAutoRunCommands?: boolean;
    allowBrowserExperimentalFeatures?: boolean;
    [key: string]: boolean | string | number | undefined;
}

export interface PlanInfo {
    teamsTier: string;
    planName: string;
    monthlyPromptCredits: number;
    monthlyFlowCredits: number;

    browserEnabled?: boolean;
    knowledgeBaseEnabled?: boolean;
    canBuyMoreCredits?: boolean;
    hasAutocompleteFastMode?: boolean;
    cascadeWebSearchEnabled?: boolean;
    canGenerateCommitMessages?: boolean;
    hasTabToJump?: boolean;
    allowStickyPremiumModels?: boolean;
    allowPremiumCommandModels?: boolean;
    canCustomizeAppIcon?: boolean;
    cascadeCanAutoRunCommands?: boolean;
    canAllowCascadeInBackground?: boolean;

    maxNumChatInputTokens?: string | number;
    maxNumPremiumChatMessages?: string | number;
    maxCustomChatInstructionCharacters?: string | number;
    maxNumPinnedContextItems?: string | number;
    maxLocalIndexSize?: string | number;
    monthlyFlexCreditPurchaseAmount?: number;

    defaultTeamConfig?: DefaultTeamConfig;

    [key: string]: string | number | boolean | object | undefined;
}

export interface PlanStatus {
    planInfo: PlanInfo;
    availablePromptCredits: number;
    availableFlowCredits: number;
}

export interface ModelSortGroup {
    modelLabels: string[];
}

export interface ClientModelSort {
    name: string;
    groups: ModelSortGroup[];
}

export interface CascadeModelConfigData {
    clientModelConfigs: ClientModelConfig[];
    clientModelSorts?: ClientModelSort[];
}

export interface UserStatus {
    name: string;
    email: string;
    planStatus?: PlanStatus;
    cascadeModelConfigData?: CascadeModelConfigData;
    acceptedLatestTermsOfService?: boolean;
    userTier?: {
        name: string;
        id: string;
        description: string;
        upgradeSubscriptionUri?: string;
        upgradeSubscriptionText?: string;
    };
}

export interface ServerUserStatusResponse {
    userStatus: UserStatus;
    
    message?: string;
    
    code?: string;
}

export interface EnvironmentScanResult {
    
    extensionPort: number;
    
    connectPort: number;
    /** CSRF Token */
    csrfToken: string;
}

export interface ScanDiagnostics {
    
    scan_method: 'process_name' | 'keyword' | 'unknown';
    
    target_process: string;
    
    attempts: number;
    
    found_candidates: number;
    
    ports?: number[];
    
    verified_port?: number | null;
    
    verification_success?: boolean;
}

export interface ProcessInfo {
    
    pid: number;
    
    extensionPort: number;
    /** CSRF Token */
    csrfToken: string;
}

export interface UserInfo {
    name: string;
    email: string;
    planName: string;
    tier: string;
    browserEnabled: boolean;
    knowledgeBaseEnabled: boolean;
    canBuyMoreCredits: boolean;
    hasAutocompleteFastMode: boolean;
    monthlyPromptCredits: number;
    monthlyFlowCredits: number;
    availablePromptCredits: number;
    availableFlowCredits: number;
    cascadeWebSearchEnabled: boolean;
    canGenerateCommitMessages: boolean;
    allowMcpServers: boolean;
    maxNumChatInputTokens: string;
    tierDescription: string;
    upgradeUri: string;
    upgradeText: string;
    // New fields
    teamsTier: string;
    hasTabToJump: boolean;
    allowStickyPremiumModels: boolean;
    allowPremiumCommandModels: boolean;
    maxNumPremiumChatMessages: string;
    maxCustomChatInstructionCharacters: string;
    maxNumPinnedContextItems: string;
    maxLocalIndexSize: string;
    monthlyFlexCreditPurchaseAmount: number;
    canCustomizeAppIcon: boolean;
    cascadeCanAutoRunCommands: boolean;
    canAllowCascadeInBackground: boolean;
    allowAutoRunCommands: boolean;
    allowBrowserExperimentalFeatures: boolean;
    acceptedLatestTermsOfService: boolean;
    userTierId: string;
}

export type WebviewMessageType =
    | 'init'
    | 'refresh'
    | 'togglePin'
    | 'toggleCredits'
    | 'updateOrder'
    | 'resetOrder'
    | 'retry'
    | 'openLogs'
    | 'rerender'
    | 'renameGroup'
    | 'toggleGrouping'
    | 'promptRenameGroup'
    | 'toggleGroupPin'
    | 'updateGroupOrder'
    | 'autoGroup'
    | 'updateNotificationEnabled'
    | 'updateThresholds'
    | 'renameModel'
    | 'updateStatusBarFormat'
    | 'toggleProfile'
    | 'updateQuotaSource'
    | 'quotaSourceGuideComplete'
    | 'quotaSourceGuideDismiss'
    | 'updateDisplayMode'
    | 'updateDataMasked'
    | 'updateLanguage'
    | 'openCustomGrouping'
    | 'saveCustomGrouping'
    | 'previewAutoGroup'
    // Auto Trigger
    | 'tabChanged'
    | 'autoTrigger.authorize'
    | 'autoTrigger.revoke'
    | 'autoTrigger.addAccount'
    | 'autoTrigger.removeAccount'
    | 'autoTrigger.switchAccount'
    | 'autoTrigger.switchLoginAccount'
    | 'autoTrigger.reauthorizeAccount'
    | 'autoTrigger.importLocal'
    | 'autoTrigger.importLocalConfirm'
    | 'autoTrigger.confirmRisk'
    | 'autoTrigger.saveSchedule'
    | 'autoTrigger.test'
    | 'autoTrigger.validateCrontab'
    | 'autoTrigger.getState'
    | 'getAutoTriggerState'
    | 'autoTrigger.clearHistory'
    // Feature Guide
    | 'guide.checkItOut'
    | 'guide.dontShowAgain'
    // Announcements
    | 'announcement.getState'
    | 'announcement.markAsRead'
    | 'announcement.markAllAsRead'
    // Quota History
    | 'quotaHistory.get'
    // Antigravity Tools Sync
    | 'antigravityToolsSync.import'
    | 'antigravityToolsSync.importAuto'
    | 'antigravityToolsSync.importConfirm'
    | 'antigravityToolsSync.importJson'
    | 'antigravityToolsSync.cancel'
    | 'antigravityToolsSync.toggle'
    | 'antigravityToolsSync.switchToClient'
    // General
    | 'openUrl'
    | 'executeCommand'
    | 'updateVisibleModels'
    | 'clearHistorySingle'
    | 'clearHistoryAll'
    | 'refreshAll'
    | 'refreshAccount'
    | 'switchAccount'
    | 'deleteAccount'
    | 'deleteAccounts'
    | 'addAccount'
    | 'importTokens'
    | 'importFromExtension'
    | 'importFromLocal'
    | 'importFromTools'
    | 'exportAccounts'
    | 'openDashboard';

export interface WebviewMessage {
    command: WebviewMessageType;
    modelId?: string;
    order?: string[];
    
    groupId?: string;
    
    groupName?: string;
    
    currentName?: string;
    
    modelIds?: string[];
    
    notificationEnabled?: boolean;
    
    warningThreshold?: number;
    
    criticalThreshold?: number;
    
    statusBarFormat?: string;
    
    quotaSource?: 'local' | 'authorized';
    
    displayMode?: 'webview' | 'quickpick';
    
    dataMasked?: boolean;
    
    enabled?: boolean;
    
    language?: string;
    
    customGroupMappings?: Record<string, string>;
    
    customGroupNames?: Record<string, string>;
    
    visibleModels?: string[];
    
    jsonText?: string;
    // Auto Trigger
    
    tab?: string;
    
    schedule?: ScheduleConfig;
    
    riskAction?: 'enable' | 'test';
    
    crontab?: string;
    
    models?: string[];
    
    maxOutputTokens?: number;
    
    email?: string;
    
    rangeDays?: number;
    // Announcements
    
    id?: string;
    /** URL (openUrl) */
    url?: string;
    
    commandId?: string;
    
    commandArgs?: unknown[];
    
    importOnly?: boolean;
    
    switchOnly?: boolean;
    
    targetEmail?: string;
    
    overwrite?: boolean;
    
    content?: string;
    
    emails?: string[];
    
    mode?: string;
}

export interface ScheduleConfig {
    enabled: boolean;
    repeatMode: 'daily' | 'weekly' | 'interval';
    dailyTimes?: string[];
    weeklyDays?: number[];
    weeklyTimes?: string[];
    intervalHours?: number;
    intervalStartTime?: string;
    intervalEndTime?: string;
    crontab?: string;
    selectedModels: string[];
    maxOutputTokens?: number;
}

export interface DashboardAuthorizationStatus {
    isAuthorized: boolean;
    email?: string;
    expiresAt?: string;
    accounts?: Array<{
        email: string;
        isActive: boolean;
        expiresAt?: string;
        isInvalid?: boolean;
    }>;
    activeAccount?: string;
}

export interface DashboardConfig {
    
    showPromptCredits: boolean;
    
    pinnedModels: string[];
    
    modelOrder: string[];
    
    modelCustomNames?: Record<string, string>;
    
    visibleModels?: string[];
    
    groupingEnabled: boolean;
    
    groupCustomNames: Record<string, string>;
    
    groupingShowInStatusBar: boolean;
    
    pinnedGroups: string[];
    
    groupOrder: string[];
    
    refreshInterval: number;
    
    notificationEnabled: boolean;
    
    warningThreshold?: number;
    
    criticalThreshold?: number;
    
    lastSuccessfulUpdate?: Date | null;
    
    statusBarFormat?: string;
    
    profileHidden?: boolean;
    
    quotaSource?: string;
    
    authorizedAvailable?: boolean;
    
    authorizationStatus?: DashboardAuthorizationStatus;
    
    displayMode?: string;
    
    dataMasked?: boolean;
    /** External URL */
    url?: string;
    
    groupMappings?: Record<string, string>;
    
    language?: string;
    
    antigravityToolsSyncEnabled?: boolean;
}

export interface StatusBarUpdate {
    
    text: string;
    
    tooltip: string;
    
    backgroundColor?: string;
    
    minPercentage: number;
}

export type PlatformType = 'windows' | 'darwin' | 'linux';

export interface PlatformStrategy {
    
    getProcessListCommand(processName: string): string;
    
    parseProcessInfo(stdout: string): ProcessInfo[];
    
    getPortListCommand(pid: number): string;
    
    parseListeningPorts(stdout: string): number[];
    
    getDiagnosticCommand(): string;
    
    getErrorMessages(): {
        processNotFound: string;
        commandNotAvailable: string;
        requirements: string[];
    };
}

export type model_quota_info = ModelQuotaInfo;

export type prompt_credits_info = PromptCreditsInfo;

export type quota_snapshot = QuotaSnapshot;

export const quota_level = QuotaLevel;

export type server_user_status_response = ServerUserStatusResponse;

export type environment_scan_result = EnvironmentScanResult;
