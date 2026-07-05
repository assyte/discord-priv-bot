import Parser from 'rss-parser';
import TurndownService from 'turndown';
import cron from 'node-cron';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { getClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('CS2PatchNotesService');
const parser = new Parser();
const turndownService = new TurndownService();

// Configure turndown for Discord Markdown
turndownService.addRule('discord_bold', {
  filter: ['b', 'strong'],
  replacement: (content) => `**${content}**`
});
turndownService.addRule('discord_italic', {
  filter: ['i', 'em'],
  replacement: (content) => `*${content}*`
});

const RSS_FEED_URL = 'https://store.steampowered.com/feeds/news/app/730/';

export class CS2PatchNotesService {
  private static isRunning = false;

  static async init() {
    logger.info('Initializing CS2 Patch Notes Service...');
    
    // Check every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkForUpdates();
    });

    // Run once on startup after 10 seconds to allow bot to settle
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);
  }

  static async checkForUpdates() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const feed = await parser.parseURL(RSS_FEED_URL);
      if (!feed.items || feed.items.length === 0) return;

      const updateItems = feed.items.filter(item => {
        const title = (item.title || '').toLowerCase();
        return title.includes('release notes') || title.includes('counter-strike 2 update') || title.includes('update');
      });

      if (updateItems.length === 0) return;

      // Chronological order (oldest first)
      updateItems.reverse();

      const conn = await dbPool.getConnection();
      let lastGuid: string | null = null;
      try {
        const [rows]: any = await conn.query('SELECT setting_value FROM bot_settings WHERE setting_key = "last_patch_note_guid"');
        if (rows && rows.length > 0) {
          lastGuid = rows[0].setting_value;
        }
      } finally {
        conn.release();
      }

      const lastIndex = updateItems.findIndex(item => item.guid === lastGuid);
      let itemsToProcess: any[] = [];

      if (lastGuid === null) {
        // First run, just get the newest one
        itemsToProcess = [updateItems[updateItems.length - 1]!];
      } else if (lastIndex !== -1) {
        // Get everything newer than the last processed guid
        itemsToProcess = updateItems.slice(lastIndex + 1);
      } else {
        // lastGuid fell off the feed. Just get the newest one to avoid spamming the whole feed.
        itemsToProcess = [updateItems[updateItems.length - 1]!];
      }

      for (const item of itemsToProcess) {
        await this.postPatchNotes(item);
        
        const conn2 = await dbPool.getConnection();
        try {
          await conn2.query(`
            INSERT INTO bot_settings (setting_key, setting_value) 
            VALUES ('last_patch_note_guid', ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
          `, [item.guid, item.guid]);
          lastGuid = item.guid;
        } finally {
          conn2.release();
        }
      }
    } catch (error) {
      logger.error('Error fetching CS2 patch notes:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private static async postPatchNotes(item: Parser.Item) {
    const client = getClient();
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) return;

    const channel = await guild.channels.fetch('1523292363454283818').catch(() => null) as TextChannel | null;
    if (!channel) {
      logger.warn('Patch notes channel 1523292363454283818 not found');
      return;
    }

    // Convert HTML to Markdown
    let content = item.content || item.contentSnippet || 'No details provided.';
    content = turndownService.turndown(content);

    // If the content is too long for Discord Embed description (4096 limit)
    if (content.length > 4000) {
      content = content.substring(0, 4000) + '...\n\n**[Read more on Steam](' + item.link + ')**';
    }

    const embed = new EmbedBuilder()
      .setColor(0xE4A12B) // CS2 Orange/Gold color
      .setTitle('📢 ' + (item.title || 'CS2 Update'))
      .setURL(item.link || 'https://blog.counter-strike.net/')
      .setDescription(content)
      .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date())
      .setFooter({ text: 'Valve Official • CS2 Release Notes', iconURL: 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/730/69f7ebe2735c366c65c0b33dae00e12dc40edbe4.jpg' });

    // Try to extract an image if any
    const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      embed.setImage(imgMatch[1]);
    }

    try {
      await channel.send({ 
        content: '**New CS2 Update Released!**', 
        embeds: [embed],
        allowedMentions: { parse: [] } 
      });
      logger.info('Successfully posted patch notes: ' + item.title);
    } catch (err) {
      logger.error('Failed to post patch notes to channel:', err);
    }
  }
}
