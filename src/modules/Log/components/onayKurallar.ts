import { ButtonStyle, type ButtonInteraction, ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const DARK = 0x2B2D31;

export const customId = 'onay_kurallar';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const uye = interaction.guild.roles.cache.get('1521879823855779950');
  const kayitsiz = interaction.guild.roles.cache.get('1521879827324469328');

  if (!uye) {
    await interaction.editReply({ content: 'Üye rolü (ID: 1521879823855779950) sunucuda bulunamadı.' });
    return;
  }

  if (member.roles.cache.has(uye.id)) {
    await interaction.editReply({ content: 'Zaten kayıtlısın!' });
    return;
  }

  try {
    await member.roles.add(uye, 'Kurallar onayi');
    if (kayitsiz && member.roles.cache.has(kayitsiz.id)) {
      await member.roles.remove(kayitsiz, 'Kurallar onayi');
    }

    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setTitle('✅ Kayıt Başarıldı')
      .setDescription([
        `${interaction.user.toString()} tebrikler, artık resmi bir üyesin!`,
        '',
        'Aşağıdaki kanallara erişebilirsin:',
        `<#chat> — Sohbet`,
        `<#rol-al> — Rol secimi`,
        `<#foto-chat> — Medya paylasimi`,
      ].join('\n'))
      .setFooter({ text: 'Kafadan Tayfa' })
      .setTimestamp();

    const redirectButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('redirect_chat')
        .setLabel('Sohbete Basla')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('redirect_roles')
        .setLabel('Rol Al')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({ embeds: [embed], components: [redirectButtons] });

    const hosgeldin = interaction.guild.channels.cache.get('1521904324266037338');
    if (hosgeldin?.isTextBased()) {
      const bildirim = new EmbedBuilder()
        .setColor(DARK)
        .setAuthor({ name: '🎉 Yeni Üye Katıldı!', iconURL: interaction.guild.iconURL() || undefined })
        .setDescription([
          `Aramıza hoş geldin ${interaction.user.toString()}!`,
          '',
          `Seninle birlikte koca bir aile olarak tam **${interaction.guild.memberCount}** kişi olduk.`,
          `Kuralları onaylayıp Kabilemize katıldığın için teşekkürler! 🥳`
        ].join('\n'))
        .setImage('https://cdn.discordapp.com/attachments/1521954113582268482/1522146902651441332/kafadan-welcome.png?ex=6a476945&is=6a4617c5&hm=5160daa7c4e1339102a0fd32457fce8a35fbaa677d999101c6ba13f35bf682f3&')
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
        .setFooter({ text: 'Kafadan Tayfa' })
        .setTimestamp();
      await hosgeldin.send({ embeds: [bildirim] }).catch(() => {});
    }
  } catch (error) {
    await interaction.editReply({ content: 'Bir hata olustu. Lutfen yetkiliye basvur.' });
  }
}
