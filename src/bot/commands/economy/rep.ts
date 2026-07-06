import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import type { BotCommand } from '../../types/index.js';
import { EconomyService } from '../../services/economyService.js';
import { Client } from '../../client.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Bir kullanıcıya +rep vererek ona 50 Clutch Coin kazandırın.')
    .addUserOption(option => 
      option.setName('kullanici')
        .setDescription('Rep vermek istediğiniz kullanıcı')
        .setRequired(true)),
  guildOnly: true,

  async execute(interaction: CommandInteraction, client: Client) {
    if (!interaction.isChatInputCommand()) return;
    
    const targetUser = interaction.options.getUser('kullanici', true);

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ Botlara +rep veremezsiniz!', ephemeral: true });
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Kendinize +rep veremezsiniz!', ephemeral: true });
    }

    await interaction.deferReply();

    const success = await EconomyService.giveReputation(interaction.user.id, targetUser.id);

    if (!success) {
      return interaction.editReply('⏱️ **Cooldown:** Her 12 saatte sadece 1 kişiye +rep verebilirsiniz. Lütfen daha sonra tekrar deneyin.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71) // Green
      .setTitle('🌟 +Rep Verildi!')
      .setDescription(`<@${interaction.user.id}>, <@${targetUser.id}> adlı kullanıcıya **+rep** verdi!\n\n<@${targetUser.id}> bu sayede **50 Clutch Coin** 🪙 kazandı.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};

export default command;
