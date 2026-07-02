import { Client, GatewayIntentBits, TextChannel, WebhookClient } from 'discord.js';
import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildWebhooks] });

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) return process.exit(1);

  const chatChannel = guild.channels.cache.find(c => c.name === 'chat' || c.name === 'sohbet') as TextChannel;
  if (!chatChannel) {
    console.error('Chat kanalı bulunamadı.');
    process.exit(1);
  }

  const { avatars } = await import(pathToFileURL(join(__dirname, '..', 'modules', 'Tayfa', 'services', 'quotes.js')).href);

  // Send test messages
  const names = ['akin', 'hayri', 'kamil', 'mert'] as const;
  
  for (const name of names) {
    try {
      const webhooks = await chatChannel.fetchWebhooks();
      let webhook = webhooks.find(w => w.owner?.id === client.user?.id);
      
      if (!webhook) {
        webhook = await chatChannel.createWebhook({
          name: 'Kafadan Tayfa',
          avatar: client.user?.displayAvatarURL(),
        });
      }

      await webhook.send({
        content: `Merhaba! Ben ${name.charAt(0).toUpperCase() + name.slice(1)}. Fotoğrafım güncellendi, her şey yolunda mı?`,
        username: name.charAt(0).toUpperCase() + name.slice(1),
        avatarURL: avatars[name],
      });
      console.log(`${name} test mesajı gönderildi.`);
    } catch (err) {
      console.error(`${name} için hata:`, err);
    }
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
