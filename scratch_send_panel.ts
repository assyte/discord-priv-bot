import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { sendRoleSelectionPanel } from './src/bot/services/rolePanelManager';
import { getClient, startBot } from './src/bot/client';

async function run() {
  const client = await startBot();
  setTimeout(async () => {
    try {
      console.log('Sending panel...');
      await sendRoleSelectionPanel('1523030630584025098');
      console.log('Panel sent successfully!');
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }, 3000);
}

run();
