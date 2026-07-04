import { Events, Interaction } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { handleRulesAccept } from '../services/rulesPanel.js';
import type { ClutchClient } from '../client.js';

const logger = new Logger('InteractionCreate');

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(client: ClutchClient, interaction: Interaction) {
    if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'rules_accept':
          return handleRulesAccept(interaction);
        default:
          break;
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Error executing ${interaction.commandName}`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'An error occurred while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'An error occurred while executing this command!', ephemeral: true });
      }
    }
  }
};
