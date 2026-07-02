import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';

const GAMES = ['Minecraft', 'League of Legends', 'Valorant', 'CS2'] as const;
const DUO_CHANNEL_ID = '1521904725732364484';
const OYUN_SOHBET_ID = '1521904338883317902';

const GAME_COLORS: Record<typeof GAMES[number], number> = {
  'Minecraft': 0x55FF55,
  'League of Legends': 0x005A82,
  'Valorant': 0xFF4655,
  'CS2': 0xF59E0B,
};

const BANNER_URL = 'https://cdn.discordapp.com/attachments/1521954113582268482/1522143189346156574/kafadan-duo-ara.png?ex=6a4765d0&is=6a461450&hm=246938805fb3dbce6c63f5ab5dfe19a68da2d42a22391536136ed5f6e47c7ece&';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('duo-ara')
    .setDescription('Oyun arkadasi bul (Premium İlan)')
    .addStringOption(opt =>
      opt.setName('oyun').setDescription('Hangi oyun için arıyorsun?').setRequired(true)
        .addChoices(...GAMES.map(g => ({ name: g, value: g }))),
    )
    .addStringOption(opt =>
      opt.setName('not').setDescription('Rank, Rol, Mic durumu vb. notlarını ekle').setRequired(false),
    ),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild!;
    const game = interaction.options.getString('oyun', true) as typeof GAMES[number];
    const note = interaction.options.getString('not') || '';

    const userRole = guild.roles.cache.find(r => r.name === game);
    if (!userRole) {
      await interaction.editReply({ content: `${game} rolü sunucuda bulunamadı.` });
      return;
    }

    const member = await guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(userRole.id)) {
      await interaction.editReply({ content: `Bu ilanı verebilmek için **${game}** rolüne sahip olmalısın.` });
      return;
    }

    const duoChannel = guild.channels.cache.get(DUO_CHANNEL_ID) as TextChannel | undefined;
    if (!duoChannel) {
      await interaction.editReply({ content: 'Duo arama kanalı bulunamadı.' });
      return;
    }

    const embedColor = GAME_COLORS[game] || 0x2B2D31;

    const panel = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({ name: `${interaction.user.username} takım arkadaşı arıyor!`, iconURL: interaction.user.displayAvatarURL() })
      .setDescription([
        `🎮 **Oyun:** ${game}`,
        note ? `📝 **Oyuncu Notu:** ${note}` : '',
        '',
        `Oynamak istiyorsan aşağıdaki **Ben Varım!** butonuna tıkla.`,
      ].join('\n'))
      .setImage(BANNER_URL)
      .setFooter({ text: 'Kafadan Tayfa Premium Duo Arama' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`duo_katil_${interaction.user.id}`)
        .setLabel('Ben Varım! (Katıl)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮'),
      new ButtonBuilder()
        .setCustomId(`duo_iptal_${interaction.user.id}`)
        .setLabel('İlanı Kapat')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️'),
    );

    // Eğer kullanıcı seste ise "Odaya Katıl" butonu ekle
    if (member.voice.channelId) {
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Odaya Katıl')
          .setEmoji('🔊')
          .setURL(`https://discord.com/channels/${guild.id}/${member.voice.channelId}`)
      );
    }

    const postedMsg = await duoChannel.send({ 
      content: `${userRole.toString()} | Yeni İlan!`, 
      embeds: [panel], 
      components: [row] 
    });

    const sohbetChannel = guild.channels.cache.get(OYUN_SOHBET_ID);
    if (sohbetChannel?.isTextBased()) {
      const notify = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(`🚨 ${interaction.user.toString()}, **${game}** oynamak için takım arkadaşı arıyor! İlana ${duoChannel.toString()} kanalından katılabilirsin.`)
      await sohbetChannel.send({ content: userRole.toString(), embeds: [notify] }).catch(() => {});
    }

    await interaction.editReply({
      content: `İlanın başarıyla ${duoChannel.toString()} kanalında yayınlandı! DM sistemi kaldırılarak spam riski sıfıra indirildi.`,
    });
  },
};

export default command;
