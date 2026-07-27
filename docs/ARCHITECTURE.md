# Tercihçe mimarisi

## Temel karar

Program kataloğu Firestore'da tutulmaz. Güncel YÖK Atlas verisi puan türüne göre
parçalanmış statik JSON dosyaları olarak sunulur. Bunun üç avantajı vardır:

- Firebase okuma kotası tüketilmez.
- Adayın filtreleme işlemi cihazında hızlı çalışır.
- Resmi veri paketi sürümlenebilir ve tekrar üretilebilir.

Firebase yalnızca kullanıcı tarafından üretilen kayıtlar için kullanılır.

## Akış

```text
YÖK Atlas API
    |
    v
data:sync betiği
    |
    v
Puan türüne ayrılmış statik JSON
    |
    v
Tarayıcıdaki eşleştirme motoru
    |
    +--> Kimliksiz analiz sonucu
    |
    +--> Kullanıcı onayı varsa Firestore submissions
              |
              +--> /api/research-aggregate
                      |
                      +--> 16 parçalı kesin puan ve tercih istatistiği
    |
    +--> Ayrı açık rıza varsa scholarship_profiles
    |
    +--> Kullanıcı isterse /api/advice üzerinden Gemini
    |
    +--> Kimliksiz ürün olayları /api/analytics
              |
              +--> günlük toplamlar ve HMAC oturum özeti

Firebase Google Auth + ADMIN_EMAILS
    |
    v
/admin ve /api/admin/*
    |
    +--> sonuç, burs adayı ve destekçi incelemesi
    +--> CSV dışa aktarma
    +--> burs başvuru sistemini açma veya kapatma
```

## Güvenlik sınırları

- Firebase istemci anahtarları tarayıcıda kullanılabilir, fakat Firestore erişimi
  güvenlik kurallarıyla sınırlandırılır.
- Gemini anahtarı yalnızca sunucu ortam değişkenidir.
- `submissions`, `interest_events` ve `scholarship_profiles` koleksiyonları
  ziyaretçiler tarafından okunamaz.
- Anonim Firebase oturumu yetkilendirme amacıyla kullanılır. İstatistik
  belgesine kullanıcı UID'si yazılmaz.
- Burs profilinin belge kimliği Firebase UID'sidir. Bu koleksiyon genel
  istatistik koleksiyonundan ayrıdır.
- Burs profilinin aktifleşmesi e-posta bağlantısının doğrulanmasına bağlıdır.
- Firestore, `system_config/scholarship.enabled` kapalıyken burs profili
  oluşturmayı güvenlik kuralı düzeyinde reddeder.
- Yönetim API'leri Firebase ID token doğrulaması ve sunucudaki `ADMIN_EMAILS`
  izin listesini birlikte uygular.
- Firebase Admin servis hesabı yalnızca sunucu ortamındadır. Özel anahtar
  istemci paketine girmez.
- Analitik ham IP saklamaz. Rastgele sekme oturumu günlük HMAC özetiyle
  takma adlı hale getirilir.

## Eşleştirme motoru

2026 aday sırası, programın 2025 taban sırasına bölünür:

```text
oran = aday sırası / programın 2025 taban sırası
```

Kullanılan bantlar:

- `<= 0,76`: güçlü
- `<= 0,98`: dengeli
- `<= 1,12`: sınırda
- `<= 1,35`: iddialı

Bu sınıflar yerleşme olasılığı değildir. Yalnızca tercih listesi araştırmasına
başlamak için temkinli aralıklardır.

## Dağıtım

Vercel `vercel.json` içindeki `npm run build:vercel` komutunu kullanır.
Firestore kuralları Firebase CLI ile ayrıca dağıtılır. Gemini ve veri sorumlusu
değerleri Vercel ortam değişkenlerinde tutulur. Yönetim ve analitik sunucu
katmanı Firebase Admin SDK kullandığı için Node.js çalışma zamanı gerektirir.
