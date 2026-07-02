import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { Message, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const DARK = 0x2B2D31;
const PANEL_CHANNEL_ID = '1521954113582268482';

export async function messageCreate(client: Client, message: Message) {
  if (message.author.bot || !message.guild) return;
  if (message.content !== '.oda-kur') return;
  if (!message.member?.permissions.has('Administrator')) {
    await message.reply('Bu komutu sadece yoneticiler kullanabilir.');
    return;
  }

  const panelChannel = message.guild.channels.cache.get(PANEL_CHANNEL_ID);
  if (!panelChannel?.isTextBased()) {
    await message.reply('Panel kanali bulunamadi.');
    return;
  }

  const categoryId = panelChannel.parentId;
  if (!categoryId) {
    await message.reply('Panel kanali bir kategori icinde degil.');
    return;
  }

  // Clear old bot messages
  const old = await (panelChannel as TextChannel).messages.fetch({ limit: 50 });
  const botMsgs = old.filter(m => m.author.id === message.client.user!.id);
  for (const [, m] of botMsgs) await m.delete().catch(() => {});

  const embed = new EmbedBuilder()
    .setColor(DARK)
    .setTitle('✨ Özel Ses Kanalı Sistemi')
    .setDescription([
      '**Kendine ait, tamamen kontrol edebileceğin bir oda oluştur.**',
      '',
      'Aşağıdaki `Oda Oluştur` butonuna tıklayarak saniyeler içinde',
      'özel ses kanalını açabilirsin.',
      '',
      '`>` **Kanalını Yönet (Oda İçi Sohbetten)**',
      '`>` ✏️ İsmini değiştir',
      '`>` 👥 Kişi sınırı koy',
      '`>` 🔒 Kilitle / Aç',
      '`>` 👁️ Odayı gizle',
      '',
      '*(Oda tamamen boşaldığında 60 saniye içinde otomatik kapanır)*',
    ].join('\n'))
    .setImage('https://cdn.discordapp.com/attachments/1521954113582268482/1522142024034287697/ozel-oda.png?ex=6a4764ba&is=6a46133a&hm=61b8fbe713f45ab5256776adcc93f13a7a9907742b76662cbc4427bd77ef9d10&')
    .setFooter({ text: 'Kafadan Tayfa Premium Altyapısı' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('oda_olustur')
      .setLabel('Oda Oluştur')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Success),
  );

  await (panelChannel as TextChannel).send({ embeds: [embed], components: [row] });
  await message.delete().catch(() => {});
}
