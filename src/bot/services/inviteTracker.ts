import { Collection, Invite, Guild } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { Logger } from '../../utils/logger.js';
import { EconomyService } from './economyService.js';
import { CoinLogger } from './coinLogger.js';

const logger = new Logger('InviteTracker');

export class InviteTracker {
  // Map of Guild ID -> (Map of Invite Code -> Invite)
  private static invites = new Collection<string, Collection<string, Invite>>();

  static async init(client: ClutchClient) {
    client.on('inviteCreate', async (invite) => {
      const guildInvites = this.invites.get(invite.guild?.id || '');
      if (guildInvites && invite.code) {
        guildInvites.set(invite.code, invite as Invite);
      }
    });

    client.on('inviteDelete', async (invite) => {
      const guildInvites = this.invites.get(invite.guild?.id || '');
      if (guildInvites && invite.code) {
        guildInvites.delete(invite.code);
      }
    });

    // Cache initial invites
    for (const [, guild] of client.guilds.cache) {
      try {
        const guildInvites = await guild.invites.fetch();
        this.invites.set(guild.id, guildInvites);
        logger.info(`Cached ${guildInvites.size} invites for guild ${guild.id}`);
      } catch (err) {
        logger.error(`Failed to fetch invites for guild ${guild.id}:`, err);
      }
    }
  }

  /**
   * Identifies which invite was used by the newly joined member and rewards the inviter.
   */
  static async handleMemberJoin(member: import('discord.js').GuildMember) {
    const guild = member.guild;
    const cachedInvites = this.invites.get(guild.id);
    
    if (!cachedInvites) return;

    try {
      const newInvites = await guild.invites.fetch();
      const usedInvite = newInvites.find(inv => {
        const cachedInv = cachedInvites.get(inv.code);
        if (!cachedInv) return false;
        return (inv.uses || 0) > (cachedInv.uses || 0);
      });

      // Update cache
      this.invites.set(guild.id, newInvites);

      if (usedInvite && usedInvite.inviter && !usedInvite.inviter.bot) {
        logger.info(`${member.user.tag} joined using invite from ${usedInvite.inviter.tag} (Code: ${usedInvite.code})`);
        
        // Award coins to inviter
        const reward = 100;
        await EconomyService.addCoins(usedInvite.inviter.id, reward);
        CoinLogger.log(usedInvite.inviter.id, reward, `Invited ${member.user.username}`, '📨');
      } else {
        logger.info(`Could not determine invite for ${member.user.tag}`);
      }
    } catch (err) {
      logger.error(`Failed to process invite for ${member.user.tag}:`, err);
    }
  }
}
