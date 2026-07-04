import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log('--- ADDING FASTCUP ROLES ---');
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) {
    console.error('Guild not found!');
    process.exit(1);
  }

  const fastcupRoles = [
    { name: 'CS 1.6 Player', color: '#f5f5f5' },
    { name: 'Fastcup | Rank S', color: '#ff0000' }, 
    { name: 'Fastcup | Rank A', color: '#ff7700' }, 
    { name: 'Fastcup | Rank B', color: '#ffbb00' }, 
    { name: 'Fastcup | Rank C', color: '#88ff00' }, 
    { name: 'Fastcup | Rank D', color: '#00ff88' }, 
    { name: 'Fastcup | Rank E', color: '#00bfff' }, 
    { name: 'Fastcup | Rank F', color: '#0044ff' }, 
    { name: 'Fastcup | Rank G', color: '#7700ff' }  
  ];

  const envPath = join(__dirname, '..', '..', '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  for (const rc of fastcupRoles) {
    // Check if role exists
    let role = guild.roles.cache.find(r => r.name === rc.name);
    if (!role) {
      role = await guild.roles.create({
        name: rc.name,
        color: rc.color as any,
        hoist: true
      });
      console.log(`Created Role: ${rc.name} (${role.id})`);
    } else {
      console.log(`Role already exists: ${rc.name} (${role.id})`);
    }

    const envKey = rc.name === 'CS 1.6 Player' ? 'ROLE_CS16' : `ROLE_FASTCUP_${rc.name.split(' ').pop()}`;
    if (!envContent.includes(envKey)) {
      envContent += `\n${envKey}=${role.id}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log('Roles added and .env updated successfully.');
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
