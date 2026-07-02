import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';

const BANNER_URL = 'https://cdn.discordapp.com/attachments/1521954113582268482/1522146902651441332/kafadan-welcome.png?ex=6a476945&is=6a4617c5&hm=5160daa7c4e1339102a0fd32457fce8a35fbaa677d999101c6ba13f35bf682f3&';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('sunucu-bilgi')
    .setDescription('Kafadan Tayfa sunucusu hakkında detaylı bilgi verir'),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setAuthor({ name: '✦  K A F A D A N  T A Y F A  •  Hakkında', iconURL: interaction.guild?.iconURL() ?? undefined })
      .setTitle('Kafadan Tayfa Topluluğu')
      .setDescription([
        'Kafadan Tayfa, yetişkin oyuncuların (18+) bir araya gelerek kaliteli, seviyeli ve toksiklikten tamamen uzak bir ortamda vakit geçirdiği özel bir Discord topluluğudur.',
        '',
        '**🕊️ Özgürlük ve Sınırlar:**',
        'Bizler, özgürlüğü ve rahat bir ortamı savunan ama bunu yaparken de kişisel sınırlara ve saygıya sonsuz önem veren bir aileyiz. Sunucumuzda samimi, rahat ve özgürce sohbet edebilirsin; sadece kişisel hakaretlere ve rahatsız edici tutumlara müsamaha gösterilmez.',
        '',
        '**💎 Neden Buradayız?**',
        'Sıradan sunuculardaki karmaşadan ve kalitesiz ortamlardan arınmış, "Premium" bir Discord deneyimi yaratmak için buradayız. Kendi özel ses odanda arkadaşlarınla rahatça takılabilir veya e-spor seviyesindeki Duo-Ara sistemimizle yeni maceralara atılabilirsin.',
        '',
        '**🚫 18+ ve Temiz İçerik:**',
        'Topluluğumuz sadece yetişkin üyelerden oluşur. Ancak kalite standartlarımız gereği +18 NSFW, kan/şiddet içeriklerine ve dini/milli değerlere yönelik ağır hakaretlere (ADK/DDK) kesinlikle izin verilmez.',
        '',
        'Kısacası burası; saygının, sohbetin ve kalitenin buluştuğu yer. Aramıza katıldığın için teşekkürler!'
      ].join('\n'))
      .setImage(BANNER_URL)
      .setFooter({ text: 'Kafadan Tayfa' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
