import type { VoiceState } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getAllData, setChannelData, shouldDelete, deleteChannels } from '../utils/odaManager.js';

export async function voiceStateUpdate(client: Client, oldState: VoiceState, newState: VoiceState) {
  const guild = oldState.guild || newState.guild;
  if (!guild) return;

  const now = Date.now();

  for (const [, data] of getAllData()) {
    const ch = guild.channels.cache.get(data.voiceChannelId);
    if (!ch?.isVoiceBased()) {
      deleteChannels(data.voiceChannelId, guild);
      continue;
    }

    if (ch.members.size > 0) {
      setChannelData(data.voiceChannelId, { ...data, lastActive: now });
      continue;
    }

    if (shouldDelete(data.lastActive)) {
      await deleteChannels(data.voiceChannelId, guild);
    }
  }
}
