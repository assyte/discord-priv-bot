import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import type { Guild, TextChannel } from 'discord.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('RulesPanel');

const RULES_CHANNEL_ID = '1522961874541609150';
const VERIFIED_ROLE_ID = '1522961865595158611';
const UNVERIFIED_ROLE_ID = '1522961867025416202';
const BUTTON_CUSTOM_ID = 'rules_accept';

export async function initRulesPanel(guild: Guild) {
  try {
    const channel = await guild.channels.fetch(RULES_CHANNEL_ID) as TextChannel | null;
    if (!channel || channel.type !== ChannelType.GuildText) {
      logger.warn(`Rules channel ${RULES_CHANNEL_ID} not found or not a text channel`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📜 Server Rules')
      .setDescription(
        'Welcome to **Clutch.gg** — the ultimate FACEIT & CS community!\n\n' +
        'Please read and accept the rules below to gain full access.'
      )
      .addFields(
        {
          name: '1️⃣ Respect All Members',
          value: 'Treat everyone with respect. Harassment, discrimination, hate speech, or any form of toxicity will not be tolerated.'
        },
        {
          name: '2️⃣ No Cheating or Hacking',
          value: 'Any form of cheating, hacking, or exploiting in CS2 / CS 1.6 / FACEIT will result in an immediate ban. This includes third-party software, config manipulation, and account boosting.'
        },
        {
          name: '3️⃣ No Spam or Self-Promotion',
          value: 'Do not spam messages, mentions, or commands. Advertising other Discord servers, streaming channels, or services is prohibited unless explicitly allowed.'
        },
        {
          name: '4️⃣ Use Appropriate Channels',
          value: 'Keep conversations in their designated channels. Voice chat, text chat, and game-specific discussions each have their own place.'
        },
        {
          name: '5️⃣ Follow FACEIT & Steam ToS',
          value: 'All server activities must comply with FACEIT and Steam terms of service. Violations on those platforms may result in server-wide action.'
        },
        {
          name: '6️⃣ No Toxic Behavior',
          value: 'Rage, intentional team damage, griefing, and excessive negativity ruin the experience for everyone. Play fair and keep it clean.'
        },
        {
          name: '7️⃣ Private Room Conduct',
          value: 'Respect room owners\' rules in private voice channels. The host has final say over who joins their room.'
        },
        {
          name: '8️⃣ Verification Required',
          value: 'You must link your Steam and FACEIT accounts via the web portal to unlock rank roles and activity tracking.'
        }
      )
      .setFooter({
        text: 'Clutch.gg • Accept the rules to unlock the server',
        iconURL: guild.iconURL() ?? undefined
      })
      .setTimestamp();

    const acceptButton = new ButtonBuilder()
      .setCustomId(BUTTON_CUSTOM_ID)
      .setLabel('✓ Accept Rules')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton);

    const existingMessages = await channel.messages.fetch({ limit: 50 });

    const botId = guild.client.user?.id;
    if (!botId) return;

    const existingPanel = existingMessages.find(m => {
      if (m.author.id !== botId || !m.components.length) return false;
      const firstRow = m.components.at(0);
      if (!firstRow || !('components' in firstRow)) return false;
      return firstRow.components.some((c: any) => c.customId === BUTTON_CUSTOM_ID);
    });

    if (existingPanel) {
      await existingPanel.edit({ embeds: [embed], components: [row] });
      logger.info('Rules panel updated');
    } else {
      await channel.send({ embeds: [embed], components: [row] });
      logger.info('Rules panel posted');
    }
  } catch (error) {
    logger.error('Failed to initialize rules panel', error);
  }
}

export async function handleRulesAccept(interaction: import('discord.js').ButtonInteraction) {
  const member = interaction.member;
  if (!member || !('roles' in member)) {
    return interaction.reply({ content: 'Could not process your request.', ephemeral: true });
  }

  const memberRoles = member.roles as import('discord.js').GuildMemberRoleManager;

  if (memberRoles.cache.has(VERIFIED_ROLE_ID)) {
    return interaction.reply({ content: 'You have already accepted the rules!', ephemeral: true });
  }

  await memberRoles.add(VERIFIED_ROLE_ID);
  await memberRoles.remove(UNVERIFIED_ROLE_ID);

  await interaction.reply({
    content: '✅ Rules accepted! You now have full access to the server.',
    ephemeral: true
  });
}
