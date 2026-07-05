import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import fs from 'fs';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log("Logged in!");
    try {
        const avatarBuffer = fs.readFileSync('/home/assyte/Desktop/bot-profil-pic.gif');
        console.log("Setting avatar...");
        await client.user?.setAvatar(avatarBuffer);
        console.log("Avatar set!");

        const bannerBuffer = fs.readFileSync('/home/assyte/Desktop/bot-banner-pic.gif');
        console.log("Setting banner...");
        await client.user?.setBanner(bannerBuffer);
        console.log("Banner set!");

    } catch (e) {
        console.error("Error setting profile:", e);
    }
    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
