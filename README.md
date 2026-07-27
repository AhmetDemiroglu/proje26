# Tercihçe

Tercihçe, 2026 YKS adaylarının sonuçlarını zorunlu kimlik bilgisi vermeden
değerlendiren, 2026 program kataloğunu 2025 taban sıralamalarıyla karşılaştıran
ücretsiz bir tercih rehberidir.

Uygulama üç ayrı veri alanı kullanır:

1. Tarayıcıda çalışan tercih eşleştirme motoru
2. Firebase'e yazılan, kimlik içermeyen anonim istatistik kayıtları
3. Kullanıcı ayrıca açık rıza verirse oluşturulan özel erişimli burs profili

## Özellikler

- TYT, SAY, EA, SÖZ ve DİL yerleştirme puanı ile başarı sırası girişi
- Opsiyonel net girişi
- Şehir, program, üniversite türü ve burs filtreleri
- Güçlü, dengeli, sınırda ve iddialı seçenek grupları
- 21.482 programlık güncel YÖK Atlas veri paketi
- Yarım kalan analizleri de kapsayan, kimlik içermeyen anonim istatistik kaydı
- Ad ve e-posta içeren burs profili için ayrı aydınlatma ve açık rıza
- Firebase e-posta bağlantısıyla burs profili doğrulama
- IP saklamayan şehir ve yaklaşık tekil oturum analitiği
- Yalnızca izinli hesaba açık yönetim paneli ve CSV dışa aktarma
- Destekçi başvurusu, inceleme, onay ve ret akışı
- Onaylı sonuçlardan puan ortalaması, sıralama dilimi ve tercih istatistikleri
- Tüm zamanlar istatistiği için idempotent, 16 parçalı Firestore toplulaştırması
- Kritik yönetici değişiklikleri için özel işlem günlüğü
- Yönetim panelinden burs profili toplamayı açma ve kapatma
- Gemini ile opsiyonel ve sunucu taraflı liste yorumu
- Firestore güvenlik kuralları ve emülatör testleri
- Vercel ve Firebase Spark planına uygun, Functions kullanmayan mimari

## Yerel çalıştırma

Gereksinimler:

- Node.js 22.13 veya üzeri
- Firebase emülatör testi için Java 17

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır. Firebase bilgileri olmadan
tercih eşleştirmesi ve tüm arayüz çalışır. Bu modda sunucuya kayıt yapılmaz.

## Komutlar

```bash
npm test
npm run test:rules
npm run test:backend:e2e
npm run test:all
npm run lint
npm run build
npm run build:vercel
npm run data:sync
```

- `npm test`: eşleştirme, veri bütünlüğü ve form akışı testleri
- `npm run test:rules`: Firebase Auth ve Firestore emülatörüyle güvenlik testi
- `npm run test:backend:e2e`: emülatörlerde analitik, yönetici doğrulaması,
  istatistik, destekçi onayı, işlem günlüğü ve sistem anahtarı uçtan uca testi
- `npm run test:all`: tüm testler, lint ve üretim derlemesi
- `npm run build`: Next.js üretim derlemesi
- `npm run build:vercel`: Vercel'in kullanacağı aynı üretim derlemesi
- `npm run data:sync`: YÖK Atlas API'sinden program verisini yeniler

## Firebase bağlantısı

Adım adım kurulum için [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)
dosyasını izleyin.

## Mimari ve veri

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
- [docs/SCHOLARSHIP_NETWORK.md](docs/SCHOLARSHIP_NETWORK.md)

## Veri kaynakları

Program verisi YÖK Atlas'ın güncel tercih kılavuzu API'sinden alınır. Kaynak
betiği her program için 2026 katalog bilgisini, 2025 taban puanını ve başarı
sırasını saklar. Tercihçe, ÖSYM veya YÖK'e bağlı değildir. Nihai tercih öncesi
güncel ÖSYM kılavuzu kontrol edilmelidir.

## Yayından önce zorunlu

Burs profili üretimde açılmadan önce aşağıdakiler tamamlanmalıdır:

- `DATA_CONTROLLER_NAME`
- `DATA_CONTROLLER_EMAIL`
- `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` ve
  `FIREBASE_ADMIN_PRIVATE_KEY`
- `ADMIN_EMAILS`
- `ANALYTICS_HASH_SALT`
- Firebase e-posta gönderici adı ve şablonu
- Firebase yetkili alan adları
- App Check
- Veri sorumlusu tarafından son aydınlatma ve açık rıza metni kontrolü

Bu bilgiler tamamlanmadan burs profili toplama özelliği üretimde
etkinleştirilmemelidir.

Yönetim merkezi `/admin`, destekçi başvurusu `/destekci-basvuru` yolundadır.
Yönetim API'leri Firebase kimlik belirtecini sunucuda doğrular ve yalnızca
`ADMIN_EMAILS` izin listesine veri döndürür.
