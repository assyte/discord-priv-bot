import { EmbedBuilder, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { avatars } from '../../Tayfa/services/quotes.js';

import { readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('tayfa-bilgi')
    .setDescription('Kafadan Tayfa karakterlerinin biyografilerini gösterir'),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const pathAkin = join(__dirname, '..', '..', '..', 'assets', 'avatars', 'akin.png');
    const pathHayri = join(__dirname, '..', '..', '..', 'assets', 'avatars', 'hayri.png');
    const pathKamil = join(__dirname, '..', '..', '..', 'assets', 'avatars', 'kamil.png');
    const pathMert = join(__dirname, '..', '..', '..', 'assets', 'avatars', 'mert.png');

    const fileAkin = new AttachmentBuilder(readFileSync(pathAkin), { name: 'akin.png' });
    const fileHayri = new AttachmentBuilder(readFileSync(pathHayri), { name: 'hayri.png' });
    const fileKamil = new AttachmentBuilder(readFileSync(pathKamil), { name: 'kamil.png' });
    const fileMert = new AttachmentBuilder(readFileSync(pathMert), { name: 'mert.png' });

    const embedAkin = new EmbedBuilder()
      .setColor(0x3498db)
      .setAuthor({ name: 'Kafadan Tayfa Sakinleri', iconURL: 'attachment://akin.png' })
      .setTitle('💻 Akın — *Hayalperest Kodlayıcı*')
      .setDescription("> Sürekli yeni projeler, botlar ve fikirler peşinde koşan mahallenin teknoloji dehası. Biraz sessizdir ama kafasının içinde fırtınalar kopar.\n\n**Göze Çarpanlar:**\n👨‍💻 En iyi dostu Yumak adındaki kedisidir.\n🌙 Genellikle bilgisayar başında sabahlar.")
      .addFields({ name: '💡 Taktik', value: '```Akın ile muhabbet ederken teknoloji veya yazılımdan bahsedersen sabaha kadar konuşabilirsiniz, ancak kodlarını bölersen agresifleşebilir.```' })
      .setThumbnail('attachment://akin.png')
      .setFooter({ text: 'Kafadan Tayfa Karakter Profili ✦' });

    const embedHayri = new EmbedBuilder()
      .setColor(0xe67e22)
      .setAuthor({ name: 'Kafadan Tayfa Sakinleri', iconURL: 'attachment://hayri.png' })
      .setTitle('🍔 Hayri — *Mahallenin Mide Düşkünü*')
      .setDescription("> Hayatını yemeğe, özellikle de Rüstem abinin köftelerine adamış, neşeli, biraz saf ama kalbi çok temiz olan tayfa üyesi.\n\n**Göze Çarpanlar:**\n🛵 Bir problemin çözümü her zaman lahmacundan veya köfteden geçer.\n💸 Bedava yemek onun zayıf noktasıdır.")
      .addFields({ name: '💡 Taktik', value: '```Hayri ile muhatap oluyorsan mutlaka yemeğini sakla! Yoksa saniyeler içinde elinden kapar, bu adama yemek konusunda asla güvenilmez.```' })
      .setThumbnail('attachment://hayri.png')
      .setFooter({ text: 'Kafadan Tayfa Karakter Profili ✦' });

    const embedKamil = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setAuthor({ name: 'Kafadan Tayfa Sakinleri', iconURL: 'attachment://kamil.png' })
      .setTitle('🛒 Kamil — *Asabi Bakkal*')
      .setDescription("> Mahallenin bakkalı, veresiyeden nefret eden, sürekli herkese laf yetiştiren huysuz ama bir o kadar da yufka yürekli abisi.\n\n**Göze Çarpanlar:**\n📕 Hayri'nin sürekli borç yapmasından bıkmıştır.\n🤬 Sinirli gözükse de aslında dükkandan kimseyi kovmaz.")
      .addFields({ name: '💡 Taktik', value: '```Kamil abinin dükkanına girersen sakın "Veresiye var mı?" deme. Alacağını al ve sessizce çık, yoksa bütün gün kafanı ütüler.```' })
      .setThumbnail('attachment://kamil.png')
      .setFooter({ text: 'Kafadan Tayfa Karakter Profili ✦' });

    const embedMert = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setAuthor({ name: 'Kafadan Tayfa Sakinleri', iconURL: 'attachment://mert.png' })
      .setTitle('⚖️ Mert — *Ağır Abi*')
      .setDescription("> Tayfanın denge unsuru. Olaylar karıştığında her zaman araya girip sakinleştiren, olgun ve güvenilir kişisi.\n\n**Göze Çarpanlar:**\n🤝 Diğerlerinin çocukça kavgalarına gülüp geçer.\n✊ Gerektiğinde masaya yumruğunu vurmasını iyi bilir.")
      .addFields({ name: '💡 Taktik', value: '```Eğer bir tavsiyeye veya motivasyona ihtiyacın varsa Mert abiye git. Sana doğru yolu gösterecek tek kişidir.```' })
      .setThumbnail('attachment://mert.png')
      .setFooter({ text: 'Kafadan Tayfa Karakter Profili ✦' });

    await interaction.editReply({
      content: '🎭 **Kafadan Tayfa Sakinleri**',
      embeds: [embedMert, embedAkin, embedHayri, embedKamil],
      files: [fileMert, fileAkin, fileHayri, fileKamil],
    });
  },
};

export default command;
