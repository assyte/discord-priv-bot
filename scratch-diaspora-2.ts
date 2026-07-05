import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID as string);
    if (!guild) return;
    await guild.members.fetch();
    
    const members = guild.members.cache.filter(m => m.user.username.toLowerCase().includes('diaspora') || m.displayName.toLowerCase().includes('diaspora'));
    members.forEach(m => {
        console.log(`User: ${m.user.tag} (ID: ${m.id})`);
        const roles = m.roles.cache.sort((a, b) => b.position - a.position);
        roles.forEach(r => {
            console.log(`  - ${r.name} (Position: ${r.position}, Hoist: ${r.hoist})`);
        });
    });

    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
