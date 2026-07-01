# 🤖 Premium Discord Bot — Mimari Planı

## Teknoloji Yığını

| Bileşen | Teknoloji | Sebep |
|---------|-----------|-------|
| **Runtime** | Node.js 22+ | Event-driven, yüksek performans |
| **Framework** | discord.js v14.18+ | Slash komut, buton, modal, select menu native destek |
| **Dil** | TypeScript 5.x | Tip güvenliği, ölçeklenebilirlik |
| **Database** | PostgreSQL 16 (ana) + Redis 7 (cache/queue) | Relational veri bütünlüğü + hız |
| **ORM** | Drizzle ORM | Type-safe, lightweight, SQL-like |
| **Queue** | BullMQ + Redis | Yetki sırası, guard queue, log akışı |
| **Cache** | ioredis | Prefix cache, cooldown, rate-limit |
| **Sharding** | discord.js built-in sharding + manager | 2000+ sunucu ölçekleme |
| **Lokalizasyon** | i18next (built-in) | Çeviri desteği (ileride EN/DE eklenebilir) |
| **Event Bus** | EventEmitter3 | Modüller arası iletişim |
| **Logging** | Winston + Discord Webhook | Hata takibi, loglama |
| **DevOps** | Docker + Docker Compose | Kolay deploy |
| **Lint/Format** | Biome | Hızlı lint + format |

---

## Dizin Yapısı

```
src/
├── index.ts                    # Entry point, shard manager
├── client/
│   ├── Client.ts               # Bot client wrapper
│   ├── ShardManager.ts         # Shard yönetimi
│   └── Events.ts               # Event loader
├── config/
│   ├── index.ts                # Config reader (dotenv + JSON)
│   ├── settings.ts             # Sunucu bazlı varsayılanlar
│   └── permissions.ts          # Yetki seviyeleri
├── database/
│   ├── connection.ts           # PostgreSQL + Redis bağlantısı
│   ├── schema/
│   │   ├── guild.ts            # Sunucu ayarları
│   │   ├── member.ts           # Üye verileri
│   │   ├── infraction.ts       # Ceza kayıtları
│   │   ├── invite.ts           # Davet referans sistemi
│   │   ├── role.ts             # Otomatik rol yapılandırması
│   │   ├── registration.ts     # Kayıt verileri
│   │   └── log.ts              # Log kayıtları
│   └── migrations/             # Drizzle migration dosyaları
├── modules/
│   ├── Moderation/             # Ceza komutları modülü
│   │   ├── index.ts            # Modül loader
│   │   ├── commands/
│   │   │   ├── ban.ts
│   │   │   ├── kick.ts
│   │   │   ├── mute.ts
│   │   │   ├── warn.ts
│   │   │   ├── timeout.ts
│   │   │   ├── unban.ts
│   │   │   ├── unmute.ts
│   │   │   ├── clear.ts
│   │   │   ├── slowmode.ts
│   │   │   └── lock.ts
│   │   ├── events/
│   │   │   ├── autoModeration.ts
│   │   │   └── messageFilter.ts
│   │   └── utils/
│   │       ├── punishmentHandler.ts
│   │       └── appealSystem.ts
│   ├── Management/             # Sunucu yönetim komutları
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── panel.ts           # Yönetim paneli
│   │   │   ├── guild-settings.ts  # Sunucu ayarları
│   │   │   ├── backup.ts          # Yedekleme
│   │   │   └── statistics.ts      # Sunucu istatistik
│   │   └── utils/
│   │       └── guildManager.ts
│   ├── Guard/                  # Anti-raid & Anti-nuke
│   │   ├── index.ts
│   │   ├── services/
│   │   │   ├── antiRaid.ts        # Hızlı katılım koruması
│   │   │   ├── antiNuke.ts        # Rol/kanal silme koruması
│   │   │   ├── antiSpam.ts        # Spam engelleme
│   │   │   ├── antiLink.ts        # Link engelleme (whitelist)
│   │   │   └── antiBot.ts         # Bot hesap tespiti
│   │   ├── commands/
│   │   │   ├── guard-panel.ts
│   │   │   └── whitelist.ts
│   │   └── utils/
│   │       └── guardLogger.ts
│   ├── Registration/           # Kayıt sistemi
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── kayıt-ol.ts        # Kullanıcı kaydı (modal)
│   │   │   ├── kayıt-ayarları.ts  # Admin ayar komutları
│   │   │   └── kayıt-sorgula.ts   # Kayıt sorgulama
│   │   ├── components/
│   │   │   ├── registerButton.ts
│   │   │   ├── roleSelectMenu.ts
│   │   │   └── registerModal.ts
│   │   ├── events/
│   │   │   └── autoRegister.ts    # Hoşgeldin mesajı + buton
│   │   └── utils/
│   │       └── registrationManager.ts
│   ├── Roles/                  # Rol yönetimi
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── rol-ver.ts         # Rol ekleme
│   │   │   ├── rol-al.ts          # Rol çıkarma
│   │   │   ├── giriş-rolü.ts      # Giriş rolü belirleme
│   │   │   ├── otomatik-rol.ts    # Otomatik rol yapılandırma
│   │   │   ├── rol-paneli.ts      # Tıklanabilir rol menüsü
│   │   │   └── rol-bilgi.ts       # Rol bilgi sorgulama
│   │   └── services/
│   │       ├── autoRoleService.ts
│   │       └── reactionRoleService.ts
│   ├── Invite/                 # Referans davet sistemi
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── davetlerim.ts      # Kişisel davet istatistik
│   │   │   ├── davet-sıralaması.ts # Davet liderlik tablosu
│   │   │   ├── ödüller.ts         # Davet ödül rollerini ayarlama
│   │   │   └── bonus.ts           # Bonus davet ekleme
│   │   ├── events/
│   │   │   └── inviteTracker.ts   # Davet takibi (vanity + normal)
│   │   └── services/
│   │       ├── inviteService.ts
│   │       └── rewardService.ts   # Belirli davet sayısında otomatik rol
│   ├── Fun/                    # Eğlence komutları
│   │   ├── index.ts
│   │   └── commands/
│   │       ├── yetkili-komutları.ts
│   │       ├── espri.ts
│   │       ├── bilgi.ts
│   │       ├── zar.ts
│   │       ├── yazı-tura.ts
│   │       └── avatar.ts
│   ├── Utility/                # Genel yardımcı komutlar
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── help.ts
│   │   │   ├── ping.ts
│   │   │   ├── uptime.ts
│   │   │   ├── bot-bilgi.ts
│   │   │   └── öneri.ts
│   │   └── components/
│   │       └── helpMenu.ts
│   └── Log/                    # Log sistemi
│       ├── index.ts
│       ├── events/
│       │   ├── messageLog.ts
│       │   ├── memberLog.ts
│       │   ├── voiceLog.ts
│       │   ├── roleLog.ts
│       │   ├── channelLog.ts
│       │   └── modLog.ts
│       └── services/
│           ├── logService.ts
│           └── webhookManager.ts
├── core/
│   ├── CommandHandler.ts       # Slash komut yükleyici
│   ├── ComponentHandler.ts     # Buton/select/modal handler
│   ├── EventHandler.ts         # Event yükleyici
│   ├── CooldownManager.ts      # Cooldown yönetimi
│   ├── PermissionManager.ts    # Yetki kontrol
│   └── ErrorHandler.ts         # Global hata yönetimi
├── utils/
│   ├── embeds.ts               # Embed builder yardımcıları
│   ├── pagination.ts           # Sayfalama sistemi
│   ├── formatters.ts           # Tarih/büyüklük formatlama
│   ├── validators.ts           # Input validasyon
│   ├── constants.ts            # Sabitler
│   └── helpers.ts              # Genel yardımcı fonksiyonlar
├── types/
│   ├── commands.ts             # Komut tip tanımları
│   ├── events.ts               # Event tip tanımları
│   ├── database.ts             # DB tip tanımları
│   └── discord.d.ts            # Discord tip genişletmeleri
├── locales/
│   ├── tr/                     # Türkçe çeviriler
│   │   ├── commands.json
│   │   ├── errors.json
│   │   └── moderation.json
│   └── en/                     # İngilizce (ileriye dönük)
└── config/
    ├── .env.example
    └── config.json
```

---

## Veritabanı Şeması (PostgreSQL)

### guilds (Sunucu Ayarları)
```sql
CREATE TABLE guilds (
  id            VARCHAR(20) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  prefix        VARCHAR(5) DEFAULT '/',
  locale        VARCHAR(5) DEFAULT 'tr',
  
  -- Guard Ayarları
  guard_enabled         BOOLEAN DEFAULT true,
  anti_raid_limit       INT DEFAULT 5,     -- 5 saniyede max üye
  anti_nuke_enabled     BOOLEAN DEFAULT true,
  whitelist_roles       TEXT[] DEFAULT '{}',
  
  -- Kayıt Ayarları
  register_channel      VARCHAR(20),
  register_role         VARCHAR(20),
  register_enabled      BOOLEAN DEFAULT false,
  
  -- Giriş Rolü
  join_role_id          VARCHAR(20),
  
  -- Log Ayarları
  log_channel           VARCHAR(20),
  mod_log_channel       VARCHAR(20),
  message_log_enabled   BOOLEAN DEFAULT false,
  member_log_enabled    BOOLEAN DEFAULT true,
  voice_log_enabled     BOOLEAN DEFAULT false,
  
  -- Davet Sistemi
  invite_tracking       BOOLEAN DEFAULT false,
  invite_roles          JSONB DEFAULT '[]',  -- {invites: 5, role_id: "..."}
  
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

### members (Üye Verileri)
```sql
CREATE TABLE members (
  id              VARCHAR(20) NOT NULL,
  guild_id        VARCHAR(20) NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  username        VARCHAR(32),
  display_name    VARCHAR(32),
  
  -- Kayıt Bilgisi
  registered      BOOLEAN DEFAULT false,
  registered_at   TIMESTAMP,
  registerer_id   VARCHAR(20),          -- Kayıt eden yetkili
  
  -- Davet Bilgisi
  total_invites   INT DEFAULT 0,
  join_inviter    VARCHAR(20),          -- Davet eden üye
  fake_invites    INT DEFAULT 0,
  left_invites    INT DEFAULT 0,
  bonus_invites   INT DEFAULT 0,
  
  -- Aktivite
  last_message_at TIMESTAMP,
  join_at         TIMESTAMP DEFAULT NOW(),
  warn_count      INT DEFAULT 0,
  
  PRIMARY KEY (id, guild_id)
);
```

### infractions (Ceza Kayıtları)
```sql
CREATE TYPE infraction_type AS ENUM ('uyarı', 'mute', 'vmute', 'ban', 'kick', 'timeout');

CREATE TABLE infractions (
  id              SERIAL PRIMARY KEY,
  guild_id        VARCHAR(20) NOT NULL REFERENCES guilds(id),
  user_id         VARCHAR(20) NOT NULL,
  moderator_id    VARCHAR(20) NOT NULL,
  type            infraction_type NOT NULL,
  reason          TEXT,
  duration        INT,                  -- saniye cinsinden (NULL = kalıcı)
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP
);
```

### auto_roles (Otomatik Roller)
```sql
CREATE TABLE auto_roles (
  id            SERIAL PRIMARY KEY,
  guild_id      VARCHAR(20) NOT NULL REFERENCES guilds(id),
  role_id       VARCHAR(20) NOT NULL,
  type          VARCHAR(20) NOT NULL,   -- 'join' (giriş), 'level', 'invite', 'boost'
  required      INT DEFAULT 0,          -- gereken davet/seviye sayısı
  priority      INT DEFAULT 0
);
```

### invites (Davet Kayıtları)
```sql
CREATE TABLE invites (
  id            SERIAL PRIMARY KEY,
  guild_id      VARCHAR(20) NOT NULL,
  code          VARCHAR(20) NOT NULL,
  inviter_id    VARCHAR(20) NOT NULL,
  invitee_id    VARCHAR(20),
  uses          INT DEFAULT 0,
  fake          BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  joined_at     TIMESTAMP
);
```

---

## Modül Detayları

### 1. Moderasyon Modülü

| Komut | Yetki | Açıklama |
|-------|-------|----------|
| `/ban <user> [sebep] [sil]` | BAN_MEMBERS | Üyeyi yasakla |
| `/kick <user> [sebep]` | KICK_MEMBERS | Üyeyi at |
| `/mute <user> <süre> [sebep]` | MODERATE_MEMBERS | Metin mute |
| `/vmute <user> <süre> [sebep]` | MODERATE_MEMBERS | Ses mute |
| `/warn <user> [sebep]` | MODERATE_MEMBERS | Uyarı ver |
| `/unban <id> [sebep]` | BAN_MEMBERS | Yasağı kaldır |
| `/unmute <user>` | MODERATE_MEMBERS | Mute kaldır |
| `/clear <sayı> [user]` | MANAGE_MESSAGES | Toplu mesaj sil |
| `/slowmode <süre>` | MANAGE_CHANNELS | Yavaş mod |
| `/lock` / `/unlock` | MANAGE_CHANNELS | Kanal kilitle |
| `/timeout <user> <süre> [sebep]` | MODERATE_MEMBERS | Zaman aşımı |
| `/ceza-sorgula <user>` | MODERATE_MEMBERS | Ceza geçmişi |
| `/ceza-kaldır <id>` | ADMINISTRATOR | Ceza kaydını sil |

**Otomatik Özellikler:**
- Otomatik kelime filtresi (özelleştirilebilir kara liste)
- Spam koruması (mesaj sayısı + zaman eşiği)
- Mass mention koruması (>5 mention uyarı, >10 mute)
- Link engelleme (whitelist destekli)
- Büyük harf engelleme (%70+ büyük harf)

### 2. Guard Modülü

| Koruması | Açıklama |
|----------|----------|
| **Anti-Raid** | Belirlenen eşikten hızlı üye katılımında sunucuyu kilitle + yetkililere bildir |
| **Anti-Nuke** | Kanal/rol silme, yetki değişikliği, webhook oluşturma — whitelist dışındakileri otomatik banla ve geri al |
| **Anti-Spam** | Duplicate mesaj, mention spam, emoji spam tespiti |
| **Anti-Link** | Whitelist dışı link paylaşımını engelle |
| **Anti-Bot** | Bot hesaplarını tespit et, şüpheli ise otomatik kick |
| **Anti-Alt** | Hesap yaşı < 7 gün olanları otomatik güvenlik odasına yönlendir |

### 3. Kayıt Modülü (Sunucu Planına Uyumlu)

| Bileşen | Açıklama |
|---------|----------|
| `/kayıt-ol` | Modal açar: isim, yaş, dil seçimi (TR/Global/Both) — butonlu versiyon da opsiyonel |
| `/kayıt-ayarla` | Admin: kayıt kanalı, kayıtsız rolü, kayıtlı rolü belirler |
| `/kayıt-et <user>` | Yetkili: kullanıcıyı manuel kayıt eder |
| **Otomatik karşılama** | Yeni üye katılınca özel mesaj + kayıt butonu |
| **Yaş doğrulama** | +18 butonu (kabul etmeyen atılır) |

### 4. Rol Sistemi

| Komut | Açıklama |
|-------|----------|
| `/rol-ver <user> <rol>` | Üyeye rol ekle |
| `/rol-al <user> <rol>` | Üyeden rol çıkar |
| `/giriş-rolü <rol>` | Sunucuya giren herkese otomatik rol ver |
| `/otomatik-rol ekle <rol> <tip> [miktar]` | Otomatik rol kuralı ekle (join/invite/boost) |
| `/otomatik-rol listele` | Mevcut kuralları göster |
| `/otomatik-rol sil <id>` | Kural sil |
| `/rol-paneli` | Embed + buton/dropdown ile rol seçim menüsü oluştur |
| `/rol-bilgi <rol>` | Rol hakkında detaylı bilgi |

### 5. Referans Davet Sistemi

| Özellik | Açıklama |
|---------|----------|
| Gerçek zamanlı davet takibi | Kimin kimi davet ettiği kayıt altında |
| Sahte davet tespiti | Aynı IP, boş hesaplar, hızlı gir-çık |
| Davet ödülleri | 5/10/25/50 davette otomatik rol verme |
| `/davetlerim` | Kişisel davet istatistiği |
| `/davet-sıralaması` | Liderlik tablosu (sayfalı) |
| `/ödüller` | Davet ödül rollerini ayarlama |
| `/bonus <user> <sayı>` | Admin bonus davet ekleme |

### 6. Eğlence Modülü
- Zar, yazı-tura, espri, bilgi, avatar, sunucu bilgi

### 7. Log Sistemi (Tam Kapsamlı)

| Log Türü | Kanallar |
|----------|----------|
| Mesaj log | Silinen / düzenlenen mesajlar |
| Üye log | Giriş / çıkış / atılma |
| Ses log | Odaya girme / çıkma / taşınma |
| Rol log | Rol ekleme / çıkarma / oluşturma |
| Kanal log | Kanal oluşturma / silme / düzenleme |
| Mod log | Tüm ceza işlemleri |
| Sunucu log | Sunucu adı / avatar / bölge değişikliği |
| Bot log | Bot hata ve yeniden başlatma |

---

## Önceliklendirme & Geliştirme Roadmap

### Faz 1: Çekirdek (1. Hafta)
- [ ] Proje iskeleti kurulum
- [ ] Database şeması + migration
- [ ] Command/event/component handler
- [ ] Permission + cooldown yönetimi
- [ ] Yardım komutu + embed sistemi
- [ ] Dil dosyası (TR)

### Faz 2: Moderasyon + Log (2. Hafta)
- [ ] Tüm ceza komutları (ban/kick/mute/warn/clear)
- [ ] Otomatik moderasyon (spam/küfür/link)
- [ ] Tam log sistemi (7 tür)

### Faz 3: Guard (3. Hafta)
- [ ] Anti-raid
- [ ] Anti-nuke
- [ ] Anti-spam
- [ ] Anti-bot + anti-alt

### Faz 4: Kayıt + Rol (4. Hafta)
- [ ] Kayıt sistemi (buton + modal)
- [ ] Giriş rolü + otomatik roller
- [ ] Rol paneli (dropdown/buton)
- [ ] Rol ekleme/çıkarma komutları

### Faz 5: Davet + Eğlence (5. Hafta)
- [ ] Referans davet sistemi
- [ ] Davet ödülleri
- [ ] Eğlence komutları
- [ ] Sunucu yönetim paneli

### Faz 6: Polisaj (6. Hafta)
- [ ] Hata ayıklama
- [ ] Performans testi (100+ sunucu simülasyonu)
- [ ] Docker compose hazırlığı
- [ ] Dokümantasyon
- [ ] Deploy

---

## Kalite Standartları (Premium)

- **Tip güvenliği**: Strict TypeScript, her veri akışında tip kontrolü
- **Error handling**: Tüm promise'ler `.catch()` ile, global error event
- **Rate limiting**: Komut bazında 3sn/5sn/10sn cooldown, sunucu bazında global limit
- **Permission cascade**: Kullanıcı yetki → Rol yetki → Bot yetki → Discord yetki zinciri
- **Transactional DB**: Kritik işlemler rollback korumalı
- **Modüler**: Her modül bağımsız, dependency injection ile gevşek bağlı
- **Config-driven**: Tüm sabitler JSON/env ile yönetilir, kodda hardcode yok
- **Log everything**: Hata -> warn -> info -> debug, seviyeli log
- **Sharding ready**: 1 sunucudan 10000 sunucuya ölçeklenebilir
- **Self-healing**: Redis/MQ bağlantı hatasında otomatik yeniden bağlanma
