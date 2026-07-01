# 🤖 Premium Discord Bot

Türkçe, modern ve modüler Discord botu. Moderasyon, Guard, Kayıt, Davet, Rapor, Log ve daha fazlası.

## 🚀 Hızlı Başlangıç

```bash
git clone <repo-url>
cd discord-bot
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run dev
```

## 🐳 Docker ile Çalıştırma

```bash
docker compose -f docker/docker-compose.dev.yml up
```

## 📦 Teknolojiler

- **Node.js 22** + **TypeScript 5**
- **discord.js v14** — Native slash komut, buton, modal
- **PostgreSQL 16** + **Drizzle ORM**
- **Redis 7** + **BullMQ** — Cache & queue
- **Winston** — Loglama
- **Docker** — Container deploy

## 📁 Proje Yapısı

```
src/
├── client/        # Bot client ve event loader
├── config/        # Yapılandırma
├── core/          # Command/component/event handler
├── database/      # PostgreSQL bağlantı + şema
├── modules/       # Bot modülleri
│   ├── Log/       # Log sistemi (7 tür)
│   ├── Report/    # Rapor sistemi
│   ├── Suggestions/ # Özellik talep sistemi
│   ├── Moderation/  # Ceza komutları
│   ├── Guard/       # Anti-raid/nuke/spam
│   ├── Registration/# Kayıt sistemi
│   ├── Roles/       # Rol yönetimi
│   ├── Invite/      # Referans davet
│   └── Fun/         # Eğlence
├── utils/         # Yardımcı fonksiyonlar
└── locales/       # Dil dosyaları
```

## 🛡 Özellikler

- **Moderasyon**: Ban, kick, mute, warn, timeout, clear
- **Guard**: Anti-raid, anti-nuke, anti-spam, anti-bot
- **Kayıt**: Buton/modal ile otomatik kayıt
- **Davet**: Referans sistemi + ödül rolleri
- **Rol**: Otomatik rol, giriş rolü, rol paneli
- **Rapor**: Kullanıcı raporlama sistemi
- **Öneri**: Özellik talep + oylama sistemi
- **Log**: Tam kapsamlı log (mesaj, üye, ses, rol, kanal, mod)
