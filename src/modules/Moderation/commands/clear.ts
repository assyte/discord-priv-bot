import { SlashCommandBuilder, PermissionFlagsBits, type TextChannel } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed, errorEmbed, successEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Toplu mesaj sil')
    .addIntegerOption(opt =>
      opt.setName('sayı').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(opt =>
      opt.setName('üye').setDescription('Sadece bu üyenin mesajlarını sil').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  guildOnly: true,
  cooldown: 10,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger('sayı', true);
    const targetUser = interaction.options.getUser('üye');

    const channel = interaction.channel!;
    if (!channel.isTextBased()) {
      await interaction.editReply({ embeds: [errorEmbed('Bu komut sadece metin kanallarında kullanılabilir.')] });
      return;
    }

    const textChannel = channel as TextChannel;
    const messages = await textChannel.messages.fetch({ limit: 100 });
    let messagesToDelete = messages.filter(m => {
      const age = Date.now() - m.createdTimestamp;
      if (age > 1209600000) return false; // 14 günden eski mesajlar silinemez
      if (targetUser && m.author.id !== targetUser.id) return false;
      return true;
    }).first(amount);

    if (messagesToDelete.length === 0) {
      await interaction.editReply({ embeds: [errorEmbed('Silinecek mesaj bulunamadı.')] });
      return;
    }

    await textChannel.bulkDelete(messagesToDelete, true);

    const embed = createEmbed({
      title: '🗑 Mesajlar Silindi',
      color: COLORS.success,
      description: `${messagesToDelete.length} mesaj başarıyla silindi.${targetUser ? `\nFiltre: ${targetUser.tag}` : ''}`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
