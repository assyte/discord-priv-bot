import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  await guild.roles.fetch();
  
  const unverified = guild.roles.cache.find(r => r.name.toLowerCase() === 'unverified');
  console.log('Unverified Role ID:', unverified ? unverified.id : 'NOT FOUND');
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
