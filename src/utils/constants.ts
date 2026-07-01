export const COLORS = {
  primary: 0x5865F2,
  success: 0x57F287,
  warning: 0xFEE75C,
  danger: 0xED4245,
  info: 0x5865F2,
  white: 0xFFFFFF,
} as const;

export const EMOJIS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
  report: '📝',
  suggestion: '💡',
  log: '📋',
  ban: '🔨',
  kick: '👢',
  mute: '🔇',
  warn: '⚠️',
  invite: '📨',
  role: '🎭',
  guard: '🛡️',
} as const;

export const TIME = {
  SECOND: 1000,
  MINUTE: 60_000,
  HOUR: 3_600_000,
  DAY: 86_400_000,
  WEEK: 604_800_000,
} as const;

export const INFREQUENCY_TYPES = ['uyarı', 'mute', 'vmute', 'ban', 'kick', 'timeout'] as const;

export const REPORT_STATUSES = ['beklemede', 'inceleniyor', 'çözüldü', 'reddedildi'] as const;

export const SUGGESTION_STATUSES = ['beklemede', 'değerlendiriliyor', 'kabul', 'red'] as const;

export const LOG_TYPES = [
  'messageDelete',
  'messageUpdate',
  'memberJoin',
  'memberLeave',
  'memberBan',
  'memberUnban',
  'voiceJoin',
  'voiceLeave',
  'voiceMove',
  'roleCreate',
  'roleDelete',
  'roleUpdate',
  'channelCreate',
  'channelDelete',
  'channelUpdate',
  'modAction',
] as const;
