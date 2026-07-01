import type { Message, PartialMessage } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function messageDelete(client: Client, message: Message | PartialMessage) {
  if (!message.guild || message.author?.bot) return;

  await LogService.sendLog(message.guild, 'messageDelete', {
    target: message.author ?? undefined,
    reason: message.content?.slice(0, 1000) || 'İçerik alınamadı',
  });

  const embed = LogService.createLogEmbed('messageDelete', {
    target: message.author ?? undefined,
    reason: message.content?.slice(0, 1000),
  });

  await LogService.sendToChannel(message.guild, embed);
}

export async function messageUpdate(client: Client, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  await LogService.sendLog(newMessage.guild, 'messageUpdate', {
    target: newMessage.author ?? undefined,
    oldData: { content: oldMessage.content },
    newData: { content: newMessage.content },
  });

  const embed = LogService.createLogEmbed('messageUpdate', {
    target: newMessage.author ?? undefined,
    changes: `**Eski:** ${oldMessage.content?.slice(0, 500)}\n**Yeni:** ${newMessage.content?.slice(0, 500)}`,
  });

  await LogService.sendToChannel(newMessage.guild, embed);
}
