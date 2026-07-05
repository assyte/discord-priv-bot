import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    await guild.roles.fetch();
    
    const unverified = guild.roles.cache.get('1522961867025416202');
    if (!unverified) {
      console.log('Role not found!');
      process.exit(1);
    }
    
    // Check if bot can manage this role
    const botMember = await guild.members.fetch(client.user!.id);
    const botHighestRole = botMember.roles.highest;
    
    console.log('Unverified Role position:', unverified.position);
    console.log('Bot Highest Role position:', botHighestRole.position);
    
    if (botHighestRole.position <= unverified.position) {
      console.log('ERROR: Bot role is LOWER than or EQUAL to Unverified role. Cannot assign it!');
    } else {
      console.log('SUCCESS: Bot has a higher role and should be able to assign it.');
    }
    
    // Also check permissions
    const permissions = botMember.permissions;
    console.log('Has Manage Roles?', permissions.has('ManageRoles'));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

client.login(process.env.BOT_TOKEN);
