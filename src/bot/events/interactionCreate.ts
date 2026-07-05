import { Events, Interaction } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { handleRulesAccept } from '../services/rulesPanel.js';
import type { ClutchClient } from '../client.js';
import { handleCS2RankSelect, handleCS2PremierSelect, handleChatColorSelect } from '../services/rolePanelManager.js';
import { TeammatePanelManager } from '../services/teammatePanelManager.js';

const logger = new Logger('InteractionCreate');

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(client: ClutchClient, interaction: Interaction) {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('lfg_')) {
        return TeammatePanelManager.handleLfgButton(interaction);
      }
      switch (interaction.customId) {
        case 'rules_accept':
          return handleRulesAccept(interaction);
        default:
          break;
      }
      return;
    }


    if (interaction.isStringSelectMenu()) {
      try {
        if (interaction.customId === 'lfg_menu') {
          return await TeammatePanelManager.handleLfgMenuSelect(interaction);
        }
        switch (interaction.customId) {
          case 'cs2_rank_select':
            await handleCS2RankSelect(interaction);
            break;
          case 'cs2_premier_select':
            await handleCS2PremierSelect(interaction);
            break;
          case 'chat_color_select':
            await handleChatColorSelect(interaction);
            break;
          default:
            break;
        }
      } catch (err) {
        logger.error('SelectMenu Interaction Error:', err);
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '❌ An error occurred.', flags: ['Ephemeral'] }).catch(()=>null);
        } else {
          await interaction.reply({ content: '❌ An error occurred.', flags: ['Ephemeral'] }).catch(()=>null);
        }
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_lfg_')) {
        try {
          await TeammatePanelManager.handleModalSubmit(interaction);
        } catch (err) {
          logger.error('Modal Submit Error:', err);
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: '❌ An error occurred.', ephemeral: true }).catch(()=>null);
          } else {
            await interaction.reply({ content: '❌ An error occurred.', ephemeral: true }).catch(()=>null);
          }
        }
        return;
      }
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
