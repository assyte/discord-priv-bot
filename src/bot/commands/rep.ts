import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { EconomyService } from '../services/economyService.js';
import { ClutchClient } from '../client.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Give +rep to a user to reward them with 50 Clutch Coins.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user you want to rep')
        .setRequired(true)),
  guildOnly: true,

  async execute(interaction: CommandInteraction, client: ClutchClient) {
    if (!interaction.isChatInputCommand()) return;
    
    const targetUser = interaction.options.getUser('user', true);

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ You cannot give +rep to bots!', ephemeral: true });
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot give +rep to yourself!', ephemeral: true });
    }

    await interaction.deferReply();

    const success = await EconomyService.giveReputation(interaction.user.id, targetUser.id);

    if (!success) {
      return interaction.editReply('⏱️ **Cooldown:** You can only give +rep to 1 person every 12 hours. Please try again later.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71) // Green
      .setTitle('🌟 +Rep Given!')
      .setDescription(`<@${interaction.user.id}> gave **+rep** to <@${targetUser.id}>!\n\n<@${targetUser.id}> earned **50 Clutch Coins** 🪙 as a reward.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};

export default command;
