import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Bir üyenin susturmasını kaldır')
    .addUserOption(opt =>
      opt.setName('üye').setDescription('Susturması kaldırılacak üye').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  guildOnly: true,
  cooldown: 3,
  category: 'Moderasyon',

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const target = interaction.options.getUser('üye', true);
    const member = await interaction.guild!.members.fetch(target.id).catch(() => null);

    if (!member) {
      await interaction.editReply({ embeds: [errorEmbed('Üye bulunamadı.')] });
      return;
    }

    if (!member.isCommunicationDisabled()) {
      await interaction.editReply({ embeds: [errorEmbed('Bu üyenin aktif bir susturması yok.')] });
      return;
    }

    await member.timeout(null);
    await member.voice.setMute(false).catch(() => {});

    const embed = createEmbed({
      title: `${EMOJIS.success} Susturma Kaldırıldı`,
      color: COLORS.success,
      fields: [
        { name: 'Üye', value: `${target} (${target.id})`, inline: false },
        { name: 'Yetkili', value: interaction.user.toString(), inline: true },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
