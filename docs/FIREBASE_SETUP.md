# Firebase kurulum adımları

Mevcut Firebase proje ekranında proje oluşturulmuş durumda. Sıradaki işlemler
aşağıdaki sırayla yapılmalıdır.

## 1. Web uygulaması ekle

1. Firebase Console'da proje özetini aç.
2. Web simgesine tıkla.
3. Uygulama takma adı olarak `tercihce-web` yaz.
4. Firebase Hosting seçeneğini işaretleme. Yayın Vercel üzerinden yapılacak.
5. Uygulamayı kaydet.
6. Gösterilen `firebaseConfig` değerlerini `.env.local` dosyasındaki
   `NEXT_PUBLIC_FIREBASE_*` alanlarına karşılık gelecek şekilde ekle.

Firebase web yapılandırması gizli değildir. Firestore güvenliği API anahtarına
değil güvenlik kurallarına dayanır.

## 2. Authentication aç

1. Build veya Security menüsünden Authentication'ı aç.
2. Sign-in method bölümüne gir.
3. Anonymous sağlayıcısını etkinleştir.
4. Email/Password sağlayıcısını aç.
5. Aynı ekranda Email link seçeneğini etkinleştir.
6. Google sağlayıcısını etkinleştir. Bu sağlayıcı yalnızca yönetim paneli
   oturumu için kullanılır.

Anonymous Auth kimliksiz araştırma yazma yetkisi için kullanılır. Email link
burs profili doğrulaması içindir. Parola toplanmaz.

## 3. Yetkili alan adları

Authentication ayarlarında Authorized domains listesine ekle:

- `localhost`
- Vercel'in vereceği üretim alan adı
- Daha sonra bağlanırsa özel alan adı

Doğrulama bağlantısı `/burs-dogrula` yoluna döner.

## 4. Firestore oluştur

1. Firestore Database bölümünü aç.
2. Create database seç.
3. Standard edition seç.
4. Production mode seç.
5. Uygun Avrupa bölgesini seç.

Konum daha sonra değiştirilemez. Veri yerleşimi ve hukuki aktarım modeli
yayından önce veri sorumlusu tarafından değerlendirilmelidir.

## 5. Firebase CLI bağlantısı

Proje klasöründe:

```bash
npx firebase-tools login
npx firebase-tools projects:list
npx firebase-tools use --add
```

`use --add` sırasında bu Firebase projesini seç ve takma ad olarak `default`
yaz. Bu işlem `.firebaserc` dosyasını oluşturur.

Kuralları dağıt:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

## 6. App Check

1. Firebase Console'da App Check'i aç.
2. Web uygulamasını seç.
3. reCAPTCHA v3 sağlayıcısını kaydet.
4. Site anahtarını `.env.local` içindeki
   `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` alanına yaz.
5. Önce metrikleri izle, doğru çalıştığı doğrulandıktan sonra Firestore için
   enforcement aç.

## 7. Yerel bağlantı testi

`.env.local` içinde:

```text
NEXT_PUBLIC_FIREBASE_USE_EMULATORS=true
```

Bir terminalde emülatörleri aç:

```bash
npx firebase-tools@14.18.0 emulators:start --project demo-tercihce --only auth,firestore
```

Başka terminalde:

```bash
npm run dev
```

Sunucu analitiği ve yönetici API'lerini emülatörde çalıştırmak için aynı
terminalde aşağıdaki değerler de bulunmalıdır:

```text
FIREBASE_ADMIN_PROJECT_ID=demo-tercihce
FIREBASE_ADMIN_USE_EMULATORS=true
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
ANALYTICS_HASH_SALT=en-az-32-karakterlik-yerel-test-anahtari
ADMIN_EMAILS=admin@example.com
```

Üretim Firebase projesini test ederken
`NEXT_PUBLIC_FIREBASE_USE_EMULATORS=false` ve
`FIREBASE_ADMIN_USE_EMULATORS=false` olmalıdır.

## 8. Gemini

Gemini anahtarını `.env.local` içine ekle:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite
```

Anahtarı `NEXT_PUBLIC_` ile başlayan bir değişkene yazma. Gemini isteği yalnızca
`/api/advice` sunucu yolundan yapılır.

## 9. Veri sorumlusu bilgileri

Burs profili üretimde açılmadan önce:

```text
DATA_CONTROLLER_NAME=Gerçek kişi veya kurum adı
DATA_CONTROLLER_EMAIL=Geçerli başvuru e-posta adresi
```

Bu iki bilgi olmadan burs aydınlatma sayfası taslak uyarısı gösterir.

## 10. Yönetim paneli ve sunucu kimliği

Firebase Console > Project settings > Service accounts bölümünden yalnızca bu
proje için bir servis hesabı anahtarı oluştur. JSON dosyasını projeye kopyalama
ve Git'e ekleme. Değerleri `.env.local` ve Vercel gizli ortam değişkenlerine
ayrı ayrı yaz:

```text
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_EMAILS=yonetici@ornek.com
ANALYTICS_HASH_SALT=en-az-32-karakter-rastgele-bir-deger
```

`ADMIN_EMAILS` virgülle ayrılmış birden fazla adres alabilir. Bu listede olmayan
hesaplar Firebase ile giriş yapabilse bile yönetim API'lerinden veri alamaz.

Yönetim paneli `/admin` yolundadır. İlk canlı bağlantıdan sonra sistem
sekmesinde burs adayı toplamayı açabilirsin. Sunucu, veri sorumlusu bilgileri
eksikse bu işlemi reddeder.

## 11. Analitik ve bot azaltma

Analitik uç noktası ham IP saklamaz. Vercel'in yaklaşık şehir ve bölge
başlıklarını, cihaz sınıfını ve günlük HMAC oturum özetini saklar. Bilinen bot
user-agent değerleri ve Do Not Track tercihi ölçümden çıkarılır.

YKS puanı ve başarı sırası trafik analitiğine yazılmaz. Bu veriler yalnızca
anonim araştırma kaydına açıkça onay veren adayın `submissions` belgesinden,
`/api/research-aggregate` tarafından bir kez işlenir. Admin paneli 16
toplulaştırma shard'ını birleştirerek tam kayıt kümesinin ortalamasını gösterir.

App Check doğrulaması test edildikten sonra Vercel'de:

```text
REQUIRE_APP_CHECK=true
```

olarak ayarla. Firestore'da `analytics_sessions.expiresAt` ve
`analytics_events.expiresAt` alanları için TTL politikası açılması tavsiye
edilir.

## 12. Vercel ortam değişkenleri

`.env.local` içindeki tüm Firebase değerlerini, Gemini anahtarını ve veri
sorumlusu bilgilerini Vercel Project Settings > Environment Variables
bölümüne ekle.

`NEXT_PUBLIC_FIREBASE_USE_EMULATORS` üretimde tanımlanmamalı veya `false`
olmalıdır. Servis hesabı özel anahtarı, Gemini anahtarı, analitik tuzu ve
yönetici izin listesi hiçbir zaman `NEXT_PUBLIC_` ön eki almamalıdır.
