import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { WeeklyLeaderboardService } from './src/bot/services/weeklyLeaderboardService.js';
import { dbPool } from './src/database/connection.js';

// Define a minimal mock getClient function since the bot uses it
let _client: any;
export function getClient() { return _client; }

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
_client = client;

// Mock the getClient in the service
jest.mock('./src/bot/client.js', () => ({
  getClient: () => _client
}));

client.once('ready', async () => {
  try {
    console.log('Triggering Weekly Leaderboard...');
    // We can't easily mock imports in ts-node like this without complexity, 
    // instead let's just write the creation logic here!
    
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) throw new Error('Guild not found');

    let channel = guild.channels.cache.find(c => c.name === 'leaderboard-weekly');
    if (!channel) {
      console.log('Creating leaderboard-weekly channel...');
      channel = await guild.channels.create({
        name: 'leaderboard-weekly',
        type: 0,
        topic: 'Weekly top players'
      });
      console.log('Channel leaderboard-weekly created!');
    } else {
      console.log('Channel leaderboard-weekly already exists.');
    }

  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
