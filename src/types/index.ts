import { type ChatInputCommandInteraction, type PermissionResolvable, type SlashCommandBuilder, type SlashCommandSubcommandsOnlyBuilder, type SlashCommandOptionsOnlyBuilder, type SlashCommandIntegerOption, type SlashCommandStringOption, type SlashCommandUserOption, type SlashCommandChannelOption } from 'discord.js';
import type { Client } from '../client/Client.js';

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
  guildOnly?: boolean;
  permissions?: bigint[];
  cooldown?: number;
  category?: string;
}
