import {
  type GuildMember,
  type PartialGuildMember,
  type User,
  type Guild,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  time,
  TimestampStyles,
} from 'discord.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Sabit Kanal ID'leri ──────────────────────────────────────────────────────
const WELCOME_CHANNEL_ID  = '1521904327289999561'; // #hosgeldin
const JOIN_LOG_CHANNEL_ID  = '1521904371095568581'; // #join-log
const RULES_CHANNEL_ID     = '1264111850430402591'; // #kurallar
const KAYITSIZ_ROLE_ID     = '1521879827324469328'; // @Kayitsiz

// ─── Yardımcı Fonksiyon: Hesap yaşını okunabilir formata çevirir ─────────────
function formatAccountAge(createdAt: Date): { text: string; isNew: boolean } {
  const diffMs   = Date.now() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays < 7)   return { text: `${diffDays} gün ⚠️`, isNew: true };
  if (diffDays < 30)  return { text: `${diffDays} gün`,    isNew: false };
  if (diffDays < 365) return { text: `${Math.floor(diffDays / 30)} ay`, isNew: false };
  const years  = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return {
    text: months > 0 ? `${years} yıl ${months} ay` : `${years} yıl`,
    isNew: false,
  };
}

// ─── guildMemberAdd ───────────────────────────────────────────────────────────
export async function guildMemberAdd(client: Client, member: GuildMember) {
  if (!member.guild) return;

  // 1) Yeni üyeye otomatik "Kayitsiz" rolü ver (ID ile — isim değişse de çalışır)
  try {
    if (!member.roles.cache.has(KAYITSIZ_ROLE_ID)) {
      await member.roles.add(KAYITSIZ_ROLE_ID, 'Otomatik: Yeni üye – kayıt bekleniyor');
      client.logger.debug(`Kayitsiz rolü verildi: ${member.user.tag}`);
    }
  } catch (err) {
    client.logger.warn(`Kayitsiz rolü verilemedi (${member.user.tag}): ${err}`);
  }

  // 2) Hesap bilgileri
  const accountAge = formatAccountAge(member.user.createdAt);
  const memberCount = member.guild.memberCount;

  // ─── HOŞGELDİN MESAJI ──────────────────────────────────────────────────────

  const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (welcomeChannel?.isTextBased()) {
    try {
      // Banner will be set via CDN link

      // Ana embed
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x7B2FBE) // derin mor — premium
        .setAuthor({
          name: `✦  K A F A D A N  T A Y F A  •  Yeni Üye`,
          iconURL: member.user.displayAvatarURL({ size: 64 }),
        })
        .setTitle(`${member.user.displayName} aramıza katıldı! 🎉`)
        .setDescription(
          [
            `> Hoşgeldin ${member.toString()}, seni Kafadan Tayfa ailesinde görmek çok güzel!`,
            `> Sen bu sunucunun **${memberCount.toLocaleString('tr-TR')}. üyesisin.**`,
          ].join('\n'),
        )
        .addFields(
          {
            name: '🗓️  Hesap Yaşı',
            value: `\`\`\`${accountAge.text}\`\`\``,
            inline: true,
          },
          {
            name: '📅  Katılım',
            value: time(member.joinedAt ?? new Date(), TimestampStyles.RelativeTime),
            inline: true,
          },
          {
            name: '🛡️  Kayıt Sistemi',
            value: '```Otomatik — ses teyidi gerekmez```',
            inline: false,
          },
          {
            name: '📜  Bilgilendirme',
            value: [
              `Sunucuda rahatça gezinebilmek için lütfen <#${RULES_CHANNEL_ID}> kanalındaki`,
              `kurallarımızı oku. Kuralları okuyup onayladığında tüm kanallara erişim sağlanır.`,
            ].join(' '),
            inline: false,
          },
        )
        .setImage('https://cdn.discordapp.com/attachments/1521954113582268482/1522146902651441332/kafadan-welcome.png?ex=6a476945&is=6a4617c5&hm=5160daa7c4e1339102a0fd32457fce8a35fbaa677d999101c6ba13f35bf682f3&')
        .setFooter({
          text: `Kafadan Tayfa  •  ${member.guild.name}`,
          iconURL: member.guild.iconURL({ size: 32 }) ?? undefined,
        })
        .setTimestamp();

      // Uyarı alanı — şüpheli hesap
      if (accountAge.isNew) {
        welcomeEmbed.spliceFields(0, 0, {
          name: '⚠️  Dikkat',
          value: '```Bu hesap 7 günden yeni. Moderasyon ekibi tarafından yakından izleniyor.```',
          inline: false,
        });
      }

      // Butonlar
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('📜 Kuralları Oku')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID}`),
        new ButtonBuilder()
          .setLabel('🏠 Ana Sayfa')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${member.guild.id}`),
      );

      await welcomeChannel.send({
        content: `${member.toString()}`,
        embeds: [welcomeEmbed],
        components: [row]
      });
    } catch (err) {
      client.logger.error(`Hoşgeldin mesajı gönderilemedi: ${err}`);
    }
  }

  // ─── GİRİŞ LOGU ──────────────────────────────────────────────────────────────

  const logChannel = member.guild.channels.cache.get(JOIN_LOG_CHANNEL_ID);
  if (logChannel?.isTextBased()) {
    try {
      const logEmbed = new EmbedBuilder()
        .setColor(accountAge.isNew ? 0xFEE75C : 0x57F287) // sarı = şüpheli, yeşil = normal
        .setAuthor({
          name: `Yeni Üye Katıldı`,
          iconURL: member.user.displayAvatarURL(),
        })
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setDescription(
          [
            `**Kullanıcı:** ${member.toString()} (${member.user.tag})`,
            `**ID:** \`${member.user.id}\``,
          ].join('\n'),
        )
        .addFields(
          {
            name: '🗓️ Hesap Oluşturulma',
            value: `${time(member.user.createdAt, TimestampStyles.LongDateTime)}\n*(${accountAge.text} önce)*`,
            inline: true,
          },
          {
            name: '📊 Sunucu Üye Sayısı',
            value: `**${memberCount.toLocaleString('tr-TR')}** üye`,
            inline: true,
          },
          ...(accountAge.isNew
            ? [{
                name: '⚠️ Şüpheli Hesap',
                value: '7 günden yeni hesap — moderatörler bilgilendirildi.',
                inline: false,
              }]
            : []),
        )
        .setFooter({ text: `Kafadan Tayfa  •  Giriş Logu` })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } catch (err) {
      client.logger.error(`Giriş logu gönderilemedi: ${err}`);
    }
  }
}

// ─── guildMemberRemove ────────────────────────────────────────────────────────
export async function guildMemberRemove(
  client: Client,
  member: GuildMember | PartialGuildMember,
) {
  if (!member.guild) return;
  const user = member.user;
  if (!user) return;

  const logChannel = member.guild.channels.cache.get(JOIN_LOG_CHANNEL_ID);
  if (!logChannel?.isTextBased()) return;

  try {
    const roles = member.roles?.cache
      .filter(r => r.name !== '@everyone')
      .map(r => `<@&${r.id}>`)
      .join(' ') || '`Yok`';

    const joinedAt = member.joinedAt;
    const stayDuration = joinedAt
      ? Math.floor((Date.now() - joinedAt.getTime()) / 86_400_000)
      : null;

    const leaveEmbed = new EmbedBuilder()
      .setColor(0xED4245) // kırmızı — çıkış
      .setAuthor({
        name: `Üye Ayrıldı`,
        iconURL: user.displayAvatarURL(),
      })
      .setThumbnail(user.displayAvatarURL({ size: 128 }))
      .setDescription(
        [
          `**Kullanıcı:** ${user.toString()} (${user.tag})`,
          `**ID:** \`${user.id}\``,
        ].join('\n'),
      )
      .addFields(
        {
          name: '📅 Katılma Tarihi',
          value: joinedAt
            ? `${time(joinedAt, TimestampStyles.LongDateTime)}\n*(${stayDuration} gün kaldı)*`
            : '`Bilinmiyor`',
          inline: true,
        },
        {
          name: '🎭 Roller',
          value: roles,
          inline: false,
        },
      )
      .setFooter({ text: 'Kafadan Tayfa  •  Çıkış Logu' })
      .setTimestamp();

    await logChannel.send({ embeds: [leaveEmbed] });
  } catch (err) {
    client.logger.error(`Çıkış logu gönderilemedi: ${err}`);
  }
}

// ─── guildBanAdd ──────────────────────────────────────────────────────────────
export async function guildBanAdd(
  client: Client,
  ban: { guild: Guild; user: User; reason?: string | null },
) {
  const guild = ban.guild;
  if (!guild) return;
  const reason = ban.reason || 'Belirtilmemiş';

  await LogService.sendLog(guild, 'memberBan', { target: ban.user, reason });

  const embed = LogService.createLogEmbed('memberBan', {
    target: ban.user,
    description: `${ban.user.toString()} sunucudan yasaklandı.`,
    reason,
  });

  await LogService.sendToChannel(guild, embed, 'memberBan');
}
