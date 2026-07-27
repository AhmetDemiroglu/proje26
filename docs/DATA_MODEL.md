# Veri modeli

## `submissions`

Kimliksiz istatistik kaydıdır. Ayrı bir onay kutusuna bağlı değildir; aday puan
ve sırasını girip ikinci adıma geçtiğinde oluşur ve ilerledikçe aynı belge
güncellenir. Böylece yarıda bırakılan analizler de kayıtta kalır. İstemci
oluşturabilir ve yalnızca kendi belgesini güncelleyebilir, okuyamaz.

```text
schemaVersion: 2
examYear: 2026
stage: "scores" | "preferences" | "analyzed"
scoreTypes: ["SAY"]
scores:
  SAY:
    rank: 42680
    placementScore: 412.482
nets: opsiyonel test netleri
interest:                      # toplulaştırma için sinyaller
  degree: "lisans"
  universityTypes: ["DEVLET"]
  funding: "all"
  cityCount: 2
  hasProgramQuery: true
preferences:                   # adayın girdiği tercihlerin tamamı
  degree: "lisans"
  cities: ["Ankara", "İzmir"]
  universityTypes: ["DEVLET"]
  funding: "all"
  programQuery: "bilgisayar" veya null
resultCount: 3901
sessionUid: anonim oturum kimliği (güncelleme yetkisi için)
noticeVersion: "2026-1"
source: "web"
createdAt: server timestamp
updatedAt: güncelleme sonrası server timestamp
```

Ad, e-posta, kimlik numarası, IP ve sonuç belgesi bu koleksiyonda bulunmaz.
`sessionUid` yalnızca adayın kendi kaydını güncelleyebilmesi için tutulur;
anonim Firebase oturumuna aittir ve kişiye bağlanamaz.

## `interest_events`

Kullanıcı onayı varken bir program listeye eklendiğinde oluşur.

```text
programCode: 123456789
scoreType: "SAY"
rankBand: "25K-50K"
matchBand: "dengeli"
examYear: 2026
createdAt: server timestamp
```

Tam sıra yerine geniş sıra bandı kullanılır.

## `scholarship_profiles`

Özel erişimli kişisel burs profilidir. Belge kimliği Firebase UID'sidir. İstemci
profili oluşturabilir, fakat okuyamaz. Yalnızca doğrulanmış e-posta bağlantısı
profil durumunu `active` yapabilir.

```text
name: "Deniz" veya null
email: "deniz@example.com"
ageGroup: "adult" | "minor"
scores: yerleştirme puanları ve sıralar
preferences:
  degree
  cities
  universityTypes
  funding
  programQuery
submissionId: kimliksiz araştırma kaydı referansı veya null
status: "pending_email_verification" | "active"
contactShareMode: "student_approval_required"
consentVersion: "scholarship-2026-1"
noticeVersion: "scholarship-2026-1"
createdAt: server timestamp
verifiedAt: doğrulama sonrası server timestamp
```

`system_config/scholarship.enabled` değeri `true` değilse Firestore güvenlik
kuralı bu koleksiyona yeni kayıt yazılmasını reddeder.

## `donor_applications`

Bireysel veya kurumsal destekçi başvurusudur. İstemci yalnızca oluşturabilir,
okuyamaz veya durum değiştiremez.

```text
donorType: "individual" | "organization"
name: başvuran veya yetkili kişi
organizationName: kurum adı veya null
email: iletişim e-postası
supportTypes: ["monthly", "technology"]
estimatedStudents: 1..1000
note: opsiyonel açıklama
status: "pending_review" | "approved" | "rejected" | "paused"
consentVersion: "donor-2026-1"
createdAt: server timestamp
reviewedAt: yönetici incelemesi sonrası timestamp
reviewedBy: yönetici e-postası
```

## `analytics_daily`

Sunucu tarafında gün bazında tutulan toplu ürün ölçümüdür.

```text
day: "2026-07-24"
pageViews: sayı
uniqueSessions: yaklaşık günlük tekil sekme oturumu
analyzerStarts: sayı
analyzerCompletions: sayı
scholarshipOptins: sayı
donorApplications: sayı
cities: şehir bazında olay sayıları
devices: mobile | tablet | desktop sayıları
```

`analytics_sessions` yalnızca günlük HMAC oturum özeti, yaklaşık şehir ve
silinme tarihi tutar. `analytics_events`, sayfa görüntüleme dışındaki önemli
ürün olaylarını sınırlı süreyle saklar. Ham IP, reklam kimliği ve cihaz parmak
izi tutulmaz.

## `research_aggregate_shards`

Açık rızalı araştırma kayıtlarının tüm zamanlar istatistiğini 16 parçaya
dağıtarak tutar. Her `submissions` belgesi sunucu tarafından yalnızca bir kez
işlenir ve belgeye `aggregatedAt` işareti eklenir. Böylece yinelenen istekler
ortalamaları iki kez artırmaz.

Shard belgelerinde kayıt sayısı, puan türü başına sıra ve puan toplamı,
sıralama dilimleri ile genel tercih sayaçları bulunur. Admin paneli 16 küçük
belgeyi birleştirerek tüm kayıtların kesin ortalamasını üretir. İstemci bu
koleksiyonu okuyamaz veya yazamaz.

## `admin_audit_logs`

Destekçi durum değişiklikleri ve burs sistemi açma veya kapatma gibi kritik
yönetici işlemlerinin değiştirilemez işlem günlüğüdür. İşlem türü, hedef belge,
önceki ve sonraki durum, doğrulanmış yönetici hesabı ve sunucu zamanı tutulur.
İstemci doğrudan okuyamaz veya yazamaz; yalnızca yönetici API katmanı erişir.

## Gelecek burs ağı koleksiyonları

Bu koleksiyonlar ilk sürümde istemciye açılmaz:

- `sponsors`: doğrulanmış kişi veya kurum kayıtları
- `opportunities`: burs koşulları ve bütçeleri
- `match_requests`: destekçinin kimliksiz aday kartına eşleşme talebi
- `contact_disclosures`: öğrencinin belirli eşleşmeye ikinci onayı
- `consent_events`: rıza verme ve geri çekme geçmişi

Bu koleksiyonlar için mevcut yönetici sunucu katmanına ayrıca işlem günlüğü,
çift onay ve rol bazlı destekçi erişimi eklenmeden istemci erişimi
açılmamalıdır.
