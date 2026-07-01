import type { VoiceState } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function voiceStateUpdate(client: Client, oldState: VoiceState, newState: VoiceState) {
  if (!oldState.guild || newState.member?.user.bot) return;

  const member = newState.member || oldState.member;
  if (!member) return;

  const guild = oldState.guild || newState.guild;

  if (!oldState.channelId && newState.channelId) {
    const embed = LogService.createLogEmbed('voiceJoin', {
      target: member.user,
      changes: `🔊 Oda: ${newState.channel?.name}`,
    });
    await LogService.sendLog(guild, 'voiceJoin', {
      target: member.user,
      changes: { oda: newState.channel?.name },
    });
    await LogService.sendToChannel(guild, embed);
  }

  else if (oldState.channelId && !newState.channelId) {
    const embed = LogService.createLogEmbed('voiceLeave', {
      target: member.user,
      changes: `🔇 Oda: ${oldState.channel?.name}`,
    });
    await LogService.sendLog(guild, 'voiceLeave', {
      target: member.user,
      changes: { oda: oldState.channel?.name },
    });
    await LogService.sendToChannel(guild, embed);
  }

  else if (oldState.channelId !== newState.channelId) {
    const embed = LogService.createLogEmbed('voiceMove', {
      target: member.user,
      changes: `➡️ ${oldState.channel?.name} → ${newState.channel?.name}`,
    });
    await LogService.sendLog(guild, 'voiceMove', {
      target: member.user,
      changes: { eski: oldState.channel?.name, yeni: newState.channel?.name },
    });
    await LogService.sendToChannel(guild, embed);
  }
}
