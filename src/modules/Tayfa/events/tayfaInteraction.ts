import type { Message, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getOrCreateWebhook } from '../services/webhookService.js';
import { avatars, zorbaQuotes, randomQuotes, ilgiQuotes, tavsiyeQuotes, kavgaQuotes } from '../services/quotes.js';

// Global cooldown tracker for random interactions
let lastRandomInteraction = 0;
const RANDOM_COOLDOWN = 10 * 60 * 1000; // 10 minutes between random drops globally

export async function messageCreate(client: Client, message: Message) {
  // Bot mesajlarını ve sunucu dışı mesajları yoksay
  if (message.author.bot || !message.guild) return;

  const channel = message.channel;
  if (!channel.isTextBased() || channel.isDMBased() || channel.isThread()) return;

  // 1. .ima @kullanici Komutu (Hayri Zorbalığı)
  if (message.content.startsWith('.ima ')) {
    // Sadece Uye yetkisine (veya belirlenen role) sahip kişiler kullanabilir
    if (!message.member?.roles.cache.has('1521879823855779950')) return;

    const target = message.mentions.users.first();
    if (!target) return;

    try {
      const webhook = await getOrCreateWebhook(channel as TextChannel);
      const rawQuote = zorbaQuotes[Math.floor(Math.random() * zorbaQuotes.length)];
      if (!rawQuote) return;
      const quote = rawQuote.replace('{user}', `<@${target.id}>`);

      // Kullanıcının mesajı silinmeyecek, Hayri altına direkt mesaj atacak
      // await message.delete().catch(() => {});

      await webhook.send({
        content: quote,
        username: 'Hayri',
        avatarURL: avatars.hayri,
      });
      return; // .ima atıldıysa randoma girme
    } catch (err) {
      client.logger.error(`Tayfa RP .ima hatası: ${err}`);
      return;
    }
  }

  // 1.5. .ilgi @kullanici Komutu (Akın İltifat / Flört)
  if (message.content.startsWith('.ilgi ')) {
    if (!message.member?.roles.cache.has('1521879823855779950')) return;

    const target = message.mentions.users.first();
    if (!target) return;

    try {
      const webhook = await getOrCreateWebhook(channel as TextChannel);
      const rawQuote = ilgiQuotes[Math.floor(Math.random() * ilgiQuotes.length)];
      if (!rawQuote) return;
      const quote = rawQuote.replace('{user}', `<@${target.id}>`);

      await webhook.send({
        content: quote,
        username: 'Akın',
        avatarURL: avatars.akin,
      });
      return;
    } catch (err) {
      client.logger.error(`Tayfa RP .ilgi hatası: ${err}`);
      return;
    }
  }

  // 1.75. .tavsiye @kullanici Komutu (Mert Tavsiye / Motivasyon)
  if (message.content.startsWith('.tavsiye ')) {
    if (!message.member?.roles.cache.has('1521879823855779950')) return;

    const target = message.mentions.users.first();
    if (!target) return;

    try {
      const webhook = await getOrCreateWebhook(channel as TextChannel);
      const rawQuote = tavsiyeQuotes[Math.floor(Math.random() * tavsiyeQuotes.length)];
      if (!rawQuote) return;
      const quote = rawQuote.replace('{user}', `<@${target.id}>`);

      await webhook.send({
        content: quote,
        username: 'Mert',
        avatarURL: avatars.mert,
      });
      return;
    } catch (err) {
      client.logger.error(`Tayfa RP .tavsiye hatası: ${err}`);
      return;
    }
  }

  // 1.8. .kavga Komutu (Kamil -> Hayri Kavgası)
  if (message.content.startsWith('.kavga')) {
    if (!message.member?.roles.cache.has('1521879823855779950')) return;

    try {
      const webhook = await getOrCreateWebhook(channel as TextChannel);
      const quote = kavgaQuotes[Math.floor(Math.random() * kavgaQuotes.length)];
      if (!quote) return;

      await webhook.send({
        content: quote,
        username: 'Kamil',
        avatarURL: avatars.kamil,
      });
      return;
    } catch (err) {
      client.logger.error(`Tayfa RP .kavga hatası: ${err}`);
      return;
    }
  }

  // 2. Rastgele Karakter Etkileşimi (Normal sohbetlerde)
  const now = Date.now();
  if (now - lastRandomInteraction > RANDOM_COOLDOWN) {
    // 5% chance to interject when cooldown is off
    if (Math.random() < 0.05) {
      lastRandomInteraction = now;

      const characters = ['akin', 'hayri', 'kamil', 'mert'] as const;
      const char = characters[Math.floor(Math.random() * characters.length)];
      if (!char) return;
      
      const charQuotes = randomQuotes[char];
      const quote = charQuotes[Math.floor(Math.random() * charQuotes.length)];
      if (!quote) return;
      
      // Capitalize the name correctly for username
      let username = char.charAt(0).toUpperCase() + char.slice(1);
      if (char === 'akin') username = 'Akın';

      try {
        const webhook = await getOrCreateWebhook(channel as TextChannel);
        
        // 3 saniye bekle ki gerçekçi dursun (Sanki bot o an okuyup yazıyormuş gibi)
        setTimeout(async () => {
          await webhook.send({
            content: quote,
            username: username,
            avatarURL: avatars[char],
          }).catch(() => {});
        }, 3000);
      } catch (err) {
        client.logger.error(`Tayfa RP Rastgele mesaj hatası: ${err}`);
      }
    }
  }
}
