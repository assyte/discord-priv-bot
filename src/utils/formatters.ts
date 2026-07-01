export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} gün`);
  if (hours % 24 > 0) parts.push(`${hours % 24} saat`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60} dakika`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60} saniye`);

  return parts.length > 0 ? parts.join(' ') : '0 saniye';
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return 'Bilinmiyor';
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  return num.toLocaleString('tr-TR');
}

export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.slice(0, maxLength - 3)}...` : str;
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[_*~`|\\]/g, '\\$&');
}
