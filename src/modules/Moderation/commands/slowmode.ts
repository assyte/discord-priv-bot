import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanalda yavaş mod ayarla')
    .addIntegerOption(opt =>
      opt.setName('süre').setDescription('Süre (saniye, 0 = kapat)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const duration = interaction.options.getInteger('süre', true);

    const channel = interaction.channel!;
    if (!channel.isTextBased()) {
      await interaction.editReply({ embeds: [errorEmbed('Bu komut sadece metin kanallarında kullanılabilir.')] });
      return;
    }

    await (channel as any).setRateLimitPerUser(duration);

    const embed = createEmbed({
      title: '🐢 Yavaş Mod',
      color: COLORS.info,
      description: duration === 0
        ? 'Yavaş mod kapatıldı.'
        : `Yavaş mod **${duration} saniye** olarak ayarlandı.`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
