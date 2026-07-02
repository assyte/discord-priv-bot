import { Client, GatewayIntentBits, AttachmentBuilder, TextChannel } from 'discord.js';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);

  // Use the CustomVC panel channel to upload the image as a reference
  const dumpChannelId = '1521954113582268482';
  const channel = client.channels.cache.get(dumpChannelId) as TextChannel;

  if (!channel) {
    console.error('Channel not found');
    process.exit(1);
  }

  try {
    console.log('Uploading kamil.png...');
    const imagePath = resolve(process.cwd(), 'src/assets/avatars/kamil.png');
    const attachment = new AttachmentBuilder(readFileSync(imagePath), { name: 'kamil.png' });

    const message = await channel.send({
      content: 'Upload for Kamil Avatar (Ignore)',
      files: [attachment],
    });

    const imageUrl = message.attachments.first()?.url;
    console.log('--- UPLOAD SUCCESS ---');
    console.log(`Image URL: ${imageUrl}`);
    console.log('----------------------');

    // Delete message to keep it clean (REMOVED to keep CDN link alive)
    // await message.delete();
  } catch (err) {
    console.error('Error uploading image:', err);
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
