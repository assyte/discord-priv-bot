import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID as string);
    if (!guild) return;
    await guild.roles.fetch();
    const roles = guild.roles.cache.map(r => r.name);
    
    console.log("Premier Roles:");
    console.log(roles.filter(n => n.startsWith('CS2 Premier | ')));
    
    console.log("MM Roles:");
    console.log(roles.filter(n => n.startsWith('CS 2 | ')));

    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
