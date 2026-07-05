import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) throw new Error('Guild not found');

    let channel = guild.channels.cache.find(c => c.name === 'clutch-of-week');
    if (!channel) {
      console.log('Creating clutch-of-week channel...');
      await guild.channels.create({
        name: 'clutch-of-week',
        type: ChannelType.GuildText,
        topic: 'Send your best clips and videos here! Most reactions wins "Hunter of Week"!'
      });
      console.log('Channel created!');
    } else {
      console.log('Channel already exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
