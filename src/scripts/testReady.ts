import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
  console.log('1: login...');
  await client.login(process.env.BOT_TOKEN!);
  console.log('2: login done');
  
  console.log('3: waiting for ready...');
  await new Promise<void>(r => client.once('ready', r));
  console.log('4: ready done');
  
  const guild = await client.guilds.fetch(process.env.GUILD_ID!);
  console.log('5:', guild.name);
  
  await client.destroy();
}
main().catch(e => { console.error('ERR:', e); process.exit(1); });
