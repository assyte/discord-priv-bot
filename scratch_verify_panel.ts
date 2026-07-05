import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    try {
        const guild = client.guilds.cache.get(process.env.GUILD_ID!);
        if (!guild) throw new Error('Guild not found');
        
        const channel = await guild.channels.fetch('1522961876139376640');
        if (!channel || !channel.isTextBased()) throw new Error('Channel not found');

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🛡️ CLUTCH.GG SECURITY & VERIFICATION SYSTEM')
            .setImage('https://cdn.discordapp.com/attachments/1183060249568215160/1183060250025381908/premium_banner.gif') // Use a premium looking banner or leave empty, the user loves dynamic look
            .setDescription(
                'Welcome to the official **Clutch.gg Verification Center**. To maintain a high-quality, competitive, and cheat-free environment, we require all players to verify their accounts.\n\n' +
                '> *Our goal is to build a community where everyone plays fair, toxic behavior is eliminated, and real skill is rewarded.*\n\n' +
                '**❓ Why Do We Ask For Verification?**\n' +
                'By linking your accounts, we ensure that every player in our community is a real person with a legitimate gaming background. This completely prevents smurfs, banned players, and trolls from ruining your matches.\n\n' +
                '**🔒 What Data Do We Use & Why?**\n' +
                '• **Discord ID:** To automatically assign your server roles and permissions.\n' +
                '• **Steam ID:** To verify your game ownership and prevent VAC-banned accounts from joining.\n' +
                '• **FACEIT / Fastcup Data:** We only read your **public ELO, Level, and match history**. This is used to give you accurate rank roles and match you with players of similar skill.\n' +
                '*⚠️ We do NOT have access to your passwords, emails, or personal private data. The login is processed securely through official Discord and Steam OAuth systems.*\n\n' +
                '**✅ What Happens If You Verify?**\n' +
                'You will instantly unlock full access to the server! This includes:\n' +
                '• Access to **LFG (Looking for Group)** channels.\n' +
                '• Automatic **CS2 Premier, FACEIT, and Fastcup** rank roles.\n' +
                '• Ability to join premium tournaments and private voice rooms.\n\n' +
                '**❌ What Happens If You Don\'t Verify?**\n' +
                'Your account will remain restricted. You will only be able to see the rules and this channel. You will not be able to chat, join voice channels, or participate in the community.\n\n' +
                '**🚀 How to Complete Verification:**\n' +
                '1️⃣ Click the secure button below to visit `clutch.nartforge.com`.\n' +
                '2️⃣ Log in securely using your Discord and Steam accounts.\n' +
                '3️⃣ (Optional) Link your FACEIT/Fastcup for automated rank roles.\n' +
                '4️⃣ Return to Discord—your roles will be assigned instantly!'
            )
            .setFooter({ text: 'Clutch Security System • Protected by OAuth2', iconURL: guild.iconURL() ?? undefined });

        const verifyButton = new ButtonBuilder()
            .setLabel('🔗 Verify Account (Clutch Portal)')
            .setStyle(ButtonStyle.Link)
            .setURL('https://clutch.nartforge.com')
            .setEmoji('🛡️');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(verifyButton);

        // Delete old messages
        const messages = await channel.messages.fetch({ limit: 10 });
        for (const [_, msg] of messages) {
            await msg.delete().catch(() => {});
        }

        await channel.send({ embeds: [embed], components: [row] });
        console.log('Verification panel sent successfully');
        
    } catch (e) {
        console.error('Error sending verification panel:', e);
    }
    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
