import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('toplu-kayit')
    .setDescription('Rolü olmayan tüm üyelere otomatik olarak "Üye" rolü atar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: '❌ Bu komut yalnızca bir sunucuda kullanılabilir.' });
      return;
    }

    // Fetch all members from the guild
    await interaction.editReply({ content: '⏳ Tüm sunucu üyeleri yükleniyor...' });
    let allMembers;
    try {
      allMembers = await guild.members.fetch();
    } catch (err) {
      client.logger?.error('toplu-kayit: Üyeler alınırken hata oluştu:', err);
      await interaction.editReply({ content: '❌ Üyeler alınırken bir hata oluştu. Lütfen tekrar deneyin.' });
      return;
    }

    // Find the 'Üye' role
    const uyeRole = guild.roles.cache.find((r) => r.name === 'Üye');
    if (!uyeRole) {
      await interaction.editReply({ content: '❌ Sunucuda **"Üye"** adında bir rol bulunamadı.' });
      return;
    }

    // Filter: non-bot members who don't have the 'Üye' role
    const targets = allMembers.filter(
      (member) => !member.user.bot && !member.roles.cache.has(uyeRole.id),
    );

    const totalTargets = targets.size;
    if (totalTargets === 0) {
      await interaction.editReply({
        content: '✅ **"Üye"** rolü atanmayı bekleyen hiçbir üye bulunamadı. Tüm üyeler zaten kayıtlı!',
      });
      return;
    }

    await interaction.editReply({
      content: `🚀 Toplu kayıt başlatıldı. **${totalTargets}** üyeye **"Üye"** rolü atanacak...`,
    });

    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;

    for (const [, member] of targets) {
      try {
        await member.roles.add(uyeRole, 'Toplu kayıt komutu ile otomatik rol atama');
        successCount++;
      } catch (err) {
        errorCount++;
        client.logger?.error(
          `toplu-kayit: ${member.user.tag} (${member.id}) kullanıcısına rol atanamadı:`,
          err,
        );
      }

      processedCount++;

      // Update progress every 50 members
      if (processedCount % 50 === 0) {
        try {
          await interaction.editReply({
            content: [
              `⏳ **Toplu kayıt devam ediyor...**`,
              ``,
              `• İşlenen : **${processedCount}** / **${totalTargets}**`,
              `• Başarılı : **${successCount}**`,
              `• Hatalı   : **${errorCount}**`,
            ].join('\n'),
          });
        } catch (editErr) {
          client.logger?.error('toplu-kayit: İlerleme mesajı güncellenemedi:', editErr);
        }
      }

      // Rate limit protection: wait 200ms between each role assignment
      await new Promise((r) => setTimeout(r, 200));
    }

    // Final summary
    const summaryLines = [
      `✅ **Toplu kayıt tamamlandı!**`,
      ``,
      `• Toplam hedef : **${totalTargets}**`,
      `• Başarıyla atandı : **${successCount}**`,
    ];

    if (errorCount > 0) {
      summaryLines.push(`• Hata oluşan : **${errorCount}** (loglara bakın)`);
    }

    await interaction.editReply({ content: summaryLines.join('\n') });
  },
};

export default command;
