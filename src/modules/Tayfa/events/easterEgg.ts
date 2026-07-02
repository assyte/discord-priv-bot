import type { Message, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getOrCreateWebhook } from '../services/webhookService.js';
import { avatars } from '../services/quotes.js';

// Cooldown tracker: Her kişi için veya global bir bekleme süresi, spam'i önlemek için.
const cooldowns = new Set<string>();
const COOLDOWN_TIME = 2 * 60 * 1000; // 2 dakika

// Replik Havuzu
const SILA_QUOTES = [
  { char: 'mert', text: 'Sıla kardeşimiz (Tıfıtı) buraların neşesidir, onu üzen beni karşısında bulur.' },
  { char: 'kamil', text: 'Tıfıtı Sıla gelmiş, vay anam vay! Hayri gelmeden pizzaları saklayın!' },
  { char: 'hayri', text: 'Sıla abla bana bir İskender ısmarlar mısın? Valla çok açım...' },
  { char: 'akin', text: 'Sıla\'nın enerjisi bizim algoritmaları bile hızlandırıyor vallahi!' },
  { char: 'kamil', text: 'Tıfıtı kardeşim mahallenin ablasıdır, ona yamuk yapanın defterini düreyim!' },
  { char: 'hayri', text: 'Sıla... İki porsiyon döner dedin mi aklıma Tıfıtı gelir.' },
  { char: 'mert', text: 'Tıfıtı... Bu isim bana hep derin bir güven veriyor.' },
  { char: 'akin', text: 'Sıla\'nın olduğu ortamda ping bile sıfıra düşüyor, öyle bir aurası var!' },
  { char: 'kamil', text: 'Ulan Tıfıtı gelmiş, toparlanın tayfa! Saygıda kusur etmeyin.' },
  { char: 'hayri', text: 'Tıfıtı abla, bana borç versene... Söz haftaya ödeyeceğim.' },
  { char: 'mert', text: 'Sıla Hanım gelmiş, mahallemize güneş doğdu.' },
  { char: 'akin', text: 'Sıla\'nın discord mesajları bile farklı bir frekansta çalışıyor, inanılmaz!' },
];

const UGUR_QUOTES = [
  { char: 'kamil', text: 'Tokatlı Uğur abim gelmiş! Ulan Uğur, Erbaa\'nın gururusun be!' },
  { char: 'hayri', text: 'Uğur abi Tokat kebabı ne zaman yiyoruz? Erbaa yaprağı sarması da uyar valla.' },
  { char: 'mert', text: 'Tokat\'ın yiğidi Uğur kardeşim, adamın hasıdır.' },
  { char: 'akin', text: 'Uğur abiyle Tokat sınırlarında bir sunucu kurmayı planlıyoruz.' },
  { char: 'kamil', text: 'Erbaa dedin mi duracaksın usta! Uğur kardeşim memleketin medarı iftiharıdır.' },
  { char: 'hayri', text: 'Uğur abi bana cevizli bat sözün vardı, unutmadım bak!' },
  { char: 'mert', text: 'Uğur kardeşim, Erbaa\'nın o temiz havasını buraya da getirdi.' },
  { char: 'akin', text: 'Uğur abimin setup\'ı kesin Tokat\'ta bir dağ evinde, pingi bile organiktir.' },
  { char: 'kamil', text: 'Tokatlı Uğur geldi, herkes esas duruşa geçsin lan!' },
  { char: 'hayri', text: 'Erbaa yaprağı olsa da yesek... Uğur abi ne zaman getiriyorsun?' },
  { char: 'mert', text: 'Erbaa\'nın yolları taştandır, Uğur kardeşimin kalbi aslandır.' },
  { char: 'akin', text: 'Uğur abimin Tokat şivesiyle yazdığı kodlar bile ayrı bir stabil çalışıyor.' },
];

const ASETE_QUOTES = [
  { char: 'akin', text: 'Asete abim yazılımın tanrısıdır, adam tek satır kodla Matrix\'i çökertiyor!' },
  { char: 'kamil', text: 'Asete mi? O adam harbi kralların kralıdır. Ama bakkala olan borcunu bir ödesin artık.' },
  { char: 'hayri', text: 'Asete reis! Ne olur bir pizza söyle bana açlıktan ölüyorum.' },
  { char: 'mert', text: 'Asete kardeşimin duruşu yeter, adam bu sunucunun temel taşıdır.' },
  { char: 'akin', text: 'Sistemin kurucusu Asete konuştu! Çabuk sunucuyu yedekleyin!' },
  { char: 'kamil', text: 'Ulan Asete, kod yazacağım diye mahallede adam bırakmadın be!' },
  { char: 'hayri', text: 'Asete abi sen de çok para vardır şimdi, bana bir menü ateşlesene.' },
  { char: 'mert', text: 'Asete... Büyük usta. Onun olduğu yerde bize laf düşmez.' },
  { char: 'akin', text: 'Asete abimin klavye sesleri kulağıma ninni gibi geliyor.' },
  { char: 'kamil', text: 'Asete geldi mekanın sahibi geldi! Çekilin yoldan!' },
  { char: 'hayri', text: 'Asete abi botu bırak da bize lahmacun ısmarla be!' },
  { char: 'mert', text: 'Asete kardeşimin kodları gibi karakteri de sağlamdır.' },
];

// İsimleri dönüştürmek için
const CHAR_NAMES: Record<string, string> = {
  kamil: 'Kamil',
  hayri: 'Hayri',
  mert: 'Mert',
  akin: 'Akın'
};

export async function messageCreate(client: Client, message: Message) {
  if (message.author.bot || !message.guild) return;
  const channel = message.channel;
  if (!channel.isTextBased() || channel.isDMBased() || channel.isThread()) return;

  const content = message.content.toLowerCase();

  // Cooldown kontrolü
  const cdKey = message.guild.id + '-' + message.author.id + '-easteregg';
  if (cooldowns.has(cdKey)) return;

  let selectedQuote: { char: string, text: string } | null = null;

  // 1. Sıla (Tıfıtı) Kontrolü
  if (/(?:^|\W)(tıfıtı|tifiti|tıfıt)(?:$|\W)/i.test(content)) {
    selectedQuote = SILA_QUOTES[Math.floor(Math.random() * SILA_QUOTES.length)]!;
  }
  // 2. Uğur (Tokat/Erbaa) Kontrolü
  else if (/(?:^|\W)(tokat|tokatlı|erbaa|erba)(?:$|\W)/i.test(content)) {
    selectedQuote = UGUR_QUOTES[Math.floor(Math.random() * UGUR_QUOTES.length)]!;
  }
  // 3. Asete Kontrolü
  else if (/(?:^|\W)(assyte|aseta|asete|ass)(?:$|\W)/i.test(content)) {
    selectedQuote = ASETE_QUOTES[Math.floor(Math.random() * ASETE_QUOTES.length)]!;
  }

  if (selectedQuote) {
    try {
      const webhook = await getOrCreateWebhook(channel as TextChannel);
      
      cooldowns.add(cdKey);
      setTimeout(() => cooldowns.delete(cdKey), COOLDOWN_TIME);

      // Gerçekçilik için rastgele 1.5 - 3 saniye bekle
      const delay = Math.floor(Math.random() * 1500) + 1500;
      setTimeout(async () => {
        await webhook.send({
          content: selectedQuote!.text,
          username: CHAR_NAMES[selectedQuote!.char],
          avatarURL: avatars[selectedQuote!.char as keyof typeof avatars],
        }).catch(() => {});
      }, delay);
      
    } catch (error) {
      client.logger.error('Easter Egg webhook hatası:', error);
    }
  }
}
