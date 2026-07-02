import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';

const BANNER_URL = 'https://cdn.discordapp.com/attachments/1521954113582268482/1522146902651441332/kafadan-welcome.png?ex=6a476945&is=6a4617c5&hm=5160daa7c4e1339102a0fd32457fce8a35fbaa677d999101c6ba13f35bf682f3&';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('bot-bilgi')
    .setDescription('Botun özelliklerini ve komutlarını görüntüler'),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(0x7B2FBE)
      .setAuthor({ name: '✦  K A F A D A N  T A Y F A  •  Altyapı', iconURL: client.client.user?.displayAvatarURL() })
      .setTitle('Kafadan Tayfa Premium Bot')
      .setDescription([
        'Ben Kafadan Tayfa sunucusunun özel yapım, premium altyapı botuyum. Sunucu içerisindeki deneyimini en üst noktaya taşımak için modern Discord arayüzlerini ve yapay zeka entegrasyonlarını kullanırım.',
        '',
        '**✨ Temel Özelliklerim:**',
        '• **Custom VC (Özel Ses Odaları):** Kendi odanı oluşturduğunda sana özel bir kontrol paneli gönderirim. İsim, limit, gizlilik ve kilit ayarlarını saniyeler içinde sadece sen yönetebilirsin.',
        '• **Duo-Ara (LFG Sistemi):** Spam yapmadan, e-spor kalitesinde interaktif panellerle tek tıkla oyun arkadaşı bulmanı veya odaya katılmanı sağlarım.',
        '• **Yapay Zeka Karakterler:** Sunucuda *Hayri* ve *Akın* gibi kendi kişiliğine sahip interaktif karakterler bulunur. (`.ima`, `.ilgi` vs.)',
        '• **Otomasyon & Moderasyon:** Kayıtları, rolleri, çıkış loglarını ve flood/spam korumalarını sessiz ama etkili biçimde otomatik olarak ayarlarım.',
        '',
        '**🛠️ Bilmen Gereken Komutlar:**',
        '> `/duo-ara` — Kaliteli arayüz ile oyuncu ilanı verir.',
        '> `/sunucu-bilgi` — Sunucu hakkında genel bilgi verir.',
        '> `.oda-kur` — (Yetkililer) Premium CustomVC panelini kurar.',
        '> `.welcome-setup` — (Yetkililer) Hoşgeldin ve rol seçim panosunu kurar.',
      ].join('\n'))
      .setImage(BANNER_URL)
      .setFooter({ text: 'Kafadan Tayfa Geliştirici Ekibi' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
