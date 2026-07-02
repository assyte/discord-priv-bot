import { ChannelType, type Guild, type VoiceChannel } from 'discord.js';

const DELETE_AFTER_MS = 60000;

interface VCData {
  ownerId: string;
  voiceChannelId: string;
  lastActive: number;
}

const channels = new Map<string, VCData>();

export function getChannelData(voiceChannelId: string): VCData | undefined {
  return channels.get(voiceChannelId);
}

export function setChannelData(voiceChannelId: string, data: VCData): void {
  channels.set(voiceChannelId, data);
}

export function deleteChannelData(voiceChannelId: string): void {
  channels.delete(voiceChannelId);
}

export function getAllData(): Map<string, VCData> {
  return channels;
}

export async function createChannels(
  guild: Guild,
  ownerId: string,
  categoryId: string,
  name: string,
): Promise<VoiceChannel | null> {
  try {
    const voice = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: categoryId,
      reason: `Ozel oda — ${ownerId}`,
      permissionOverwrites: [
        {
          id: ownerId,
          allow: ['ManageChannels', 'Connect', 'Speak', 'Stream', 'UseVAD', 'PrioritySpeaker', 'MuteMembers', 'DeafenMembers', 'MoveMembers'],
        },
        {
          id: guild.id,
          allow: ['Connect', 'Speak'],
        },
      ],
      userLimit: 0,
    });

    channels.set(voice.id, { ownerId, voiceChannelId: voice.id, lastActive: Date.now() });
    return voice;
  } catch {
    return null;
  }
}

export async function deleteChannels(voiceChannelId: string, guild: Guild): Promise<void> {
  channels.delete(voiceChannelId);

  const voice = guild.channels.cache.get(voiceChannelId);
  if (voice?.isVoiceBased()) await voice.delete('Oda kapatildi').catch(() => {});
}

export function getOwnerChannel(guild: Guild, ownerId: string): VoiceChannel | null {
  for (const [, data] of channels) {
    if (data.ownerId === ownerId) {
      const ch = guild.channels.cache.get(data.voiceChannelId);
      if (ch?.type === ChannelType.GuildVoice) return ch as VoiceChannel;
    }
  }
  return null;
}

export function shouldDelete(lastActive: number): boolean {
  return Date.now() - lastActive > DELETE_AFTER_MS;
}

export function scanExistingChannels(guild: Guild, categoryId: string): void {
  const voiceMap = new Map<string, VoiceChannel>();

  for (const ch of guild.channels.cache.values()) {
    if (ch.parentId !== categoryId) continue;
    if (ch.type === ChannelType.GuildVoice && ch.name.endsWith('-oda')) {
      voiceMap.set(ch.id, ch as VoiceChannel);
    }
  }

  for (const [id, vc] of voiceMap) {
    const ownerId = vc.permissionOverwrites.cache.find(o => o.type === 1)?.id || 'unknown';
    channels.set(vc.id, {
      ownerId,
      voiceChannelId: vc.id,
      lastActive: Date.now(),
    });
  }
}
