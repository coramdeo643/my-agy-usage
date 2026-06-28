

export const QUOTA_THRESHOLDS = {
    
    HEALTHY: 50,
    
    WARNING_DEFAULT: 30,
    
    CRITICAL_DEFAULT: 10,
} as const;

export const TIMING = {
    
    DEFAULT_REFRESH_INTERVAL_MS: 20000,
    
    PROCESS_SCAN_RETRY_MS: 100,
    
    HTTP_TIMEOUT_MS: 10000,
    
    PROCESS_CMD_TIMEOUT_MS: 15000,
    
    REFRESH_COOLDOWN_SECONDS: 60,
    
    MAX_CONSECUTIVE_RETRY: 5,
} as const;

export const UI = {
    
    STATUS_BAR_PRIORITY: 100,
    
    CARD_MIN_WIDTH: 280,
} as const;

export const API_ENDPOINTS = {
    GET_USER_STATUS: '/exa.language_server_pb.LanguageServerService/GetUserStatus',
    GET_UNLEASH_DATA: '/exa.language_server_pb.LanguageServerService/GetUnleashData',
} as const;

export const PROCESS_NAMES = {
    windows: 'language_server_windows_x64.exe',
    darwin_arm: 'language_server_macos_arm',
    darwin_x64: 'language_server_macos',
    linux: 'language_server_linux',
} as const;

export const CONFIG_KEYS = {
    REFRESH_INTERVAL: 'refreshInterval',
    NOTIFY_ON_RESET: 'notifyOnReset',
    STATUS_BAR_MODEL: 'statusBarModel',
    STATUS_BAR_METRIC: 'statusBarMetric',
    SHOW_PROMPT_CREDITS: 'showPromptCredits',
    PINNED_MODELS: 'pinnedModels',
    MODEL_ORDER: 'modelOrder',
    MODEL_CUSTOM_NAMES: 'modelCustomNames',
    VISIBLE_MODELS: 'visibleModels',
    LOG_LEVEL: 'logLevel',
    NOTIFICATION_ENABLED: 'notificationEnabled',
    STATUS_BAR_FORMAT: 'statusBarFormat',
    GROUPING_ENABLED: 'groupingEnabled',
    GROUPING_CUSTOM_NAMES: 'groupingCustomNames',
    GROUPING_SHOW_IN_STATUS_BAR: 'groupingShowInStatusBar',
    PINNED_GROUPS: 'pinnedGroups',
    GROUP_ORDER: 'groupOrder',
    GROUP_MAPPINGS: 'groupMappings',
    WARNING_THRESHOLD: 'warningThreshold',
    CRITICAL_THRESHOLD: 'criticalThreshold',
    QUOTA_SOURCE: 'quotaSource',
    DISPLAY_MODE: 'displayMode',
    PROFILE_HIDDEN: 'profileHidden',
    DATA_MASKED: 'dataMasked',
    LANGUAGE: 'language',
} as const;

export const STATUS_BAR_FORMAT = {
    
    ICON: 'icon',
    
    DOT: 'dot',
    
    PERCENT: 'percent',
    
    COMPACT: 'compact',
    
    NAME_PERCENT: 'namePercent',
    
    STANDARD: 'standard',
} as const;

export const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
} as const;

export const DISPLAY_MODE = {
    
    WEBVIEW: 'webview',
    
    QUICKPICK: 'quickpick',
} as const;
