import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';

const categoryEmojis: Record<string, string> = {
  'Moderasyon': '🛡️',
  'Rapor': '📝',
  'Öneri': '💡',
  'Yardım': '❓',
};

const categoryDescriptions: Record<string, string> = {
  'Moderasyon': 'Sunucu düzeni ve üye yönetimi',
  'Rapor': 'Şüpheli üyeleri bildirin',
  'Öneri': 'Sunucu için fikirlerinizi paylaşın',
};

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('yardım')
    .setDescription('Tüm komutları ve bot bilgilerini göster'),

  guildOnly: true,
  cooldown: 5,
  category: 'Yardım',

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const commands = client.commandHandler.commands;
    const total = commands.size;

    const grouped: Record<string, string[]> = {};
    commands.forEach((cmd) => {
      const cat = cmd.category || 'Diğer';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(`\`/${cmd.data.name}\``);
    });

    const fields = Object.entries(grouped).map(([cat, cmds]) => ({
      name: `${categoryEmojis[cat] || '📌'} ${cat} — *${cmds.length} komut*`,
      value: `${categoryDescriptions[cat] || ''}\n${cmds.join(' · ')}`,
    }));

    fields.push({
      name: '📊 Toplam',
      value: `Botta **${total}** komut bulunuyor.`,
    });

    const embed = createEmbed({
      title: '✦ 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐁𝐎𝐓 ✦',
      description: [
        '> *Türkçe, hızlı ve güvenilir moderasyon botu*',
        '',
        '**╭━━━━━━━━━━━━━━━━━━━━╮**',
        '**┃** Sunucunuzu korumak, yönetmek',
        '**┃** ve geliştirmek için tasarlandı.',
        '**╰━━━━━━━━━━━━━━━━━━━━╯**',
        '',
        '✦ **Özellikler:**',
        '🛡️ Gelişmiş moderasyon sistemi',
        '📝 Kullanıcı raporlama',
        '💡 Öneri ve oylama sistemi',
        '📋 Detaylı log kayıtları',
      ].join('\n'),
      color: COLORS.primary,
      fields,
      footer: { text: 'dev by assyte' },
      timestamp: true,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
