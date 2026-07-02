export interface Level {
  type: 'vmute' | 'mute' | 'hapis';
  duration: string;
}

export interface Rule {
  id: string;
  name: string;
  levels: Level[];
}

export const RULES: Rule[] = [
  {
    id: 'ddk',
    name: 'Dini Degerlere Kufur',
    levels: [
      { type: 'vmute', duration: '2h' },
      { type: 'mute', duration: '2h' },
      { type: 'hapis', duration: '1h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'hakaret',
    name: 'Hakaret ve Agir Sozler',
    levels: [
      { type: 'mute', duration: '1h' },
      { type: 'mute', duration: '6h' },
      { type: 'hapis', duration: '12h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'spam',
    name: 'Spam ve Reklam',
    levels: [
      { type: 'mute', duration: '1h' },
      { type: 'hapis', duration: '6h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'taciz',
    name: 'Taciz ve Rahatsizlik',
    levels: [
      { type: 'hapis', duration: '12h' },
      { type: 'hapis', duration: '3d' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'crz',
    name: 'Carpraz ve Reklam',
    levels: [
      { type: 'mute', duration: '6h' },
      { type: 'hapis', duration: '12h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'tehdit',
    name: 'Tehdit ve Santiye',
    levels: [
      { type: 'mute', duration: '3h' },
      { type: 'hapis', duration: '12h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'nsfw',
    name: 'NSFW Icerik Paylasimi',
    levels: [
      { type: 'mute', duration: '6h' },
      { type: 'hapis', duration: '24h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'dinlealay',
    name: 'Din ve Degerlerle Alay',
    levels: [
      { type: 'mute', duration: '3h' },
      { type: 'hapis', duration: '12h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'siyaset',
    name: 'Siyasi Propaganda ve Tartisma',
    levels: [
      { type: 'mute', duration: '2h' },
      { type: 'hapis', duration: '12h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'ozelbilgi',
    name: 'Ozel Bilgi Paylasimi (OSS)',
    levels: [
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'yetkiliengel',
    name: 'Yetkiliyi Engel/Vazifeyi Engelleme',
    levels: [
      { type: 'mute', duration: '12h' },
      { type: 'hapis', duration: '24h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
  {
    id: 'baslik',
    name: 'Basliksiz/Uygun Olmayan Kullanici Adi',
    levels: [
      { type: 'mute', duration: '1h' },
      { type: 'hapis', duration: '6h' },
      { type: 'hapis', duration: 'permanent' },
    ],
  },
];

export function getRule(id: string): Rule | undefined {
  return RULES.find(r => r.id === id);
}

export function getLevel(rule: Rule, count: number): Level {
  const index = Math.min(Math.max(count - 1, 0), rule.levels.length - 1);
  return rule.levels[index]!;
}

export function parseDuration(input: string): number | null {
  if (input === 'permanent') return Infinity;
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const value = parseInt(match[1]!);
  const unit = match[2]!;
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] ?? 0);
}

export function formatDurationShort(ms: number): string {
  if (ms === Infinity) return 'Kalici';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} sn`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  return `${days} gn`;
}

export function formatDuration(duration: string): string {
  if (duration === 'permanent') return 'Kalici';
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return duration;
  const val = match[1]!;
  const unit: Record<string, string> = { s: 'sn', m: 'dk', h: 'sa', d: 'gn' };
  return `${val} ${unit[match[2]!] || match[2]!}`;
}
