import { createEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';

export class AppealSystem {
  static createAppealEmbed(options: {
    userId: string;
    userName: string;
    punishmentType: string;
    punishmentReason: string;
    appealReason: string;
  }) {
    return createEmbed({
      title: '📋 Ceza İtirazı',
      color: COLORS.warning,
      fields: [
        { name: 'Kullanıcı', value: `${options.userName} (${options.userId})`, inline: false },
        { name: 'Ceza Türü', value: options.punishmentType, inline: true },
        { name: 'Ceza Sebebi', value: options.punishmentReason, inline: false },
        { name: 'İtiraz Sebebi', value: options.appealReason, inline: false },
      ],
      footer: `İtiraz eden: ${options.userId}`,
    });
  }
}
