import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) throw new Error('Guild not found');

    const checkOrCreate = async (name: string, topic: string) => {
      let channel = guild.channels.cache.find((c: any) => c.name === name);
      if (!channel) {
        console.log(`Creating ${name}...`);
        await guild.channels.create({
          name: name,
          type: 0,
          topic: topic
        });
        console.log(`${name} created!`);
      } else {
        console.log(`${name} already exists.`);
      }
    };

    await checkOrCreate('leaderboard', 'Global Leaderboard');
    await checkOrCreate('leaderboard-weekly', 'Weekly Leaderboard');
    await checkOrCreate('clutch-of-week', 'Post your clutches here!');

  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
