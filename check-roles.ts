import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });
c.once('ready', async () => {
  const g = c.guilds.cache.get('1264110767641464844')!;
  const roles = [...g.roles.cache.values()].filter(r => r.name !== '@everyone').sort((a,b) => b.position - a.position);
  for (const r of roles) console.log(r.name, '('+r.id+')');
  process.exit(0);
});
c.login(process.env.BOT_TOKEN!);
