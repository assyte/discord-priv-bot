import { EmbedBuilder, ChannelType } from 'discord.js';
import type { Message, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const DARK = 0x2B2D31;
const PREFIX = '.';

function isText(ch: Message['channel']): ch is TextChannel {
  return ch.type === ChannelType.GuildText;
}

function isSnowflake(s: string): boolean {
  return /^\d{17,20}$/.test(s);
}

async function sendError(message: Message, text: string) {
  const embed = new EmbedBuilder()
    .setColor(DARK)
    .setDescription(text)
    .setFooter({ text: 'dev by assyte' });
  if (isText(message.channel)) await message.channel.send({ embeds: [embed] });
}

async function findMember(guild: import('discord.js').Guild, id: string) {
  try {
    const member = await guild.members.fetch(id);
    return member;
  } catch {
    return null;
  }
}

function findRole(guild: import('discord.js').Guild, idOrName: string) {
  if (isSnowflake(idOrName)) {
    const role = guild.roles.cache.get(idOrName);
    if (role) return role;
  }
  const lower = idOrName.toLowerCase();
  if (lower === 'uye') {
    return guild.roles.cache.find(r => r.name === 'Uye') || null;
  }
  if (lower === 'kayitsiz') {
    return guild.roles.cache.find(r => r.name === 'Kayitsiz') || null;
  }
  return guild.roles.cache.find(r => r.id === idOrName || r.name.toLowerCase() === lower) || null;
}

export async function messageCreate(client: Client, message: Message) {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;
  if (!isText(message.channel)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();
  if (!cmd || (cmd !== 'rolver' && cmd !== 'rolal')) return;

  const isMod = message.member?.permissions.has('ModerateMembers') || false;
  if (!isMod) {
    await sendError(message, 'Bu komutu kullanmak icin yetkin yok.');
    return;
  }

  const targetId = args[0]?.replace(/[<@!>]/g, '');
  if (!targetId) {
    await sendError(message, 'Bir uye ID\'si belirtmelisin.');
    return;
  }

  const target = await findMember(message.guild, targetId);
  if (!target) {
    await sendError(message, 'Kullanici bulunamadi.');
    return;
  }

  const roleArg = args[1];
  if (!roleArg) {
    await sendError(message, 'Bir rol ID\'si veya `uye`/`kayitsiz` belirtmelisin.');
    return;
  }

  const role = findRole(message.guild, roleArg);
  if (!role) {
    await sendError(message, `Rol bulunamadi: \`${roleArg}\``);
    return;
  }

  if (role.managed || role.rawPosition >= (message.guild.members.me?.roles.highest?.rawPosition ?? 0)) {
    await sendError(message, 'Bu rol botun yetkisinin uzerinde veya yonetilemez.');
    return;
  }

  const botMember = message.guild.members.me!;
  if (botMember.roles.highest.comparePositionTo(role) <= 0) {
    await sendError(message, 'Bot bu rolu yonetimek icin yeterli yetkiye sahip degil.');
    return;
  }

  if (cmd === 'rolver') {
    if (target.roles.cache.has(role.id)) {
      const embed = new EmbedBuilder()
        .setColor(DARK)
        .setAuthor({ name: target.user.tag, iconURL: target.user.displayAvatarURL() })
        .setDescription(`${target.user.toString()} kullanicisinda \`${role.name}\` rolu zaten mevcut.`)
        .setFooter({ text: 'dev by assyte' });
      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
      return;
    }

    try {
      await target.roles.add(role, `${message.author.tag} tarafindan rol verildi`);
    } catch {
      await sendError(message, 'Rol eklenirken bir hata olustu.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setAuthor({ name: target.user.tag, iconURL: target.user.displayAvatarURL() })
      .setDescription(`${target.user.toString()} kullanicisina \`${role.name}\` rolu verildi.`)
      .addFields(
        { name: 'Uye', value: target.user.toString(), inline: true },
        { name: 'ID', value: target.id, inline: true },
        { name: 'Rol', value: role.toString(), inline: true },
        { name: 'Yetkili', value: message.author.toString(), inline: true },
      )
      .setFooter({ text: 'dev by assyte' });
    await message.channel.send({ embeds: [embed] });
    await message.delete().catch(() => {});
  }

  if (cmd === 'rolal') {
    if (!target.roles.cache.has(role.id)) {
      const embed = new EmbedBuilder()
        .setColor(DARK)
        .setAuthor({ name: target.user.tag, iconURL: target.user.displayAvatarURL() })
        .setDescription(`${target.user.toString()} kullanicisinda \`${role.name}\` rolu bulunmuyor.`)
        .setFooter({ text: 'dev by assyte' });
      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
      return;
    }

    try {
      await target.roles.remove(role, `${message.author.tag} tarafindan rol alindi`);
    } catch {
      await sendError(message, 'Rol alinirken bir hata olustu.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setAuthor({ name: target.user.tag, iconURL: target.user.displayAvatarURL() })
      .setDescription(`${target.user.toString()} kullanicisindan \`${role.name}\` rolu alindi.`)
      .addFields(
        { name: 'Uye', value: target.user.toString(), inline: true },
        { name: 'ID', value: target.id, inline: true },
        { name: 'Rol', value: role.toString(), inline: true },
        { name: 'Yetkili', value: message.author.toString(), inline: true },
      )
      .setFooter({ text: 'dev by assyte' });
    await message.channel.send({ embeds: [embed] });
    await message.delete().catch(() => {});
  }
}
