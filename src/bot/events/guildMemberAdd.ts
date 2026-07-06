import { Events, GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { assignVerifiedRoles, assignSteamVerifiedRole, assignFastcupRoles } from '../services/roleManager.js';
import { Logger } from '../../utils/logger.js';
import { InviteTracker } from '../services/inviteTracker.js';

const logger = new Logger('GuildMemberAdd');

const JOIN_ROLE_ID = process.env.ROLE_UNVERIFIED || '1522961867025416202';
const WELCOME_CHANNEL_ID = '1523040262278873158';

export default {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(client: ClutchClient, member: GuildMember) {
    console.log(`[RAW LOG] GuildMemberAdd triggered for: ${member.user.tag} (${member.id})`);
    
    // 1. Check if user is already verified in DB
    let isVerifiedUser = false;
    try {
      const conn = await dbPool.getConnection();
      try {
        const rows = await conn.query('SELECT * FROM users WHERE discord_id = ? AND is_verified = 1', [member.id]);
        if (rows && rows.length > 0) {
          isVerifiedUser = true;
          const u = rows[0];
          logger.info(`Returning verified user detected: ${member.user.tag}. Restoring roles.`);
          if (u.faceit_level) await assignVerifiedRoles(member.id, u.faceit_level);
          if (u.steam_id_64) await assignSteamVerifiedRole(member.id);
          if (u.fastcup_level) await assignFastcupRoles(member.id, u.fastcup_level);
        }
      } finally {
        conn.release();
      }
    } catch (e) {
      logger.error(`Error checking verification status on join for ${member.user.tag}:`, e);
    }

    // 2. Assign Join Role (only if not verified)
    if (!isVerifiedUser) {
      try {
        await member.roles.add(JOIN_ROLE_ID);
        logger.info(`Assigned join role to ${member.user.tag} (${member.id})`);
      } catch (error) {
        logger.error(`Failed to assign join role to ${member.user.tag}:`, error);
      }
    }

    // 3. Process Invite Tracking
    await InviteTracker.handleMemberJoin(member);

    // 4. Send Welcome Embed
    try {
      const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null) as TextChannel;
      if (channel) {
        const accountCreationDate = Math.floor(member.user.createdTimestamp / 1000);
        
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x2B2D31)
          .setAuthor({ name: `${member.user.username} joined the server!`, iconURL: member.user.displayAvatarURL() })
          .setTitle('👋 Welcome to FACEITLUTCH!')
          .setDescription(`Hey <@${member.id}>, welcome to our community! Make sure to verify your Steam/Faceit/Fastcup account to access all premium features and channels.`)
          .addFields(
            { name: '👤 Username', value: `\`${member.user.username}\``, inline: true },
            { name: '📅 Account Created', value: `<t:${accountCreationDate}:R>`, inline: true },
            { name: '📊 Member Count', value: `You are our **${member.guild.memberCount}th** member!`, inline: false }
          )
          .setThumbnail(member.user.displayAvatarURL({ size: 512 }))
          .setImage('https://cdn.discordapp.com/attachments/1183060249568215160/1183060250025381908/premium_banner.gif') // You can change or remove this banner
          .setFooter({ text: 'Clutch Premium Services', iconURL: member.guild.iconURL() || undefined })
          .setTimestamp();

        await channel.send({ content: `<@${member.id}>`, embeds: [welcomeEmbed] });
      }
    } catch (error) {
      logger.error(`Failed to send welcome message for ${member.user.tag}:`, error);
    }
  }
};
