import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const COLOR_NAMES = [
  'Kömür Siyahı', 'Kar Beyazı', 'Kan Kırmızısı', 'Okyanus Mavisi',
  'Zümrüt Yeşili', 'Güneş Sarısı', 'Ametist Moru', 'Ateş Turuncusu',
  'Şeker Pembesi', 'Turkuaz', 'Saf Altın', 'Bordo'
];

client.once('ready', async () => {
  console.log('Rol pozisyonları düzeltiliyor...');
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  await guild.roles.fetch();
  
  const botMember = guild.members.me;
  if (!botMember) {
    console.error('Bot sunucuda bulunamadı!');
    process.exit(1);
  }

  const botHighestRole = botMember.roles.highest;
  console.log(`Botun en yüksek rolü: ${botHighestRole.name} (Sıra: ${botHighestRole.position})`);

  let targetPosition = botHighestRole.position - 1;

  for (const name of COLOR_NAMES) {
    const role = guild.roles.cache.find(r => r.name === name);
    if (role) {
      try {
        console.log(`${role.name} rolü ${targetPosition} sırasına taşınıyor...`);
        await role.setPosition(targetPosition);
        targetPosition--;
      } catch (err) {
        console.error(`${role.name} taşınamadı:`, err);
      }
    }
  }

  console.log('Tüm rol pozisyonları başarıyla güncellendi!');
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
