import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('Karşılama mesajını ve rol buton panelini gönder')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild!;

    // #hosgeldin mesajı
    const welcomeCh = guild.channels.cache.find(c => c.name === 'hosgeldin');
    if (welcomeCh?.isTextBased()) {
      const welcomeEmbed = createEmbed({
        title: '✦ 𝐇𝐎𝐒̧ 𝐆𝐄𝐋𝐃𝐈𝐍 ✦',
        color: COLORS.success,
        description: [
          '> *18+ Private Community — No Drama, No Toxicity*',
          '',
          'Aramıza hoş geldin!',
          '',
          '📍 Başlamadan önce:',
          '• <#kurallar> kanalını okumayı unutma',
          '• Aşağıdaki butona tıklayarak rollerini seç',
          '',
          'İyi eğlenceler ve saygılı olmayı unutma!',
        ].join('\n'),
        image: 'https://cdn.discordapp.com/attachments/1521954113582268482/1522146902651441332/kafadan-welcome.png?ex=6a476945&is=6a4617c5&hm=5160daa7c4e1339102a0fd32457fce8a35fbaa677d999101c6ba13f35bf682f3&',
        footer: { text: 'Kafadan Tayfa' },
      });

      const redirectRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('redirect_roles')
          .setLabel('🎭 Rol Seç')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎭'),
      );

      await welcomeCh.send({ embeds: [welcomeEmbed], components: [redirectRow] });
    }

    // #rol-al mesajı
    const roleCh = guild.channels.cache.find(c => c.name === 'rol-al');
    if (roleCh?.isTextBased()) {
      const oldMessages = await roleCh.messages.fetch({ limit: 20 });
      const botMessages = oldMessages.filter(m => m.author.id === client.client.user!.id);
      for (const [, m] of botMessages) await m.delete().catch(() => {});

      const panelEmbed = createEmbed({
        title: '✦ 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐑𝐎𝐋 𝐏𝐀𝐍𝐄𝐋𝐈 ✦',
        color: COLORS.primary,
        description: [
          'Rollerini seçmek için butonlara tıkla!',
          '',
          '**🎮 Alabileceğin roller:**',
          '',
          '🎮 **Oyun** — Oyun ses kanallarına erişim',
          '🎵 **Müzik** — Müzik odalarına erişim',
          '🔞 **+18** — Yetişkin içeriği görüntüleme',
          '📷 **Camera** — Seste kamera kullanma',
          '🎥 **Streamer** — Yayın açma',
          '',
          'Rolü açmak/kapatmak için butona tıkla.',
        ].join('\n'),
        footer: { text: 'Kafadan Tayfa' },
      });

      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('role_oyun').setLabel('Oyun').setEmoji('🎮').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('role_muzik').setLabel('Müzik').setEmoji('🎵').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('role_18').setLabel('+18').setEmoji('🔞').setStyle(ButtonStyle.Danger),
      );

      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('role_camera').setLabel('Camera').setEmoji('📷').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('role_streamer').setLabel('Streamer').setEmoji('🎥').setStyle(ButtonStyle.Primary),
      );

      await roleCh.send({ embeds: [panelEmbed], components: [row1, row2] });
    }

    await interaction.editReply({ content: '✅ Welcome ve Role-Select kanalları güncellendi!' });
  },
};

export default command;
