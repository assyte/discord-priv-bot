import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
  PermissionFlagsBits, SlashCommandBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('panel-kur')
    .setDescription('Rol panelini kurar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });
    const g = interaction.guild!;

    const rolAl = g.channels.cache.get('1521904325855547593');
    if (!rolAl?.isTextBased()) {
      await interaction.editReply({ content: 'rol-al kanali bulunamadi.' });
      return;
    }

    const old = await rolAl.messages.fetch({ limit: 50 });
    const botMsgs = old.filter(m => m.author.id === client.client.user!.id);
    for (const [, m] of botMsgs) await m.delete().catch(() => {});

    const panel = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle('Rol Seçim Paneli')
      .setDescription([
        'Kendine uygun rolleri seç, tekrar tıklayarak bırakabilirsin.',
        '',
        '**Sosyal Roller**',
        '`Kamera Erisimi` — Kamerani kullanabilirsin',
        '`Streamer` — Yayin acma yetkisi',
        '',
        '**Oyun Rolleri**',
        '`Minecraft` — Minecraft oyuncusu',
        '`League of Legends` — LoL oyuncusu',
        '`Valorant` — Valorant oyuncusu',
        '`CS2` — CS2 oyuncusu',
        '',
        '**Bildirim Rolleri**',
        '`Etkinlik Bildirimi` — Etkinlik duyurulari',
        '`Duo Arama Bildirimi` — Duo arama bildirimleri',
      ].join('\n'))
      .setFooter({ text: 'Kafadan Tayfa' });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('toggle_Kamera Erisimi').setLabel('Kamera').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('toggle_Streamer').setLabel('Streamer').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('toggle_Minecraft').setLabel('MC').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('toggle_League of Legends').setLabel('LoL').setStyle(ButtonStyle.Primary),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('toggle_Valorant').setLabel('Valorant').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('toggle_CS2').setLabel('CS2').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('toggle_Etkinlik Bildirimi').setLabel('Etkinlik').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('toggle_Duo Arama Bildirimi').setLabel('DuoAra').setStyle(ButtonStyle.Secondary),
    );

    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('toggle_help').setLabel('Rol Bilgisi').setStyle(ButtonStyle.Danger),
    );

    await rolAl.send({
      embeds: [panel],
      components: [row1, row2, row3],
    });

    await interaction.editReply({ content: 'Panel kuruldu.' });
  },
};

export default command;
