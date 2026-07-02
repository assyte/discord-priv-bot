import { type Message, EmbedBuilder } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { COLORS } from '../../../utils/constants.js';

export async function messageCreate(client: Client, message: Message) {
  if (!message.guild || message.author.bot) return;

  if (message.content.startsWith('.isim ')) {
    const newName = message.content.slice('.isim '.length).trim();
    if (!newName) return;

    if (!message.member?.premiumSince) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.danger)
        .setDescription('❌ **Erişim Reddedildi!**\n\nBu komutu (`.isim`) sadece sunucumuza **Takviye (Boost)** basan seçkin üyelerimiz kullanabilir.')
        .setFooter({ text: 'Kafadan Tayfa Premium' });
      await message.reply({ embeds: [embed] }).catch(() => {});
      return;
    }

    try {
      await message.member.setNickname(newName, 'Boostlu Üye .isim komutu');
      const embed = new EmbedBuilder()
        .setColor(COLORS.success)
        .setDescription(`✅ İsminiz başarıyla **${newName}** olarak değiştirildi!`)
        .setFooter({ text: 'Kafadan Tayfa Premium' });
      await message.reply({ embeds: [embed] }).catch(() => {});
    } catch (error) {
      client.logger.error('.isim değiştirme hatası:', error);
      await message.reply({ content: '❌ İsminizi değiştirirken bir hata oluştu. (Sunucu sahibiyseniz veya botun yetkisi sizden düşükse değiştiremez)' }).catch(() => {});
    }
  }
}
