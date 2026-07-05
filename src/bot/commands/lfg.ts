import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { TeammatePanelManager } from '../services/teammatePanelManager.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lfg')
    .setDescription('Opens the Teammate Search (LFG) menu'),
  async execute(interaction: ChatInputCommandInteraction) {
    await TeammatePanelManager.sendLfgMenu(interaction);
  }
};
