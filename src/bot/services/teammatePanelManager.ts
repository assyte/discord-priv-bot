import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Client,
  TextChannel,
  Interaction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  GuildMemberRoleManager
} from 'discord.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';
import { STEAM_VERIFIED_ROLE_ID } from './roleManager.js';

const logger = new Logger('TeammatePanelManager');

// Channels
const CHANNELS = {
  CS2_MM: '1523058345928429669',
  CS2_FACEIT: '1523058347404955708',
  CS2_PREMIER: '1523276640199770173',
  CS16: '1523058349451776200',
  FASTCUP: '1523058351473299499'
};

const RESULT_CHANNEL = '1523060564283232277';

// Colors & Banners
const THEMES = {
  CS2_MM: { color: 0xFFA500, title: '🔫 CS2 Match Making', emoji: '🔫' },
  CS2_FACEIT: { color: 0xFF5500, title: '🟠 CS2 FACEIT', emoji: '🟠' },
  CS2_PREMIER: { color: 0x8847FF, title: '🟣 CS2 Premier', emoji: '🟣' },
  CS16: { color: 0x00A2E8, title: '💣 CS 1.6 Normal', emoji: '💣' },
  FASTCUP: { color: 0x32CD32, title: '🟢 CS 1.6 Fastcup', emoji: '🟢' }
};

export class TeammatePanelManager {
  
  static async initPanels(client: Client) {
    try {
      const guild = client.guilds.cache.get(process.env.GUILD_ID!);
      if (!guild) return;

      const channelsConfig = [
        { id: CHANNELS.CS2_MM, type: 'lfg_cs2_mm', theme: THEMES.CS2_MM, desc: 'Find teammates for CS2 Match Making competitive matches.' },
        { id: CHANNELS.CS2_FACEIT, type: 'lfg_cs2_faceit', theme: THEMES.CS2_FACEIT, desc: 'Find teammates for CS2 FACEIT matches. (Account verification required)' },
        { id: CHANNELS.CS2_PREMIER, type: 'lfg_cs2_premier', theme: THEMES.CS2_PREMIER, desc: 'Find teammates for CS2 Premier matches. (Account verification required)' },
        { id: CHANNELS.CS16, type: 'lfg_cs16_normal', theme: THEMES.CS16, desc: 'Find teammates for CS 1.6 Public/Normal games.' },
        { id: CHANNELS.FASTCUP, type: 'lfg_cs16_fastcup', theme: THEMES.FASTCUP, desc: 'Find teammates for CS 1.6 Fastcup matches. (Account verification required)' }
      ];

      for (const conf of channelsConfig) {
        const channel = guild.channels.cache.get(conf.id) as TextChannel;
        if (!channel) continue;

        // Clear previous messages
        const messages = await channel.messages.fetch({ limit: 10 });
        const oldPanel = messages.find(m => client.user && m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0]?.title?.includes('Teammate Search'));
        if (!oldPanel) {
            for (const [_, msg] of messages) {
                if (client.user && msg.author.id === client.user.id) await msg.delete().catch(()=>null);
            }
            
            const embed = new EmbedBuilder()
              .setTitle(`${conf.theme.emoji} ${conf.theme.title} - Teammate Search`)
              .setDescription(`**${conf.desc}**\n\nClick the button below to enter your details and find new teammates instantly!\n\n*(You must have your account verified on the server to use this system)*`)
              .setColor(conf.theme.color);
              
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(conf.type)
                .setLabel('🔍 Find Teammate')
                .setStyle(ButtonStyle.Success)
            );
            
            await channel.send({ embeds: [embed], components: [row] });
            logger.info(`Initialized panel for ${conf.id}`);
        }
      }
    } catch (err) {
      logger.error('Failed to init LFG panels', err);
    }
  }

  // Used by the /lfg command
  static async sendLfgMenu(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    
    const embed = new EmbedBuilder()
      .setTitle('👥 Teammate Search Menu')
      .setDescription('Please select the game/platform you want to play:')
      .setColor(0x2B2D31);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('lfg_menu')
      .setPlaceholder('Select Game / Platform...')
      .addOptions(
        { label: 'CS2 - Match Making', value: 'lfg_cs2_mm', emoji: '🔫' },
        { label: 'CS2 - FACEIT', value: 'lfg_cs2_faceit', emoji: '🟠' },
        { label: 'CS2 - Premier', value: 'lfg_cs2_premier', emoji: '🟣' },
        { label: 'CS 1.6 - Normal', value: 'lfg_cs16_normal', emoji: '💣' },
        { label: 'CS 1.6 - Fastcup', value: 'lfg_cs16_fastcup', emoji: '🟢' }
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  static async handleLfgMenuSelect(interaction: StringSelectMenuInteraction) {
    const value = interaction.values[0];
    if (!value) return;
    await this.triggerModal(interaction, value);
  }

  static async handleLfgButton(interaction: ButtonInteraction) {
    await this.triggerModal(interaction, interaction.customId);
  }

  private static async triggerModal(interaction: Interaction, type: string) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member) {
      return interaction.reply({ content: '❌ **ERROR:** Member not found in this server.', ephemeral: true });
    }

    if (!member.roles.cache.has(STEAM_VERIFIED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ **ERROR:** You must link your account (Steam) and verify it to use this system.',
        ephemeral: true
      });
    }

    const userRoles = member.roles.cache;

    let modal: ModalBuilder;
    
    if (type === 'lfg_cs2_mm') {
      const hasRole = userRoles.some(r => r.name.startsWith('CS 2 | '));
      if (!hasRole) return interaction.reply({ content: '❌ **ERROR:** You must have a CS2 Normal Rank role to use this option. Please select your rank from the Customization Panel first.', ephemeral: true });

      modal = new ModalBuilder()
        .setCustomId('modal_lfg_cs2_mm')
        .setTitle('CS2 Match Making');
      
      const rankInput = new TextInputBuilder()
        .setCustomId('mm_rank')
        .setLabel('Current MM Rank')
        .setPlaceholder('e.g. Master Guardian II')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
        
      const noteInput = new TextInputBuilder()
        .setCustomId('lfg_note')
        .setLabel('Additional Note / Desired Role')
        .setPlaceholder('e.g. Need 1 player who only plays AWP.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);
        
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(rankInput), new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
      
    } else if (type === 'lfg_cs2_faceit') {
      const hasRole = userRoles.some(r => r.name.toLowerCase().includes('faceit level'));
      if (!hasRole) return interaction.reply({ content: '❌ **ERROR:** You must have a FACEIT Level role to use this option.', ephemeral: true });

      modal = new ModalBuilder()
        .setCustomId('modal_lfg_cs2_faceit')
        .setTitle('CS2 FACEIT');
        
      const noteInput = new TextInputBuilder()
        .setCustomId('lfg_note')
        .setLabel('Current ELO / Additional Note')
        .setPlaceholder('e.g. Around 1500 ELO, looking for a Rifler.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
        
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
      
    } else if (type === 'lfg_cs2_premier') {
      const hasRole = userRoles.some(r => r.name.startsWith('CS2 Premier | '));
      if (!hasRole) return interaction.reply({ content: '❌ **ERROR:** You must have a CS2 Premier Rank role to use this option. Please select your rank from the Customization Panel first.', ephemeral: true });

      modal = new ModalBuilder()
        .setCustomId('modal_lfg_cs2_premier')
        .setTitle('CS2 Premier');
        
      const noteInput = new TextInputBuilder()
        .setCustomId('lfg_note')
        .setLabel('Current Premier ELO / Additional Note')
        .setPlaceholder('e.g. Around 15k ELO, looking for players.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
        
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));

    } else if (type === 'lfg_cs16_fastcup') {
      const hasRole = userRoles.some(r => r.name.toLowerCase().includes('fastcup |'));
      if (!hasRole) return interaction.reply({ content: '❌ **ERROR:** You must have a Fastcup Rank role to use this option.', ephemeral: true });

      modal = new ModalBuilder()
        .setCustomId('modal_lfg_cs16_fastcup')
        .setTitle('CS 1.6 Fastcup');
        
      const noteInput = new TextInputBuilder()
        .setCustomId('lfg_note')
        .setLabel('Additional Note / Desired Role')
        .setPlaceholder('e.g. Rank B-C, need a solid rifler.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
        
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
      
    } else if (type === 'lfg_cs16_normal') {
      modal = new ModalBuilder()
        .setCustomId('modal_lfg_cs16_normal')
        .setTitle('CS 1.6 Normal');
        
      const noteInput = new TextInputBuilder()
        .setCustomId('lfg_note')
        .setLabel('Additional Note / Details')
        .setPlaceholder('e.g. Anyone who wants to join our public server.')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
        
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput));
    } else {
      return;
    }

    await interaction.showModal(modal);
  }

  static async handleModalSubmit(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith('modal_lfg_')) return;

    await interaction.deferReply({ ephemeral: true });

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member?.roles.cache.has(STEAM_VERIFIED_ROLE_ID)) {
      return interaction.followUp('❌ **ERROR:** You must link your account (Steam) and verify it to use this system.');
    }

    // Attempt to fetch DB data for stats, but don't block if missing
    let user: any = {};
    try {
      const conn = await dbPool.getConnection();
      const rows: any[] = await conn.query('SELECT * FROM users WHERE discord_id = ?', [interaction.user.id]);
      if (rows && rows.length > 0) user = rows[0];
      conn.release();
    } catch (e) {}

    const type = interaction.customId.replace('modal_', '');
    const note = interaction.fields.fields.has('lfg_note') ? interaction.fields.getTextInputValue('lfg_note') : '';
    let rankInfo = '';
    
    let theme = THEMES.CS16;
    let rolesToPing: string[] = [];
    
    const userRoles = member?.roles.cache.map(r => r.id) || [];

    if (type === 'lfg_cs2_mm') {
      theme = THEMES.CS2_MM;
      rankInfo = `**MM Rank:** ${interaction.fields.getTextInputValue('mm_rank')}`;
      rolesToPing = userRoles.filter(id => {
        const r = interaction.guild?.roles.cache.get(id);
        return r && r.name.toLowerCase().includes('cs 2 |');
      });
    } else if (type === 'lfg_cs2_faceit') {
      theme = THEMES.CS2_FACEIT;
      rankInfo = `**FACEIT Level:** ${user.faceit_level || 'Unknown'}`;
      rolesToPing = userRoles.filter(id => {
        const r = interaction.guild?.roles.cache.get(id);
        return r && r.name.toLowerCase().includes('faceit level');
      });
    } else if (type === 'lfg_cs2_premier') {
      theme = THEMES.CS2_PREMIER;
      rankInfo = `**Premier Range:** Selected via role`; // Discord roles hold the rank range
      rolesToPing = userRoles.filter(id => {
        const r = interaction.guild?.roles.cache.get(id);
        return r && r.name.startsWith('CS2 Premier | ');
      });
    } else if (type === 'lfg_cs16_fastcup') {
      theme = THEMES.FASTCUP;
      rankInfo = `**Fastcup Rank:** ${user.fastcup_level || 'Unknown'}`;
      rolesToPing = userRoles.filter(id => {
        const r = interaction.guild?.roles.cache.get(id);
        return r && r.name.toLowerCase().includes('fastcup |');
      });
    } else {
      theme = THEMES.CS16;
    }

    const embed = new EmbedBuilder()
      .setColor(theme.color)
      .setTitle(`${theme.emoji} LOOKING FOR TEAMMATE`)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .addFields(
        { name: 'Game / Platform', value: theme.title, inline: true },
        { name: 'Player', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp();

    if (rankInfo) {
      embed.addFields({ name: 'Level Information', value: rankInfo, inline: false });
    }
    
    if (note) {
      embed.addFields({ name: 'Additional Notes', value: `\`\`\`${note}\`\`\``, inline: false });
    }

    const channel = interaction.guild?.channels.cache.get(RESULT_CHANNEL) as TextChannel;
    if (channel) {
      const pingStr = rolesToPing.map(id => `<@&${id}>`).join(' ');
      
      await channel.send({ 
        content: pingStr ? `📢 ${pingStr}` : '',
        embeds: [embed] 
      });
      await interaction.followUp(`✅ Your LFG post has been successfully published! Go to the channel: <#${RESULT_CHANNEL}>`);
    } else {
      await interaction.followUp('❌ Error: LFG channel not found.');
    }
  }
}
