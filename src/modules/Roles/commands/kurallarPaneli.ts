import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SlashCommandBuilder,
  AttachmentBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed } from '../../../utils/embeds.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('kurallar-paneli')
    .setDescription('Kurallar kanalına premium kuralları ve onay butonunu gönderir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ flags: [64] }); // Ephemeral flag (MessageFlags.Ephemeral = 64)
    const guild = interaction.guild!;

    const channel = guild.channels.cache.get('1264111850430402591');
    if (!channel?.isTextBased()) {
      await interaction.editReply({ content: '❌ Kurallar kanalı bulunamadı.' });
      return;
    }

    // Eski bot mesajlarını temizle
    const old = await channel.messages.fetch({ limit: 50 });
    const botMsgs = old.filter(m => m.author.id === client.client.user!.id);
    for (const [, m] of botMsgs) await m.delete().catch(() => {});

    // Afişi hazırla (dist/assets/kafadantayfa-kurallar.png)
    const bannerPath = join(__dirname, '..', '..', '..', 'assets', 'kafadantayfa-kurallar.png');
    const banner = new AttachmentBuilder(bannerPath, { name: 'kafadantayfa-kurallar.png' });

    // Premium Kurallar Embed'i
    const rulesEmbed = createEmbed({
      title: '✦  KAFADAN TAYFA • SUNUCU KURALLARI  ✦',
      color: 0x7B2FBE, // Premium Derin Mor
      description: [
        '> Kafadan Tayfa ailesine hoş geldin. Bizler, özgürlüğü ve rahat bir ortamı savunan ama bunu yaparken de kişisel sınırlara ve saygıya sonsuz önem veren bir topluluğuz. Herkesin kendini evinde gibi hissetmesi için aşağıdaki kuralları benimsiyoruz:',
        '',
        '**🕊️  1. Özgürlük ve Sınırlar**',
        '> Sunucumuzda samimi, rahat ve özgürce sohbet edebilir, kendini dilediğin gibi ifade edebilirsin.',
        '> Ancak özgürlük, başkasının alanına saygısızlık etmek anlamına gelmez. Kişisel hakaret, zorbalık ve rahatsız edici toksik davranışlara müsamaha gösterilmez.',
        '',
        '**🚫  2. Yasak İçerikler (+18 / NSFW)**',
        '> Topluluk standartlarımızı korumak adına sunucunun **hiçbir** kanalında +18, NSFW, pornografik veya kan/şiddet içeren (gore) materyallerin paylaşımı **kesinlikle yasaktır**.',
        '> Reklam, farklı sunucu davetleri veya şüpheli linklerin paylaşılması da anında uzaklaştırma sebebidir.',
        '',
        '**🎤  3. Sesli ve Özel Odalar**',
        '> Herkesin kendi özel sohbet alanı vardır. Başkalarının özel ses kanallarına izinsiz girmek veya trolleme amaçlı rahatsızlık vermek yasaktır.',
        '> Dini, milli ve ailevi değerlere yönelik ağır hakaretler (ADK/DDK) sınır ihlali sayılır.',
        '',
        '---',
        '',
        '*Aşağıdaki butona tıklayarak Kafadan Tayfa kurallarını anladığını ve bu sınırların içinde özgürce eğlenmeyi kabul ettiğini beyan etmiş olursun. Onay sonrası tüm sosyal kanallara erişimin açılacaktır.*',
      ].join('\n'),
      footer: { text: 'Kafadan Tayfa Yönetimi' },
    });

    // Embed'e görseli bağla
    rulesEmbed.setImage('attachment://kafadantayfa-kurallar.png');

    // Premium Buton
    const onayRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('onay_kurallar')
        .setLabel('🛡️ Şart ve Kuralları Okudum, Onaylıyorum')
        .setStyle(ButtonStyle.Secondary),
    );

    await channel.send({ embeds: [rulesEmbed], components: [onayRow], files: [banner] });
    await interaction.editReply({ content: '✅ Premium kurallar panosu afişle birlikte güncellendi!' });
  },
};

export default command;
