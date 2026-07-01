# Discord Sunucu Planı — Yetişkin +18, Çift Dilli (TR/Global)

---

## 1. MİMARİ YAPI & KANAL ŞABLONU

### 1.1. Kategori: KURALLAR & GİRİŞ
_(Herkesin görebildiği tek alan — kayıt tamamlanana kadar başka yer görünmez)_

| Kanal | Amaç |
|-------|------|
| `#kurallar` | +18 ibaresi, global/TR kurallar, yasaklar |
| `#hoşgeldin` | Karşılama mesajı, bot talimatı |
| `#kayıt` | Buton ile **TR** / **Global** / **Both** rolü seçimi |
| `#rol-al` | Ek roller: bildirim, platform, dil etiketi |

### 1.2. Kategori: 📢 DUYURULAR

| Kanal | Amaç |
|-------|------|
| `#announcements` | Global duyurular (herkes görür) |
| `#etkinlikler` | Ortak etkinlikler, turnuvalar |

### 1.3. Kategori: 🇹🇷 TÜRKÇE BÖLÜM
_(Sadece TR veya Both rolü olanlar görür)_

| Kanal | Amaç |
|-------|------|
| `#sohbet` | Genel muhabbet |
| `#ntr` | +18 içerik paylaşımı |
| `#müzik-film` | Müzik ve film tavsiyeleri |
| `#oyun` | Oyun konuşmaları, LFG |
| `#teknoloji` | Teknoloji, yazılım, donanım |
| `#destek` | Üye yardımlaşma kanalı |

### 1.4. Kategori: 🌍 GLOBAL SECTION
_(Only Global or Both role can see)_

| Channel | Purpose |
|---------|---------|
| `#chat` | General discussion |
| `#nsfw` | +18 content sharing |
| `#music-movies` | Music & movie recommendations |
| `#gaming` | Gaming chat, LFG |
| `#tech` | Tech, software, hardware |
| `#support` | Member support |

### 1.5. Kategori: 🎤 SES ODALARI

| Kanal | Amaç |
|-------|------|
| `Sohbet / Lounge` | Genel sesli sohbet |
| `Oyun / Gaming` | Oyun oynarken takılma |
| `Özel / Private` | Özel görüşmeler (stage-like) |
| `AFK` | Boşta olanlar |

### 1.6. Kategori: 🔧 YÖNETİM
_(Gizli — sadece yetkililer görür)_

| Kanal | Amaç |
|-------|------|
| `#mod-log` | Log kanalı |
| `#mod-chat` | Yetkili iç yazışması |
| `#bot-kontrol` | Bot komut testleri |
| `#rapor` | Şikayet logları |

---

## 2. ROL SİSTEMİ

### 2.1. Dil / Bölge Rolleri (Kayıt Anında)
| Rol | Açıklama | Kanal Erişimi |
|-----|----------|---------------|
| `🇹🇷 Türk` | Türkçe bölüm | TR kanalları |
| `🌍 Global` | İngilizce bölüm | Global kanallar |
| `🤝 Both` | Her iki bölüm | Tüm kanallar |

### 2.2. Ek Roller (İsteğe Bağlı)
| Rol | Amaç |
|-----|------|
| `🔔 Ping` | Etkinlik bildirimleri |
| `🎮 PC` / `🎮 Konsol` | Platform etiketi |
| `🗣 EN` / `🗣 TR` / `🗣 DE` | Dil etiketi |

### 2.3. Yetkili Rolleri
| Rol | Yetki |
|-----|-------|
| `👑 Kurucu` | Tam yetki |
| `🛡 Admin` | Tüm yönetim |
| `⚡ Moderatör` | Mesaj silme, mute, kick |
| `🎤 Event Team` | Etkinlik düzenleme |

---

## 3. ÖZEL BOT MİMARİSİ

### 3.1. Bot Özellikleri

**Modül: Kayıt Sistemi**
- `/kayıt` komutu veya giriş kanalında buton ile karşılama
- Butona tıklayınca rol ver + karşılama mesajı at
- `TR`, `Global`, `Both` seçenekleri
- Seçim sonrası ilgili kanallar otomatik açılır

**Modül: Rol Menü**
- Dropdown menü ile ek roller (ping, platform, dil)
- Çoklu seçim destekli

**Modül: Otomatik Moderasyon**
- +18 yaş doğrulama butonu (kabul etmeyen atılır)
- Link engelleyici (belirli kanallar hariç)
- Spam/küfür koruması
- Discord ToS ihlali tespiti

**Modül: Aktivite Takibi**
- Mesaj bazlı aktivite puanı
- Haftalık aktif üye leaderboard'u
- 30 gün inaktif üyeleri uyar + otomatik çıkarma
- Rol bazlı aktivite raporu

**Modül: Log Sistemi**
- Mesaj silme/düzenleme log
- Üye giriş/çıkış log
- Rol değişikliği log
- Ses odası log

### 3.2. Bot Teknolojisi
| Bileşen | Seçim |
|---------|-------|
| Dil | Python (discord.py) veya TypeScript (discord.js) |
| Host | Raspberry Pi 5 / Oracle Cloud Free Tier / VPS |
| Database | SQLite (küçük) → PostgreSQL (büyüdükçe) |
| Dashboard | Basit web arayüzü (opsiyonel) |

---

## 4. ÜYE AKIŞI & KAYIT SÜRECİ

```
1. Davet bağlantısı ile sunucuya katıl
       ↓
2. #kurallar kanalını okur (kabul butonuna tıklar)
       ↓
3. #kayıt kanalına yönlendirilir
       ↓
4. Buton ile dil/bölge seçer (TR / Global / Both)
       ↓
5. Bot rolü verir + hoşgeldin mesajı atar
       ↓
6. İlgili kanallar otomatik görünür
       ↓
7. #rol-al kanalında ek roller seçer (opsiyonel)
       ↓
8. Sohbete başlar 🎉
```

---

## 5. AKTİF ÜYE ODAKLI POLİTİKA

### 5.1. Aktivite Kriterleri
| Seviye | Kriter | Ödül |
|--------|--------|------|
| 🟢 Aktif | Haftada 10+ mesaj | Özel renkli isim |
| 🔵 Düzenli | Ayda 50+ mesaj | Özel rol + emoji kullanımı |
| 🟣 Veteran | 3 ay aktif | Ses odası önceliği |
| 🟠 Elite | 6 ay aktif | Özel sohbet kanalı erişimi |

### 5.2. Temizlik Politikası
- **7 gün** hiç mesaj atmamış üyeye DM uyarı
- **14 gün** hâlâ inaktif → `Inaktif` rolü
- **30 gün** inaktif → sunucudan at
- Geri dönüşte kayıt yenilenebilir

### 5.3. Kalite Kontrol
- Haftalık 5'ten az mesaj atan üyeler gözlem altında
- Spam/bot hesap tespiti anında temizlik
- +18 yaş doğrulaması olmayan üyeler kısıtlı

---

## 6. BAŞLANGIÇ STRATEJİSİ

### Aşama 1: Kurulum (1. Hafta)
- [x] Sunucu oluştur, kategorileri kur
- [ ] Bot geliştirmeye başla
- [ ] Rol sistemini yapılandır
- [ ] Kuralları yaz (TR + EN)

### Aşama 2: Bot Tamamlama (2. Hafta)
- [ ] Kayıt buton sistemi
- [ ] Rol menü sistemi
- [ ] Otomatik moderasyon
- [ ] Log sistemi
- [ ] Test sürümü

### Aşama 3: Soft Launch (3. Hafta)
- [ ] 10-15 güvenilir kişiyi davet et
- [ ] Bug raporu topla
- [ ] Bot hatalarını düzelt
- [ ] Aktif üye politikasını test et

### Aşama 4: Büyüme (1. Ay)
- [ ] Reddit/forumlarda tanıtım
- [ ] Türk + Global ayrı ayrı hedefle
- [ ] Haftalık etkinlikler başlat
- [ ] İlk 100 aktif üye hedefi

---

## 7. ÖNERİLEN BOT KÜTÜPHANELERİ

| Amaç | Araç |
|------|------|
| Bot framework | discord.js v14 / discord.py 2.0+ |
| Buton menü | Discord Components API (ActionRow, ButtonBuilder) |
| Dropdown rol | StringSelectMenu |
| Dashboard | React + Next.js (opsiyonel) |
| Host | Oracle Always Free (4 OCPU, 24GB RAM) |
| Log tutma | Discord Webhook + local JSON/DB |

---

## 8. ÖZET: NEDEN BU PLAN?

- **Az kanal, az ses odası** → üyeler dağılmaz, sohbet yoğundur
- **TR/Global ayrımı** → dil karmaşası olmaz, Both rolü iki dünyayı birleştirir
- **+18 zorunlu** → olgun kitle, az çocuk/toxic
- **Aktif üye odaklı** → şişme üye değil, gerçek topluluk
- **Özel bot** → her şey otomatik, manuel iş yükü yok
- **Profesyonel log sistemi** → denetim kolay, sorun çıkarsa delil var
