import { type ChatInputCommandInteraction, type PermissionResolvable, type SlashCommandBuilder, type SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import type { Client } from '../client/Client.js';

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
  guildOnly?: boolean;
  permissions?: PermissionResolvable[];
  cooldown?: number;
  category?: string;
}
