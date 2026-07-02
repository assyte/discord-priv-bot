import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from 'dotenv';
config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  try {
    const channel = client.channels.cache.get('1521904327289999561') as TextChannel;
    if (!channel) {
      console.log('Kanal bulunamadi.');
      process.exit(1);
    }
    const msg = await channel.messages.fetch('1522147578903265331');
    console.log(JSON.stringify(msg.embeds[0].toJSON(), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
