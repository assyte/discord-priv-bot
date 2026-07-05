import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID!);
        if (!guild) throw new Error('Guild not found');
        
        const channel = guild.channels.cache.find(c => c.name === 'patch-notes');
        if (channel) {
            await channel.edit({ name: '📢・patch-notes' });
            console.log('Channel renamed successfully');
        } else {
            console.log('Channel not found');
        }
        
    } catch (e) {
        console.error('Error renaming channel:', e);
    }
    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
