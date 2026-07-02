import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });
c.once('ready', async () => {
  const g = c.guilds.cache.get('1264110767641464844')!;
  
  const logCat = g.channels.cache.find(c => c.name === '📋 LOG');
  const channels = await g.channels.fetch();
  const joinLog = channels.find(c => c!.name === 'join-log')!;
  const msgLog = channels.find(c => c!.name === 'message-log')!;
  const voiceLog = channels.find(c => c!.name === 'voice-log')!;
  const modLog = channels.find(c => c!.name === 'mod-log')!;

  const { Database } = await import('./src/database/connection.js');
  const db = Database.getInstance();
  await db.connect();
  const { guilds } = await import('./src/database/schema/guild.js');
  const { eq } = await import('drizzle-orm');

  await db.db.insert(guilds).values({
    id: g.id,
    name: g.name,
    logChannel: modLog!.id,
    modLogChannel: modLog!.id,
    joinLogChannel: joinLog!.id,
    messageLogChannel: msgLog!.id,
    voiceLogChannel: voiceLog!.id,
    reportChannel: modLog!.id,
    suggestionChannel: modLog!.id,
    memberLogEnabled: true,
    messageLogEnabled: true,
    voiceLogEnabled: true,
  }).onConflictDoUpdate({
    target: guilds.id,
    set: {
      logChannel: modLog!.id,
      modLogChannel: modLog!.id,
      joinLogChannel: joinLog!.id,
      messageLogChannel: msgLog!.id,
      voiceLogChannel: voiceLog!.id,
      reportChannel: modLog!.id,
      suggestionChannel: modLog!.id,
      memberLogEnabled: true,
      messageLogEnabled: true,
      voiceLogEnabled: true,
    },
  });

  console.log('✅ DB güncellendi');
  console.log(`  join-log: ${joinLog!.id}`);
  console.log(`  message-log: ${msgLog!.id}`);
  console.log(`  voice-log: ${voiceLog!.id}`);
  console.log(`  mod-log: ${modLog!.id}`);

  const fs = await import('fs');
  try { fs.unlinkSync('/mnt/data/Projects/discord-server/db-update.ts'); } catch {}

  process.exit(0);
});
c.login(process.env.BOT_TOKEN!);
