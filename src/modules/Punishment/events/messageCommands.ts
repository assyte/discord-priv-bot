import { EmbedBuilder, ChannelType } from 'discord.js';
import type { Message, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { executePunishment, executeDirectPunishment, removePunishment } from '../utils/punisher.js';
import { RULES, getRule, formatDuration, parseDuration } from '../utils/rules.js';

const DARK = 0x2B2D31;
const PREFIX = '.';

function isText(ch: Message['channel']): ch is TextChannel {
  return ch.type === ChannelType.GuildText;
}

function isDuration(str: string): boolean {
  return /^\d+[smhd]$/.test(str);
}

export async function messageCreate(client: Client, message: Message) {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;
  if (!isText(message.channel)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();
  if (!cmd) return;

  const validCmds = ['mute', 'vmute', 'hapis', 'tokat', 'unmute', 'unvmute', 'unhapis', 'untokat', 'sil'];
  if (!validCmds.includes(cmd)) return;

  const isMod = message.member?.permissions.has('ModerateMembers') || false;
  if (!isMod) {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription('Bu komutu kullanmak icin yetkin yok.')
      .setFooter({ text: 'dev by assyte' });
    await message.channel.send({ embeds: [embed] });
    return;
  }

  const targetId = args[0]?.replace(/[<@!>]/g, '');
  if (!targetId && cmd !== 'sil') {
    await sendError(message, 'Bir uye belirtmelisin.');
    return;
  }

  switch (cmd) {
    case 'mute':
    case 'vmute':
    case 'hapis': {
      const second = args[1];
      if (!second) {
        await sendCategoryList(message);
        return;
      }

      // Escalation mode: second arg matches a known category
      if (getRule(second.toLowerCase())) {
        const result = await executePunishment(message.guild, targetId!, message.author, second.toLowerCase());
        if ('error' in result) {
          await sendError(message, result.error);
          return;
        }
        await message.channel.send({ embeds: [result.embed] });
        await message.delete().catch(() => {});
        return;
      }

      // Manual mode: .mute <id> <reason> <duration>
      if (args.length >= 3 && isDuration(args[args.length - 1]!)) {
        const duration = args.pop()!;
        const reason = args.slice(1).join(' ') || 'Belirtilmemis';
        const result = await executeDirectPunishment(
          message.guild, targetId!, message.author, cmd as 'mute' | 'vmute' | 'hapis', reason, duration,
        );
        if ('error' in result) {
          await sendError(message, result.error);
          return;
        }
        await message.channel.send({ embeds: [result.embed] });
        await message.delete().catch(() => {});
        return;
      }

      await sendError(message, 'Kategori bulunamadi. Kategoriler: ' + RULES.map(r => `\`${r.id}\``).join(', ') + '\nManuel: `<komut> <uye> <sebep> <sure>`');
      break;
    }

    case 'tokat': {
      const reason = args.slice(1).join(' ') || 'Belirtilmemis';
      const result = await executeDirectPunishment(message.guild, targetId!, message.author, 'tokat', reason);
      if ('error' in result) {
        await sendError(message, result.error);
        return;
      }
      await message.channel.send({ embeds: [result.embed] });
      await message.delete().catch(() => {});
      break;
    }

    case 'unmute': {
      const result = await removePunishment(message.guild, targetId!, message.author, 'mute');
      if ('error' in result) { await sendError(message, result.error); return; }
      await message.channel.send({ embeds: [result.embed] });
      await message.delete().catch(() => {});
      break;
    }
    case 'unvmute': {
      const result = await removePunishment(message.guild, targetId!, message.author, 'vmute');
      if ('error' in result) { await sendError(message, result.error); return; }
      await message.channel.send({ embeds: [result.embed] });
      await message.delete().catch(() => {});
      break;
    }
    case 'unhapis': {
      const result = await removePunishment(message.guild, targetId!, message.author, 'hapis');
      if ('error' in result) { await sendError(message, result.error); return; }
      await message.channel.send({ embeds: [result.embed] });
      await message.delete().catch(() => {});
      break;
    }
    case 'untokat': {
      const result = await removePunishment(message.guild, targetId!, message.author, 'tokat');
      if ('error' in result) { await sendError(message, result.error); return; }
      await message.channel.send({ embeds: [result.embed] });
      await message.delete().catch(() => {});
      break;
    }

    case 'sil': {
      const amountStr = args[0];
      if (!amountStr || isNaN(Number(amountStr))) {
        await sendError(message, 'Lutfen gecerli bir miktar belirtin. Ornek: `.sil 10`');
        return;
      }
      let amount = parseInt(amountStr, 10);
      if (amount < 1 || amount > 100) {
        await sendError(message, 'Silinecek mesaj sayisi 1 ile 100 arasinda olmalidir.');
        return;
      }

      try {
        await message.delete().catch(() => {}); // silme komutunun kendisini temizle
        const deleted = await message.channel.bulkDelete(amount, true);
        const embed = new EmbedBuilder()
          .setColor(DARK)
          .setDescription(`${deleted.size} adet mesaj basariyla silindi.`)
          .setFooter({ text: 'dev by assyte' });
        const reply = await message.channel.send({ embeds: [embed] });
        setTimeout(() => reply.delete().catch(() => {}), 4000);
      } catch (err) {
        await sendError(message, 'Mesajlar silinirken bir hata olustu. Sadece 14 gunden yeni mesajlar silinebilir.');
      }
      break;
    }

    default:
      break;
  }
}

async function sendError(message: Message, text: string) {
  const embed = new EmbedBuilder()
    .setColor(DARK)
    .setDescription(text)
    .setFooter({ text: 'dev by assyte' });
  if (isText(message.channel)) await message.channel.send({ embeds: [embed] });
}

async function sendCategoryList(message: Message) {
  if (!isText(message.channel)) return;
  const lines = RULES.map(r => `\`${r.id}\` — ${r.name} (${r.levels.map((l, i) => `#${i + 1}: ${l.type.toUpperCase()} ${formatDuration(l.duration)}`).join(', ')})`);
  const embed = new EmbedBuilder()
    .setColor(DARK)
    .setTitle('Ceza Kategorileri')
    .setDescription(lines.join('\n'))
    .setFooter({ text: 'dev by assyte • Kullanim: .<mute|vmute|hapis> <uye> <kategori>' });
  await message.channel.send({ embeds: [embed] });
}
