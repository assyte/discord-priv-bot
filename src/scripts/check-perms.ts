import { Client, GatewayIntentBits } from 'discord.js';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '..', '.env') });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }

  await guild.roles.fetch();
  await guild.channels.fetch();

  const report: any[] = [];
  const everyoneRole = guild.roles.everyone.id;

  guild.channels.cache.forEach(channel => {
    const perms = {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parent: channel.parent?.name || 'No Category',
      everyoneRead: channel.permissionsFor(everyoneRole)?.has('ViewChannel'),
      everyoneWrite: channel.permissionsFor(everyoneRole)?.has('SendMessages'),
      everyoneConnect: channel.permissionsFor(everyoneRole)?.has('Connect'),
      overwrites: channel.permissionOverwrites.cache.map(ow => ({
        id: ow.id,
        type: ow.type,
        roleName: ow.type === 0 ? guild.roles.cache.get(ow.id)?.name : 'User',
        allow: ow.allow.toArray(),
        deny: ow.deny.toArray()
      }))
    };
    report.push(perms);
  });

  writeFileSync(join(__dirname, 'perms.json'), JSON.stringify(report, null, 2));
  console.log('Permissions saved');
  process.exit(0);
});

client.login(process.env.BOT_TOKEN);
