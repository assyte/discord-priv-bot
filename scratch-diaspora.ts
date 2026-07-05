import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID as string);
    if (!guild) return;
    await guild.members.fetch();
    
    const member = guild.members.cache.find(m => m.user.username.toLowerCase() === 'diaspora' || m.displayName.toLowerCase().includes('diaspora'));
    if (!member) {
        console.log("Could not find user");
        process.exit(1);
    }

    const roles = member.roles.cache.sort((a, b) => b.position - a.position);
    roles.forEach(r => {
        console.log(`- ${r.name} (Position: ${r.position}, Hoist: ${r.hoist}, Color: ${r.color})`);
    });

    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
