import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import type { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { Database } from '../../../database/connection.js';
import { guilds } from '../../../database/schema/guild.js';
import { eq } from 'drizzle-orm';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ayarla')
    .setDescription('Sunucu log ve sistem kanallarını ayarlar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('log')
        .setDescription('Log kanallarını ayarla')
        .addChannelOption(opt =>
          opt.setName('uye-log')
            .setDescription('Üye giriş/çıkış log kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addChannelOption(opt =>
          opt.setName('mesaj-log')
            .setDescription('Silinen/düzenlenen mesaj log kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addChannelOption(opt =>
          opt.setName('ses-log')
            .setDescription('Ses odası log kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addChannelOption(opt =>
          opt.setName('mod-log')
            .setDescription('Moderasyon işlemleri log kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addChannelOption(opt =>
          opt.setName('genel-log')
            .setDescription('Genel log kanalı (fallback)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('sistem')
        .setDescription('Sistem kanallarını ayarla')
        .addChannelOption(opt =>
          opt.setName('rapor')
            .setDescription('Raporların düşeceği kanal')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addChannelOption(opt =>
          opt.setName('oneri')
            .setDescription('Önerilerin düşeceği kanal')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        )
        .addChannelOption(opt =>
          opt.setName('kayit')
            .setDescription('Kayıt kanalı')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .addSubcommand(sub =>
      sub
        .setName('goruntule')
        .setDescription('Mevcut ayarları göster'),
    ),

  guildOnly: true,
  category: 'Yönetim',

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const db = Database.getInstance().db;
    const guildId = interaction.guild!.id;
    const guildName = interaction.guild!.name;
    const sub = interaction.options.getSubcommand();

    // Sunucu kaydı yoksa oluştur
    await db
      .insert(guilds)
      .values({ id: guildId, name: guildName })
      .onConflictDoNothing();

    if (sub === 'goruntule') {
      const [cfg] = await db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
      if (!cfg) {
        await interaction.editReply({ content: '❌ Sunucu veritabanında bulunamadı.' });
        return;
      }

      const ch = (id: string | null | undefined) =>
        id ? `<#${id}>` : '`Ayarlanmamış`';

      const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('⚙️ Sunucu Ayarları')
        .setDescription(`**${guildName}** için mevcut yapılandırma`)
        .addFields(
          { name: '📋 Log Kanalları', value: [
            `Üye Log: ${ch(cfg.joinLogChannel)}`,
            `Mesaj Log: ${ch(cfg.messageLogChannel)}`,
            `Ses Log: ${ch(cfg.voiceLogChannel)}`,
            `Mod Log: ${ch(cfg.modLogChannel)}`,
            `Genel Log: ${ch(cfg.logChannel)}`,
          ].join('\n'), inline: false },
          { name: '⚙️ Sistem Kanalları', value: [
            `Rapor: ${ch(cfg.reportChannel)}`,
            `Öneri: ${ch(cfg.suggestionChannel)}`,
            `Kayıt: ${ch(cfg.registerChannel)}`,
          ].join('\n'), inline: false },
          { name: '🛡️ Koruma', value: [
            `Guard: ${cfg.guardEnabled ? '✅ Aktif' : '❌ Kapalı'}`,
            `Anti-Raid Limiti: ${cfg.antiRaidLimit} üye/10sn`,
            `Anti-Nuke: ${cfg.antiNukeEnabled ? '✅ Aktif' : '❌ Kapalı'}`,
            `Max Uyarı: ${cfg.maxWarns}`,
          ].join('\n'), inline: false },
        )
        .setFooter({ text: 'Kafadan Tayfa' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === 'log') {
      const uyeLog = interaction.options.getChannel('uye-log') as TextChannel | null;
      const mesajLog = interaction.options.getChannel('mesaj-log') as TextChannel | null;
      const sesLog = interaction.options.getChannel('ses-log') as TextChannel | null;
      const modLog = interaction.options.getChannel('mod-log') as TextChannel | null;
      const genelLog = interaction.options.getChannel('genel-log') as TextChannel | null;

      const updates: Partial<typeof guilds.$inferInsert> = {};
      if (uyeLog) updates.joinLogChannel = uyeLog.id;
      if (mesajLog) { updates.messageLogChannel = mesajLog.id; updates.messageLogEnabled = true; }
      if (sesLog) { updates.voiceLogChannel = sesLog.id; updates.voiceLogEnabled = true; }
      if (modLog) updates.modLogChannel = modLog.id;
      if (genelLog) updates.logChannel = genelLog.id;

      if (Object.keys(updates).length === 0) {
        await interaction.editReply({ content: '⚠️ Hiçbir kanal seçilmedi.' });
        return;
      }

      await db.update(guilds).set(updates).where(eq(guilds.id, guildId));

      const lines: string[] = [];
      if (uyeLog) lines.push(`✅ Üye Log → ${uyeLog}`);
      if (mesajLog) lines.push(`✅ Mesaj Log → ${mesajLog}`);
      if (sesLog) lines.push(`✅ Ses Log → ${sesLog}`);
      if (modLog) lines.push(`✅ Mod Log → ${modLog}`);
      if (genelLog) lines.push(`✅ Genel Log → ${genelLog}`);

      await interaction.editReply({
        content: `**Log kanalları güncellendi:**\n${lines.join('\n')}`,
      });
      return;
    }

    if (sub === 'sistem') {
      const rapor = interaction.options.getChannel('rapor') as TextChannel | null;
      const oneri = interaction.options.getChannel('oneri') as TextChannel | null;
      const kayit = interaction.options.getChannel('kayit') as TextChannel | null;

      const updates: Partial<typeof guilds.$inferInsert> = {};
      if (rapor) updates.reportChannel = rapor.id;
      if (oneri) updates.suggestionChannel = oneri.id;
      if (kayit) { updates.registerChannel = kayit.id; updates.registerEnabled = true; }

      if (Object.keys(updates).length === 0) {
        await interaction.editReply({ content: '⚠️ Hiçbir kanal seçilmedi.' });
        return;
      }

      await db.update(guilds).set(updates).where(eq(guilds.id, guildId));

      const lines: string[] = [];
      if (rapor) lines.push(`✅ Rapor kanalı → ${rapor}`);
      if (oneri) lines.push(`✅ Öneri kanalı → ${oneri}`);
      if (kayit) lines.push(`✅ Kayıt kanalı → ${kayit}`);

      await interaction.editReply({
        content: `**Sistem kanalları güncellendi:**\n${lines.join('\n')}`,
      });
    }
  },
};

export default command;
