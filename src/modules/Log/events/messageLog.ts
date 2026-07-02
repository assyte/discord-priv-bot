import type { Message, PartialMessage, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function messageDelete(client: Client, message: Message | PartialMessage) {
  if (!message.guild) return;
  const author = message.author;
  if (author?.bot) return;

  const content = message.content?.slice(0, 1000) || 'Icerik alinamadi';
  const channel = message.channel;

  await LogService.sendLog(message.guild, 'messageDelete', {
    target: author ?? undefined,
    reason: content,
  });

  const embed = LogService.createLogEmbed('messageDelete', {
    target: author ?? undefined,
    description: `${author?.toString() || 'Bilinmeyen kullanici'} tarafindan bir mesaj silindi.`,
    changes: [
      `Kanal: ${channel?.toString() || 'Bilinmiyor'}`,
      `Icerik: ${content}`,
    ].join('\n'),
  });

  await LogService.sendToChannel(message.guild, embed, 'messageDelete');
}

export async function messageUpdate(client: Client, oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
  if (!newMessage.guild) return;
  const author = newMessage.author;
  if (author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  if (!oldMessage.content || !newMessage.content) return;

  await LogService.sendLog(newMessage.guild, 'messageUpdate', {
    target: author ?? undefined,
    oldData: { content: oldMessage.content },
    newData: { content: newMessage.content },
  });

  const embed = LogService.createLogEmbed('messageUpdate', {
    target: author ?? undefined,
    description: `${author?.toString() || 'Bilinmeyen kullanici'} bir mesaj duzenledi.`,
    changes: [
      'Eski:',
      `\`\`\`${oldMessage.content.slice(0, 500)}\`\`\``,
      'Yeni:',
      `\`\`\`${newMessage.content.slice(0, 500)}\`\`\``,
    ].join('\n'),
  });

  await LogService.sendToChannel(newMessage.guild, embed, 'messageUpdate');
}
