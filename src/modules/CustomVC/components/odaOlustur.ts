import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { createChannels, getOwnerChannel } from '../utils/odaManager.js';

const DARK = 0x2B2D31;
const PANEL_CHANNEL_ID = '1521954113582268482';

export const customId = 'oda_olustur';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  const panelChannel = interaction.guild.channels.cache.get(PANEL_CHANNEL_ID);
  if (!panelChannel) {
    await interaction.editReply({ content: 'Panel kanali bulunamadi.' });
    return;
  }

  const categoryId = panelChannel.parentId;
  if (!categoryId) {
    await interaction.editReply({ content: 'Kategori bulunamadi.' });
    return;
  }

  const existing = getOwnerChannel(interaction.guild, interaction.user.id);
  if (existing) {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription(`Zaten bir odan var: ${existing.toString()}`)
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const userTag = interaction.user.username;
  const voiceChannel = await createChannels(interaction.guild, interaction.user.id, categoryId, `${userTag}-oda`);
  if (!voiceChannel) {
    await interaction.editReply({
      content: 'Oda olusturulamadi. Botun yeterli yetkisi yok veya ayni isimde oda mevcut.',
    });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (member.voice.channelId) {
    await member.voice.setChannel(voiceChannel).catch(() => {});
  }

  // Sahibe gizli mesaj (Oluşturuldu bilgisi)
  const createdEmbed = new EmbedBuilder()
    .setColor(DARK)
    .setTitle('✨ Odan Başarıyla Oluşturuldu!')
    .setDescription([
      `${interaction.user.toString()}`,
      '',
      `👉 **Odan:** ${voiceChannel.toString()}`,
      '',
      '> *Odanın sağ üst köşesindeki sohbet ikonuna tıklayarak*',
      '> *kontrol panelini görebilir ve ayarlarını yapabilirsin.*',
      '',
      'Oda tamamen boşaldığında 60 saniye içinde otomatik kapanır.'
    ].join('\n'))
    .setFooter({ text: 'dev by assyte' })
    .setTimestamp();

  await interaction.editReply({ embeds: [createdEmbed] });

  // Voice Channel Chat'ine Kontrol Panelini Gönder
  const controlEmbed = new EmbedBuilder()
    .setColor(DARK)
    .setAuthor({ name: `${interaction.user.username}'in Yönetim Paneli`, iconURL: interaction.user.displayAvatarURL() })
    .setDescription([
      `**Hoş geldin!** Bu oda tamamen sana ait.`,
      `Aşağıdaki butonları kullanarak odanı dilediğin gibi özelleştirebilirsin.`,
      '',
      `**Yetkili:** ${interaction.user.toString()}`,
      `**Durum:** 🟢 Açık (Herkes Girebilir)`
    ].join('\n'))
    .setImage('https://cdn.discordapp.com/attachments/1521954113582268482/1522142024034287697/ozel-oda.png?ex=6a4764ba&is=6a46133a&hm=61b8fbe713f45ab5256776adcc93f13a7a9907742b76662cbc4427bd77ef9d10&')
    .setFooter({ text: 'Oda ayarlarınızı sadece oda sahibi kullanabilir.' });

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('oda_isim')
      .setLabel('İsim Değiştir')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('oda_limit')
      .setLabel('Kişi Limiti')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('oda_kilit')
      .setLabel('Odayı Kilitle')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('oda_gizle')
      .setLabel('Gizle / Göster')
      .setEmoji('👁️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('oda_kapat')
      .setLabel('Odayı Kapat')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger),
  );

  // Bu mesaj doğrudan ses kanalının sohbet kısmına (Voice Text Chat) gider
  await voiceChannel.send({ embeds: [controlEmbed], components: [row1, row2] });
}
