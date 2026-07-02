import { Client, GatewayIntentBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionsBitField, StringSelectMenuOptionBuilder } from 'discord.js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const COLORS = [
  { name: 'Kömür Siyahı', hex: 0x010101, emoji: '⚫' },
  { name: 'Kar Beyazı', hex: 0xFFFFFF, emoji: '⚪' },
  { name: 'Kan Kırmızısı', hex: 0xE74C3C, emoji: '🔴' },
  { name: 'Okyanus Mavisi', hex: 0x3498DB, emoji: '🔵' },
  { name: 'Zümrüt Yeşili', hex: 0x2ECC71, emoji: '🟢' },
  { name: 'Güneş Sarısı', hex: 0xF1C40F, emoji: '🟡' },
  { name: 'Ametist Moru', hex: 0x9B59B6, emoji: '🟣' },
  { name: 'Ateş Turuncusu', hex: 0xE67E22, emoji: '🟠' },
  { name: 'Şeker Pembesi', hex: 0xFF69B4, emoji: '🩷' },
  { name: 'Turkuaz', hex: 0x1ABC9C, emoji: '🩵' },
  { name: 'Saf Altın', hex: 0xD4AF37, emoji: '🌟' },
  { name: 'Bordo', hex: 0x800000, emoji: '🍷' }
];

client.once('ready', async () => {
  console.log('Bot bağlandı. Kurulum başlıyor...');
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) {
    console.error('Sunucu bulunamadı!');
    process.exit(1);
  }

  await guild.roles.fetch();
  await guild.channels.fetch();

  // 1. Rolleri Kontrol Et / Oluştur
  const roleIds: Record<string, string> = {};
  for (const c of COLORS) {
    let role = guild.roles.cache.find(r => r.name === c.name);
    if (!role) {
      console.log(`${c.name} rolü oluşturuluyor...`);
      role = await guild.roles.create({
        name: c.name,
        color: c.hex,
        reason: 'Takviye Avantajları Renk Paneli',
      });
    }
    roleIds[c.name] = role.id;
  }

  // 2. Kanalı Kontrol Et / Oluştur
  let channel = guild.channels.cache.find(c => c.name === 'takviye-avantajları' && c.type === ChannelType.GuildText);
  if (!channel) {
    console.log('takviye-avantajları kanalı oluşturuluyor...');
    channel = await guild.channels.create({
      name: 'takviye-avantajları',
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.SendMessages], // Sadece okuma/görme
        }
      ],
      reason: 'Takviye Avantajları Paneli Kanalı',
    });
  }

  // 3. Paneli (Embed) Gönder
  if (channel && channel.isTextBased()) {
    console.log('Panel gönderiliyor...');
    const embed = new EmbedBuilder()
      .setColor(0xFF73FA) // Boost pink color
      .setTitle('💎 Takviye (Boost) Avantajları')
      .setDescription('> Sunucumuza takviye (boost) yaparak destek olan değerli üyelerimiz, bu panelden isimlerinin sohbetlerde **hangi renkte** görüneceğini seçebilirler!\n\n**Aşağıdaki menüden dilediğiniz rengi seçebilirsiniz.** Sadece bir renk seçebilirsiniz, yeni seçiminiz eskisinin yerine geçer.')
      .setImage('https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.png') // Generic placeholder
      .setFooter({ text: 'Kafadan Tayfa Premium ✦' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_color_role')
      .setPlaceholder('🎨 Bir isim rengi seçin...')
      .addOptions(
        ...COLORS.map(c => 
          new StringSelectMenuOptionBuilder()
            .setLabel(c.name)
            .setValue(roleIds[c.name])
            .setEmoji(c.emoji)
        ),
        new StringSelectMenuOptionBuilder()
          .setLabel('Rengimi Temizle')
          .setValue('none')
          .setEmoji('🗑️')
          .setDescription('Mevcut rengini kaldırır ve varsayılana döner.')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await channel.send({ embeds: [embed], components: [row] });
    console.log('Panel başarıyla oluşturuldu!');
  }

  console.log('Tüm işlemler tamamlandı!');
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
