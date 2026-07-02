import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
  await client.login(process.env.BOT_TOKEN!);
  await new Promise<void>(r => client.once('ready', r));

  const guild = await client.guilds.fetch(process.env.GUILD_ID!);
  await guild.members.fetch();

  const targets: any[] = [];
  for (const [, m] of guild.members.cache) {
    if (m.user.bot) continue;
    if (m.roles.cache.has('1521879823855779950')) continue;
    if (m.roles.cache.size > 1) continue;
    targets.push(m);
  }

  console.log('Hedef:', targets.length);
  if (!targets.length) { process.exit(0); }

  console.log('Dongu basliyor...');
  let added = 0;
  let errors = 0;

  for (let i = 0; i < Math.min(50, targets.length); i++) {
    console.log(`[${i}] ${targets[i]!.user.tag}...`);
    try {
      await targets[i]!.roles.add('1521879823855779950', 'Toplu');
      added++;
      console.log(`[${i}] OK`);
    } catch (e: any) {
      errors++;
      console.log(`[${i}] HATA:`, e?.message?.slice(0, 100) || e);
    }
    await new Promise<void>(r => setTimeout(r, 500));
  }

  console.log('Verilen:', added, 'Hata:', errors);
  await client.destroy();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
