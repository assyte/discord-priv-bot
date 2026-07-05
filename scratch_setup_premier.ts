import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const rolesToCreate = [
  { name: 'CS2 Premier | 0 - 4,999', color: '#B0C3D9' },
  { name: 'CS2 Premier | 5,000 - 9,999', color: '#5E98D9' },
  { name: 'CS2 Premier | 10,000 - 14,999', color: '#4B69FF' },
  { name: 'CS2 Premier | 15,000 - 19,999', color: '#8847FF' },
  { name: 'CS2 Premier | 20,000 - 24,999', color: '#D32CE6' },
  { name: 'CS2 Premier | 25,000 - 29,999', color: '#EB4B4B' },
  { name: 'CS2 Premier | 30,000+', color: '#E4AE39' }
];

client.once('ready', async () => {
  try {
    console.log('Logged in as', client.user?.tag);
    const guild = await client.guilds.fetch('1264110767641464844');
    
    console.log('Creating roles...');
    for (const roleData of rolesToCreate.slice().reverse()) {
      const exists = guild.roles.cache.find((r: any) => r.name === roleData.name);
      if (!exists) {
        await guild.roles.create({
          name: roleData.name,
          color: roleData.color as any,
          reason: 'CS2 Premier Roles Integration',
          hoist: false,
          mentionable: false
        });
        console.log(`Created role: ${roleData.name}`);
      } else {
        console.log(`Role already exists: ${roleData.name}`);
      }
    }

    console.log('Creating channel...');
    const categoryId = '1523058343428489488';
    const channelName = '🟣・cs2-premier-teammate';
    
    const channelExists = guild.channels.cache.find((c: any) => c.name === channelName && c.parentId === categoryId);
    if (!channelExists) {
      const newChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        reason: 'CS2 Premier LFG Channel'
      });
      console.log(`Created channel: ${newChannel.name} (${newChannel.id})`);
    } else {
      console.log(`Channel already exists: ${channelExists.name} (${channelExists.id})`);
    }
    
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
});

client.login(process.env.BOT_TOKEN);
