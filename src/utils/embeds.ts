import { EmbedBuilder, type ColorResolvable, type APIEmbedField } from 'discord.js';
import { COLORS } from './constants.js';

export function createEmbed(options: {
  title?: string;
  description?: string;
  color?: ColorResolvable;
  fields?: APIEmbedField[];
  footer?: string | { text: string; iconURL?: string };
  timestamp?: boolean;
  author?: { name: string; iconURL?: string };
  thumbnail?: string;
  image?: string;
}) {
  const embed = new EmbedBuilder()
    .setColor(options.color ?? COLORS.primary);

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields) embed.addFields(options.fields);
  if (options.footer) {
    if (typeof options.footer === 'string') {
      embed.setFooter({ text: options.footer });
    } else {
      embed.setFooter(options.footer);
    }
  }
  if (options.timestamp ?? true) embed.setTimestamp();
  if (options.author) embed.setAuthor(options.author);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);

  return embed;
}

export function successEmbed(description: string) {
  return createEmbed({ color: COLORS.success, description });
}

export function errorEmbed(description: string) {
  return createEmbed({ color: COLORS.danger, description });
}

export function warningEmbed(description: string) {
  return createEmbed({ color: COLORS.warning, description });
}

export function infoEmbed(description: string) {
  return createEmbed({ color: COLORS.info, description });
}
