import { type ButtonInteraction, EmbedBuilder } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { COLORS } from '../../../utils/constants.js';

// "toggle_" prefix'i ile gelen eski panelKur butonları
// "role_"   prefix'i ile gelen yeni welcome-setup butonları
// Her iki sistem de bu handler'a yönlendirilir.
const PREFIXES = ['toggle_', 'role_'] as const;

// Tüm sistemlerdeki buton ID → gerçek Discord rol adı eşlemesi
// Bu map sayesinde sunucuda hangi isimde rol varsa onu bul
const BUTTON_TO_ROLE: Record<string, string> = {
  // welcome-setup.ts butonları
  'role_oyun':      'Oyun',
  'role_muzik':     'Muzik',
  'role_18':        '+18',
  'role_camera':    'Camera',
  'role_streamer':  'Streamer',
  // panelKur.ts → toggle_ butonları (rol adı direkt suffix'te)
  // Bu butonlar aşağıdaki dynamik mantıkla zaten çözülüyor.
};

const CATEGORY_MAP: Record<string, string> = {
  'Oyun':               'Oyun',
  'Muzik':              'Eğlence',
  '+18':                'İçerik',
  'Camera':             'Sosyal',
  'Streamer':           'Sosyal',
  'Kamera Erisimi':     'Sosyal',
  'Minecraft':          'Oyun',
  'League of Legends':  'Oyun',
  'Valorant':           'Oyun',
  'CS2':                'Oyun',
  'Etkinlik Bildirimi': 'Bildirim',
  'Duo Arama Bildirimi':'Bildirim',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'Oyun':               'Oyun ses kanallarına erişim sağlar.',
  'Muzik':              'Müzik odalarına erişim sağlar.',
  '+18':                'Yetişkin içerik kanallarına erişim açılır.',
  'Camera':             'Ses kanallarında kameranı kullanabilirsin.',
  'Streamer':           'Yayın açma ve ekran paylaşma yetkisi verir.',
  'Kamera Erisimi':     'Ses kanallarında kameranı kullanabilirsin.',
  'Minecraft':          'Minecraft oyuncusu etiketidir.',
  'League of Legends':  'LoL oyuncusu etiketidir.',
  'Valorant':           'Valorant oyuncusu etiketidir.',
  'CS2':                'CS2 oyuncusu etiketidir.',
  'Etkinlik Bildirimi': 'Özel etkinlik duyurularından haberdar olursun.',
  'Duo Arama Bildirimi':'Duo arama bildirimlerini alırsın.',
};

// Bu handler'ın sorumlu olduğu tüm prefix/id'ler
export const prefix = 'toggle_';
export const prefix2 = 'role_';
export const customId = 'toggle_help';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Bu komut sunucuda kullanılmalıdır.', ephemeral: true });
    return;
  }

  // Yardım butonu
  if (interaction.customId === 'toggle_help') {
    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🎭 Rol Bilgileri')
      .setDescription([
        '**🎮 Oyun Rolleri**',
        '`Minecraft` — Minecraft oyuncusu etiketi.',
        '`League of Legends` — LoL oyuncusu etiketi.',
        '`Valorant` — Valorant oyuncusu etiketi.',
        '`CS2` — CS2 oyuncusu etiketi.',
        '',
        '**📣 Sosyal Roller**',
        '`Camera` — Ses kanallarında kamera açma izni.',
        '`Streamer` — Yayın ve ekran paylaşma yetkisi.',
        '',
        '**🔔 Bildirim Rolleri**',
        '`Etkinlik Bildirimi` — Özel etkinliklerden haberdar ol.',
        '`Duo Arama Bildirimi` — Duo arama bildirimlerini al.',
        '',
        '**🎵 Diğer**',
        '`Oyun` — Oyun ses kanallarına erişim.',
        '`Muzik` — Müzik kanallarına erişim.',
        '`+18` — Yetişkin içerik kanallarına erişim.',
      ].join('\n'))
      .setFooter({ text: 'Kafadan Tayfa' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // Rol adını belirle: önce BUTTON_TO_ROLE haritasına bak, yoksa prefix'i temizle
  let roleName: string | null = BUTTON_TO_ROLE[interaction.customId] ?? null;
  if (!roleName) {
    for (const prefix of PREFIXES) {
      if (interaction.customId.startsWith(prefix)) {
        roleName = interaction.customId.slice(prefix.length);
        break;
      }
    }
  }

  if (!roleName) {
    await interaction.reply({ content: '❌ Geçersiz buton.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Rol adıyla bul (büyük/küçük harf duyarsız)
    const role = interaction.guild.roles.cache.find(
      r => r.name.toLowerCase() === roleName!.toLowerCase(),
    );

    if (!role) {
      await interaction.editReply({ content: `❌ \`${roleName}\` rolü sunucuda bulunamadı.` });
      return;
    }

    const hasRole = member.roles.cache.has(role.id);
    const category = CATEGORY_MAP[role.name] || 'Diğer';
    const desc = ROLE_DESCRIPTIONS[role.name] || '';

    if (hasRole) {
      await member.roles.remove(role, 'Rol paneli');
    } else {
      await member.roles.add(role, 'Rol paneli');
    }

    const embed = new EmbedBuilder()
      .setColor(hasRole ? COLORS.danger : COLORS.success)
      .setAuthor({
        name: hasRole ? '🗑️ Rol Kaldırıldı' : '✅ Rol Eklendi',
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription([
        `**${hasRole ? 'Çıkarılan' : 'Eklenen'}:** ${role.name}`,
        desc ? `*${desc}*` : '',
        `Kategori: **${category}**`,
      ].filter(Boolean).join('\n'))
      .setFooter({ text: 'Kafadan Tayfa' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    client.logger.error('Toggle rol hatası:', error);
    await interaction.editReply({ content: '❌ Rol değiştirilirken hata oluştu.' }).catch(() => {});
  }
}
