import { Client, GatewayIntentBits, AttachmentBuilder, TextChannel } from 'discord.js';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }

  // Find a suitable channel to upload files (e.g. #log or just create a temporary hidden channel, or use any hidden channel)
  const logChannel = guild.channels.cache.get('1521904333598228631') as TextChannel; // #bot-komut
  if (!logChannel) {
    console.error('Log channel not found');
    process.exit(1);
  }

  const avatars = ['akin.png', 'hayri.png', 'kamil.png', 'mert.png'];
  const urls: Record<string, string> = {};

  for (const file of avatars) {
    const attachment = new AttachmentBuilder(join(__dirname, '..', 'assets', 'avatars', file), { name: file });
    const msg = await logChannel.send({ content: `Avatar upload: ${file}`, files: [attachment] });
    urls[file.replace('.png', '')] = msg.attachments.first()!.url;
    console.log(`Uploaded ${file}`);
  }

  writeFileSync(join(__dirname, '..', 'assets', 'avatars', 'avatarURLs.json'), JSON.stringify(urls, null, 2));
  console.log('Avatar URLs saved successfully');
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
