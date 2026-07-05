import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID as string);
    if (!guild) return;
    await guild.roles.fetch();
    
    const roles = guild.roles.cache.sort((a, b) => b.position - a.position);
    console.log("ALL ROLES:");
    roles.forEach(r => {
        if (r.hoist || r.name.includes('Faceit') || r.name.includes('Verified')) {
            console.log(`${r.position.toString().padStart(3, '0')} - ${r.name} (Hoist: ${r.hoist})`);
        }
    });

    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
