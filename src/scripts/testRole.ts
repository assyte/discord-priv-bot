import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const token = process.env.BOT_TOKEN!;
const guildId = process.env.GUILD_ID!;
const roleId = '1521879823855779950';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.on('ready', async () => {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) { process.exit(1); }
  await guild.members.fetch();

  const targets: import('discord.js').GuildMember[] = [];
  for (const [, m] of guild.members.cache) {
    if (m.user.bot) continue;
    if (m.roles.cache.has(roleId)) continue;
    if (m.roles.cache.size > 1) continue;
    targets.push(m);
  }
  console.log('targets:', targets.length);

  // Try first 3 sequentially
  for (let i = 0; i < Math.min(3, targets.length); i++) {
    console.log(`[${i}] ${targets[i]!.user.tag}...`);
    try {
      await targets[i]!.roles.add(roleId, 'test');
      console.log(`[${i}] OK`);
    } catch (e: any) {
      console.log(`[${i}] ERR:`, e?.message || e, 'status:', e?.status || '');
    }
  }
  console.log('DONE');
  process.exit(0);
});

await client.login(token);
setTimeout(() => { console.log('TIMEOUT 30s'); process.exit(1); }, 30000);
