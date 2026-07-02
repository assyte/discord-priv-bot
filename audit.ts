import 'dotenv/config';
import { ChannelType, Client, GatewayIntentBits } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });
c.once('ready', async () => {
  const g = c.guilds.cache.get('1264110767641464844')!;
  console.log('=== SUNUCU DURUM RAPORU ===');
  console.log('İsim:', g.name);
  console.log('Açıklama:', g.description || '(yok)');
  console.log('Üye:', g.memberCount);
  console.log('');

  console.log('--- KANALLAR ---');
  const sorted = [...g.channels.cache.values()].sort((a, b) => a.position - b.position);
  for (const ch of sorted) {
    const type = ch.type === ChannelType.GuildCategory ? 'KATEGORI' : ch.isVoiceBased() ? 'SES' : ch.isTextBased() ? 'METIN' : '?';
    const parentStr = ch.parent ? '(' + ch.parent.name + ')' : '';
    const nsfw = ch.isTextBased() && 'nsfw' in ch && ch.nsfw ? '🔞' : '';
    const typeStr = type.padEnd(10);
    const nameStr = ch.name.padEnd(25);
    console.log('  ' + nsfw + ' ' + typeStr + nameStr + parentStr);
  }

  console.log('');
  console.log('--- ROLLER ---');
  const roles = [...g.roles.cache.values()].sort((a, b) => b.position - a.position);
  for (const r of roles) {
    if (r.name === '@everyone') continue;
    const managed = r.managed ? '(yönetilen)' : '';
    const colorHex = '#' + r.color.toString(16).padStart(6, '0');
    const nameStr = r.name.padEnd(25);
    console.log('  ' + nameStr + colorHex + ' ' + managed);
  }

  process.exit(0);
});
c.login(process.env.BOT_TOKEN!);
