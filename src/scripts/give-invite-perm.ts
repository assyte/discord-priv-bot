import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { config } from 'dotenv';
config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  try {
    const guild = client.guilds.cache.get('1264110767641464844');
    if (!guild) {
      console.log('Sunucu bulunamadı.');
      process.exit(1);
    }

    const roles = await guild.roles.fetch();
    const targetRole = roles.find(r => r.name === 'Tayfa Üyesi' || r.name === 'Tayfa Uyesi' || r.name === 'Uye' || r.name === 'Üye');
    
    if (!targetRole) {
      console.log('Rol bulunamadı. Mevcut roller:');
      roles.forEach(r => console.log(`- ${r.name} (${r.id})`));
      process.exit(1);
    }

    console.log(`${targetRole.name} rolüne davet oluşturma izni veriliyor...`);
    const newPermissions = targetRole.permissions.add(PermissionFlagsBits.CreateInstantInvite);
    await targetRole.setPermissions(newPermissions);
    
    console.log('İzin başarıyla verildi!');
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
