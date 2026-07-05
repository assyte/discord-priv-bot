import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const UNVERIFIED_ROLE_ID = '1522961867025416202';
const VERIFIED_ROLE_ID = '1522986492757278810';

const categories = [
  {
    name: 'CS2 | MM Lobby',
    channels: [
      { name: 'Solo MM I [Empty]' },
      { name: 'Solo MM II [Empty]' },
      { name: 'Duo MM I [Empty]' },
      { name: 'Duo MM II [Empty]' },
      { name: '5v5 MM I [Empty]' },
      { name: '5v5 MM II [Empty]' },
    ]
  },
  {
    name: 'CS2 | DM Lobby',
    channels: [
      { name: 'Solo DM I [Empty]' },
      { name: 'Solo DM II [Empty]' },
      { name: 'Duo DM I [Empty]' },
      { name: 'Duo DM II [Empty]' },
      { name: 'Duo DM III [Empty]' },
    ]
  },
  {
    name: 'CS2 | Faceit Lobby',
    channels: [
      { name: 'Solo Faceit I [Empty]' },
      { name: 'Solo Faceit II [Empty]' },
      { name: 'Duo Faceit I [Empty]' },
      { name: 'Duo Faceit II [Empty]' },
      { name: '5v5 Faceit I [Empty]' },
      { name: '5v5 Faceit II [Empty]' },
      { name: '5v5 Faceit III [Empty]' },
    ]
  },
  {
    name: 'CS2 | Community Lobby',
    channels: [
      { name: 'Solo Com I [Empty]' },
      { name: 'Solo Com II [Empty]' },
      { name: 'Duo Com I [Empty]' },
      { name: 'Duo Com II [Empty]' },
      { name: 'Duo Com III [Empty]' },
    ]
  },
  {
    name: 'CS1.6 | Fastcup Lobby',
    channels: [
      { name: 'Solo FC I [Empty]' },
      { name: 'Solo FC II [Empty]' },
      { name: 'Duo FC I [Empty]' },
      { name: 'Duo FC II [Empty]' },
      { name: '5v5 FC I [Empty]' },
      { name: '5v5 FC II [Empty]' },
    ]
  },
  {
    name: 'CS1.6 | Community Lobby',
    channels: [
      { name: 'Solo Com I [Empty]' },
      { name: 'Solo Com II [Empty]' },
      { name: 'Duo Com I [Empty]' },
      { name: 'Duo Com II [Empty]' },
    ]
  }
];

client.once('ready', async () => {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) throw new Error('Guild not found');

    for (const catData of categories) {
      console.log(`Creating category: ${catData.name}`);
      const category = await guild.channels.create({
        name: catData.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: UNVERIFIED_ROLE_ID,
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.Connect],
          },
          {
            id: VERIFIED_ROLE_ID,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          }
        ]
      });

      for (const chData of catData.channels) {
        console.log(`  Creating channel: ${chData.name}`);
        await guild.channels.create({
          name: chData.name,
          type: ChannelType.GuildVoice,
          parent: category.id
        });
      }
    }
    
    console.log('Successfully created all custom lobbies.');
  } catch (err) {
    console.error('Error creating lobbies:', err);
  }
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
