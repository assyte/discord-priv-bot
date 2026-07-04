import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from 'discord.js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log('--- STARTING SERVER WIPE & REBUILD ---');
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) {
    console.error('Guild not found!');
    process.exit(1);
  }

  // ==========================================
  // 1. DELETE EXISTING CHANNELS
  // ==========================================
  console.log('Deleting all channels...');
  const channels = await guild.channels.fetch();
  for (const [id, channel] of channels) {
    if (channel) {
      await channel.delete().catch(() => console.error(`Failed to delete channel: ${channel.name}`));
    }
  }

  // ==========================================
  // 2. DELETE EXISTING ROLES
  // ==========================================
  console.log('Deleting old roles...');
  const roles = await guild.roles.fetch();
  for (const [id, role] of roles) {
    if (role.name !== '@everyone' && !role.managed && role.editable) {
      await role.delete().catch(() => {});
    }
  }

  // ==========================================
  // 3. CREATE NEW ROLES (English)
  // ==========================================
  console.log('Creating new roles...');
  const createdRoles: Record<string, string> = {};

  const roleConfigs = [
    { name: 'Owner', color: '#ff0000', permissions: [PermissionsBitField.Flags.Administrator], hoist: true },
    { name: 'Moderator', color: '#0055ff', permissions: [PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers], hoist: true },
    { name: 'VIP Booster', color: '#ff73fa', hoist: true },
    { name: 'FACEIT Level 10', color: '#d32f2f', hoist: true },
    { name: 'FACEIT Level 9', color: '#f57c00', hoist: true },
    { name: 'FACEIT Level 8', color: '#ff9800', hoist: true },
    { name: 'FACEIT Level 7', color: '#fbc02d', hoist: true },
    { name: 'FACEIT Level 6', color: '#fdd835', hoist: true },
    { name: 'FACEIT Level 5', color: '#388e3c', hoist: true },
    { name: 'FACEIT Level 4', color: '#4caf50', hoist: true },
    { name: 'FACEIT Level 3', color: '#1976d2', hoist: true },
    { name: 'FACEIT Level 2', color: '#2196f3', hoist: true },
    { name: 'FACEIT Level 1', color: '#eceff1', hoist: true },
    { name: 'Verified Player', color: '#D4AF37', hoist: true },
    { name: 'Unverified', color: '#757575', hoist: true }
  ];

  for (const rc of roleConfigs) {
    const role = await guild.roles.create({
      name: rc.name,
      color: rc.color as any,
      permissions: rc.permissions || [],
      hoist: rc.hoist
    });
    createdRoles[rc.name] = role.id;
    console.log(`Created Role: ${rc.name}`);
  }

  const verifiedRole = createdRoles['Verified Player'];
  const unverifiedRole = createdRoles['Unverified'];

  // @everyone should not read messages by default in this secure server
  await guild.roles.everyone.setPermissions([
    PermissionsBitField.Flags.ViewChannel
  ]);

  // ==========================================
  // 4. CREATE CHANNELS & CATEGORIES
  // ==========================================
  console.log('Creating Categories and Channels...');

  // 4.1 INFO & SECURITY
  const catInfo = await guild.channels.create({
    name: '📢 INFO & SECURITY',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.id, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] },
      { id: createdRoles['Owner'], allow: [PermissionsBitField.Flags.SendMessages] },
      { id: createdRoles['Moderator'], allow: [PermissionsBitField.Flags.SendMessages] }
    ]
  });

  await guild.channels.create({ name: 'announcements', type: ChannelType.GuildText, parent: catInfo.id });
  await guild.channels.create({ name: 'rules', type: ChannelType.GuildText, parent: catInfo.id });
  
  // Link Account channel (everyone can see, only unverified can see if you want, but better if everyone sees)
  await guild.channels.create({ 
    name: 'link-account', 
    type: ChannelType.GuildText, 
    parent: catInfo.id,
    topic: 'Go to https://clutch.nartforge.com to verify your FACEIT account.'
  });

  // 4.2 FACEIT ARENA (Verified Only)
  const catArena = await guild.channels.create({
    name: '🏆 FACEIT ARENA',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // @everyone cannot see
      { id: verifiedRole, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
    ]
  });

  await guild.channels.create({ name: 'general-chat', type: ChannelType.GuildText, parent: catArena.id });
  await guild.channels.create({ name: 'looking-for-group', type: ChannelType.GuildText, parent: catArena.id });
  await guild.channels.create({ name: 'bot-commands', type: ChannelType.GuildText, parent: catArena.id });
  await guild.channels.create({ name: 'match-results', type: ChannelType.GuildText, parent: catArena.id, permissionOverwrites: [
    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: verifiedRole, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] }
  ]});

  // 4.3 VOICE CHANNELS (Verified Only)
  const catVoice = await guild.channels.create({
    name: '🔊 VOICE CHANNELS',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: verifiedRole, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak] }
    ]
  });

  const lobby = await guild.channels.create({ name: 'Lobby', type: ChannelType.GuildVoice, parent: catVoice.id });
  await guild.channels.create({ name: 'Public Chat 1', type: ChannelType.GuildVoice, parent: catVoice.id });
  await guild.channels.create({ name: 'Public Chat 2', type: ChannelType.GuildVoice, parent: catVoice.id });
  const afk = await guild.channels.create({ name: 'AFK', type: ChannelType.GuildVoice, parent: catVoice.id });

  // 4.4 MANAGEMENT (Admin/Mod Only)
  const catAdmin = await guild.channels.create({
    name: '⚙️ MANAGEMENT',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: createdRoles['Owner'], allow: [PermissionsBitField.Flags.ViewChannel] },
      { id: createdRoles['Moderator'], allow: [PermissionsBitField.Flags.ViewChannel] }
    ]
  });

  await guild.channels.create({ name: 'admin-chat', type: ChannelType.GuildText, parent: catAdmin.id });
  await guild.channels.create({ name: 'audit-logs', type: ChannelType.GuildText, parent: catAdmin.id });

  // Set AFK Channel for the guild
  await guild.setAFKChannel(afk);
  await guild.setAFKTimeout(300);

  // ==========================================
  // 5. EXPORT ROLES TO TERMINAL FOR .ENV
  // ==========================================
  console.log('\n==================================');
  console.log('REBUILD COMPLETE! Copy these to .env:');
  console.log('==================================');
  console.log(`LOBBY_CHANNEL_ID=${lobby.id}`);
  console.log(`ROLE_VERIFIED=${verifiedRole}`);
  console.log(`ROLE_LEVEL_10=${createdRoles['FACEIT Level 10']}`);
  console.log(`ROLE_LEVEL_9=${createdRoles['FACEIT Level 9']}`);
  console.log(`ROLE_LEVEL_8=${createdRoles['FACEIT Level 8']}`);
  console.log(`ROLE_LEVEL_7=${createdRoles['FACEIT Level 7']}`);
  console.log(`ROLE_LEVEL_6=${createdRoles['FACEIT Level 6']}`);
  console.log(`ROLE_LEVEL_5=${createdRoles['FACEIT Level 5']}`);
  console.log(`ROLE_LEVEL_4=${createdRoles['FACEIT Level 4']}`);
  console.log(`ROLE_LEVEL_3=${createdRoles['FACEIT Level 3']}`);
  console.log(`ROLE_LEVEL_2=${createdRoles['FACEIT Level 2']}`);
  console.log(`ROLE_LEVEL_1=${createdRoles['FACEIT Level 1']}`);
  console.log('==================================\n');

  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
