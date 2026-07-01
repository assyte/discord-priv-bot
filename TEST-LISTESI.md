# 🧪 Bot Test Listesi

## 1. Genel Kontroller

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 1.1 | Bot çevrimiçi mi? | 🟢 Yeşil online, "2696 kişi ile konuşuyor" | ⬜ |
| 1.2 | `/yardım` komutu çalışıyor mu? | Premium embed, 4 kategori, 17 komut listelenir | ⬜ |
| 1.3 | Embed footer'ı doğru mu? | "ᴅᴇᴠ ʙʏ ᴀꜱꜱʏᴛᴇ • premium bot" | ⬜ |
| 1.4 | Bot tagi doğru mu? | GalenShuffle#3175 | ⬜ |

---

## 2. Moderasyon Komutları — 🛡️

### 2.1 `/ban`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.1.1 | Geçerli bir üyeyi yasakla | Üye banlanır, embed gönderilir | ⬜ |
| 2.1.2 | Kendini yasaklamayı dene | Hata mesajı: "Kendini yasaklayamazsın" | ⬜ |
| 2.1.3 | Sebep belirtmeden yasakla | "Sebep belirtilmemiş" ile banlanır | ⬜ |
| 2.1.4 | Rolü senden yüksek üyeyi yasakla | Hata mesajı | ⬜ |
| 2.1.5 | Botu yasaklamayı dene | Hata mesajı | ⬜ |

### 2.2 `/kick`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.2.1 | Geçerli üyeyi at | Üye atılır, embed gönderilir | ⬜ |
| 2.2.2 | Kendini atmayı dene | Hata mesajı | ⬜ |
| 2.2.3 | Yetkisiz üyeyi atmaya çalış | Hata mesajı | ⬜ |

### 2.3 `/mute`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.3.1 | Üyeyi sesli kanalda sustur | Üye mute olur, embed gönderilir | ⬜ |
| 2.3.2 | Zaten muteli üyeyi sustur | Hata mesajı | ⬜ |
| 2.3.3 | Ses kanalında olmayan üyeyi sustur | Hata mesajı | ⬜ |

### 2.4 `/vmute`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.4.1 | Üyeyi sesli kanalda sağırlaştır | Üye sağırlaştırılır | ⬜ |
| 2.4.2 | Zaten sağır üyeyi sustur | Hata mesajı | ⬜ |

### 2.5 `/timeout`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.5.1 | Üyeyi timeout'a at (10 dk) | Süreli ceza uygulanır | ⬜ |
| 2.5.2 | Geçersiz süre dene | Hata mesajı | ⬜ |

### 2.6 `/uyarı` (warn)
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.6.1 | Üyeye uyarı ver | Uyarı kaydedilir, embed gönderilir | ⬜ |
| 2.6.2 | Sebep belirtmeden uyar | "Sebep belirtilmemiş" ile kaydedilir | ⬜ |

### 2.7 `/unban`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.7.1 | Banlı üyeyi aç | Ban kaldırılır, embed gönderilir | ⬜ |
| 2.7.2 | Banlı olmayan üyeyi aç | Hata mesajı | ⬜ |

### 2.8 `/unmute`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.8.1 | Muteli üyenin mutesini kaldır | Mute kalkar | ⬜ |
| 2.8.2 | Muteli olmayan üyeyi unmutele | Hata mesajı | ⬜ |

### 2.9 `/clear`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.9.1 | 10 mesaj sil | 10 mesaj silinir | ⬜ |
| 2.9.2 | 0 mesaj silmeyi dene | Hata mesajı | ⬜ |
| 2.9.3 | 100'den fazla mesaj silmeyi dene | Hata mesajı (limit) | ⬜ |
| 2.9.4 | 14 günden eski mesajları sil | Hata mesajı (Discord limiti) | ⬜ |

### 2.10 `/slowmode`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.10.1 | 5 saniye slowmode ayarla | Kanalda yavaş mod etkinleşir | ⬜ |
| 2.10.2 | 0 saniye (kapat) | Slowmode kapanır | ⬜ |
| 2.10.3 | 21600 üzeri saniye dene | Hata mesajı | ⬜ |

### 2.11 `/lock`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.11.1 | Kanalı kilitle | Herkese @everyone send mesaj kapatılır | ⬜ |
| 2.11.2 | Kilitli kanalı aç | Kanal tekrar herkese açılır | ⬜ |

### 2.12 `/ceza-sorgula`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.12.1 | Banlı üyenin cezalarını sorgula | Ceza geçmişi gösterilir | ⬜ |
| 2.12.2 | Temiz geçmişi olan üyeyi sorgula | "Hiç ceza kaydı yok" | ⬜ |

### 2.13 `/ceza-kaldır`
| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 2.13.1 | Geçerli ceza ID'si gir | Ceza pasifleştirilir | ⬜ |
| 2.13.2 | Geçersiz ID gir | Hata mesajı | ⬜ |
| 2.13.3 | Zaten pasif cezayı kaldırmayı dene | Hata mesajı | ⬜ |

---

## 3. Rapor Sistemi — 📝

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 3.1 | `/rapor` ile bir üyeyi bildir | Rapor veritabanına kaydedilir | ⬜ |
| 3.2 | Sebep belirtmeden raporla | Varsayılan sebep atanır | ⬜ |
| 3.3 | Rapor kanalı ayarlanmışsa embed gönderilir | Log kanalında rapor embed'i görünür | ⬜ |
| 3.4 | Admin raporu "inceleniyor" yapabilir mi? | Manuel DB sorgusu | ⬜ |

---

## 4. Öneri Sistemi — 💡

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 4.1 | `/öneri` ile öneri gönder | Öneri kaydedilir, embed gönderilir | ⬜ |
| 4.2 | `/öneri-yönet kabul` | Öneri durumu "kabul" olur | ⬜ |
| 4.3 | `/öneri-yönet red` | Öneri durumu "red" olur | ⬜ |
| 4.4 | Geçersiz ID ile yönetim dene | Hata mesajı | ⬜ |

---

## 5. Yetki Kontrolleri

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 5.1 | Yetkisiz kullanıcı `/ban` dener | "Bu komutu kullanma yetkin yok" | ⬜ |
| 5.2 | Yetkili kullanıcı `/ban` kullanır | Çalışır | ⬜ |
| 5.3 | DM'de guildOnly komut çalıştır | "Sadece sunucularda kullanılabilir" | ⬜ |

---

## 6. Cooldown Testi

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 6.1 | Aynı komutu arka arkaya 2 kere çalıştır | İkincisinde "X saniye beklemelisin" | ⬜ |

---

## 7. Log Sistemi (Varsa)

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 7.1 | Mesaj silinince log kanalına yazılır mı? | Log embed'i görünür | ⬜ |
| 7.2 | Üye katılınca log kaydı oluşur mu? | Log embed'i görünür | ⬜ |
| 7.3 | Üye ayrılınca log kaydı oluşur mu? | Log embed'i görünür | ⬜ |

---

## 8. Veritabanı

| # | Test | Beklenen | Durum |
|---|------|----------|-------|
| 8.1 | Komut çalıştırınca `guilds` tablosuna kayıt düşer mi? | Guild otomatik oluşur | ⬜ |
| 8.2 | Ceza kaydı `infractions` tablosuna eklenir mi? | INSERT yapılır | ⬜ |
| 8.3 | Rapor `reports` tablosuna eklenir mi? | INSERT yapılır | ⬜ |
| 8.4 | Öneri `suggestions` tablosuna eklenir mi? | INSERT yapılır | ⬜ |

---

## Notlar

- ❌ = Çalışmıyor
- ⚠️ = Kısmen çalışıyor / hatalı
- ✅ = Çalışıyor
- ⬜ = Henüz test edilmedi

Botu durdurmak için: `kill $(pgrep -f "tsx src/index.ts")`
Logları izlemek için: `tail -f /mnt/data/Projects/discord-server/bot.log`
