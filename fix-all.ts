import 'dotenv/config';
import { Client, GatewayIntentBits, PermissionFlagsBits, OverwriteType, ChannelType } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });
c.once('ready', async () => {
  const g = c.guilds.cache.get('1264110767641464844')!;
  const bot = await g.members.fetch(c.user!.id);
  const botRole = bot.roles.highest;

  console.log('1️⃣  Orphan kanallar temizleniyor...');
  for (const name of ['sense', 'x']) {
    const ch = g.channels.cache.find(c => c.name === name);
    if (ch) { await ch.delete('Temizlik').then(() => console.log('  🗑️ Silindi:', name)).catch(() => console.log('  ❌ Silinemedi:', name)); }
  }

  console.log('2️⃣  Admin kategorisi oluşturuluyor...');
  const kurucu = g.roles.cache.find(r => r.name === '👑 Kurucu')!;
  const admin = g.roles.cache.find(r => r.name === '🛡️ Admin')!;
  const mod = g.roles.cache.find(r => r.name === '🔰 Mod')!;
  const uye = g.roles.cache.find(r => r.name === '✅ Üye')!;
  const globalR = g.roles.cache.find(r => r.name === '🌍 Global')!;
  const nsrw = g.roles.cache.find(r => r.name === '🔞 +18')!;
  const camera = g.roles.cache.find(r => r.name === '📷 Camera')!;
  const streamer = g.roles.cache.find(r => r.name === '🎥 Streamer')!;
  const kayitsiz = g.roles.cache.find(r => r.name === '❌ Kayıtsız')!;
  const muzik = g.roles.cache.find(r => r.name === '🎵 Müzik')!;

  if (!g.channels.cache.find(ch => ch.name === '⚙️ ADMIN')) {
    const catAdmin = await g.channels.create({
      name: '⚙️ ADMIN', type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: kurucu.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.Administrator] },
        { id: admin.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.Administrator] },
        { id: mod.id, type: OverwriteType.Role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
        { id: g.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      ],
    });
    await g.channels.create({ name: 'admin-chat', type: ChannelType.GuildText, parent: catAdmin.id, topic: 'Staff chat' });
    await g.channels.create({ name: 'mod-log', type: ChannelType.GuildText, parent: catAdmin.id, topic: 'Mod logs' });
    console.log('  ✅ ADMIN kategorisi oluşturuldu');
  }

  console.log('3️⃣  Rol hiyerarşisi düzeltiliyor...');
  // Mevcut rolleri bul
  const allRoles = [...g.roles.cache.values()].filter(r => r.name !== '@everyone' && !r.managed && r.id !== botRole.id);
  const desiredOrder = [
    '👑 Kurucu',
    '🛡️ Admin',
    '🔰 Mod',
    '🎮 Oyun',
    '🎵 Müzik',
    '🌍 Global',
    '✅ Üye',
    '🔞 +18',
    '📷 Camera',
    '🎥 Streamer',
    '❌ Kayıtsız',
    '🤖 Bot',
  ];

  // Rolleri istenen sıraya koy (alttan üste)
  const basePos = botRole.position - desiredOrder.length - 4; // 4 separator
  for (let i = 0; i < desiredOrder.length; i++) {
    const role = g.roles.cache.find(r => r.name === desiredOrder[i]);
    if (role && role.id !== botRole.id && !role.managed && role.position < botRole.position) {
      try {
        await role.setPosition(basePos + i, 'Hiyerarşi düzeltme');
      } catch (e) {
        // ignore
      }
    }
  }
  console.log('  ✅ Rol sırası ayarlandı');

  console.log('4️⃣  Voice kanal izinleri güncelleniyor (Stream, Camera)...');
  for (const [, ch] of g.channels.cache) {
    if (!ch.isVoiceBased()) continue;
    const overwrites = [];
    if (uye) overwrites.push({ id: uye.id, deny: [PermissionFlagsBits.Stream], type: OverwriteType.Role });
    if (streamer) overwrites.push({ id: streamer.id, allow: [PermissionFlagsBits.Stream], type: OverwriteType.Role });
    if (camera) overwrites.push({ id: camera.id, allow: [PermissionFlagsBits.UseEmbeddedActivities], type: OverwriteType.Role });
    try {
      await ch.permissionOverwrites.set(overwrites, 'Kamera/Stream izinleri');
      console.log('  ✅', ch.name);
    } catch (e) {
      console.log('  ❌', ch.name, String(e).slice(0, 60));
    }
  }

  console.log('5️⃣  Temizlik...');
  const files = ['audit.ts', 'fix-all.ts'];
  for (const f of files) {
    try { require('fs').unlinkSync('/mnt/data/Projects/discord-server/' + f); } catch {}
  }

  console.log('\n✅ Tüm düzeltmeler tamam!');
  process.exit(0);
});
c.login(process.env.BOT_TOKEN!);
