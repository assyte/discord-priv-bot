import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', async () => {
  const guild = client.guilds.cache.get('1264110767641464844');
  if (guild) {
    const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
    categories.forEach(c => console.log(c.name, c.id));
  } else {
    console.log("Guild not found");
  }
  process.exit(0);
});
client.login(process.env.BOT_TOKEN);
