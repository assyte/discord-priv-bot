import type { VoiceState } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function voiceStateUpdate(client: Client, oldState: VoiceState, newState: VoiceState) {
  const guild = oldState.guild || newState.guild;
  if (!guild) return;

  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  if (!oldState.channelId && newState.channelId) {
    const channelName = newState.channel?.name || 'Bilinmiyor';
    await LogService.sendLog(guild, 'voiceJoin', {
      target: member.user,
      changes: { oda: channelName },
    });
    const embed = LogService.createLogEmbed('voiceJoin', {
      target: member.user,
      description: `${member.user.toString()} ses odasina katildi.`,
      changes: `Oda: ${channelName}`,
    });
    await LogService.sendToChannel(guild, embed, 'voiceJoin');
  }

  else if (oldState.channelId && !newState.channelId) {
    const channelName = oldState.channel?.name || 'Bilinmiyor';
    await LogService.sendLog(guild, 'voiceLeave', {
      target: member.user,
      changes: { oda: channelName },
    });
    const embed = LogService.createLogEmbed('voiceLeave', {
      target: member.user,
      description: `${member.user.toString()} ses odasindan ayrildi.`,
      changes: `Oda: ${channelName}`,
    });
    await LogService.sendToChannel(guild, embed, 'voiceLeave');
  }

  else if (oldState.channelId !== newState.channelId) {
    const oldName = oldState.channel?.name || 'Bilinmiyor';
    const newName = newState.channel?.name || 'Bilinmiyor';
    await LogService.sendLog(guild, 'voiceMove', {
      target: member.user,
      changes: { eski: oldName, yeni: newName },
    });
    const embed = LogService.createLogEmbed('voiceMove', {
      target: member.user,
      description: `${member.user.toString()} ses odasi degistirdi.`,
      changes: `${oldName} -> ${newName}`,
    });
    await LogService.sendToChannel(guild, embed, 'voiceMove');
  }
}
