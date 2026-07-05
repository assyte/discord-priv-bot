import { Client, GatewayIntentBits, Events } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
] });

client.once('ready', () => {
  console.log('Test bot is ready. Listening for new members...');
});

client.on(Events.GuildMemberAdd, (member) => {
  console.log(`[EVENT FIRED] A new member joined: ${member.user.tag}`);
});

client.login(process.env.BOT_TOKEN);
