# Burs ağı ürün planı

## Amaç

Başarı sırası ve eğitim hedefi uygun öğrenciyle, doğrulanmış burs veren kişi veya
kurumu güvenli biçimde eşleştirmek.

## Neden açık öğrenci listesi yok?

Ad, e-posta ve tam sınav sonucunu herkese açık göstermek dolandırıcılık,
istenmeyen iletişim, ayrımcılık ve 18 yaş altı adaylar için güvenlik riski
oluşturur. Bu nedenle iki aşamalı eşleşme modeli kullanılır.

## Aşama 1: aday profili

- Öğrenci analizini tamamlar.
- Burs ağı aydınlatma metnini görür.
- Ayrı açık rıza verir.
- E-posta adresini doğrular.
- Profil `active` olur.

## Aşama 2: destekçi doğrulama

Destekçi başvurusu aşağıdaki kontrollerden geçer:

- Gerçek kişi veya kurum kimliği
- İletişim adresi
- Burs bütçesi ve süresi
- Öğrenciden istenecek koşullar
- Reklam, satış, siyasi veya dini baskı amacı bulunmadığı beyanı
- Davranış ve iletişim kurallarının kabulü

Doğrulanmayan destekçi aday havuzuna erişemez.

## Aşama 3: kimliksiz keşif

Doğrulanmış destekçi yalnızca aşağıdaki gibi sınırlı kartları görür:

- Puan türü
- Geniş başarı sırası bandı
- Lisans veya önlisans hedefi
- Geniş program ilgi alanı
- Tercih edilen şehir sayısı veya bölge
- Eşleşme durumu

Ad, e-posta ve tam sınav sonucu gösterilmez.

## Aşama 4: çift onaylı eşleşme

1. Destekçi bir kimliksiz karta burs talebi gönderir.
2. Tercihçe talebi inceler.
3. Öğrenciye destekçinin kimliği, burs miktarı, süresi ve koşulları gösterilir.
4. Öğrenci bu belirli eşleşmeye ayrıca onay verir.
5. 18 yaş altı adayda veli veya yasal temsilci sürece dahil edilir.
6. Yalnızca bu onaydan sonra gerekli iletişim bilgisi paylaşılır.

## Gelir modeli sınırı

Öğrenciden başvuru veya eşleşme ücreti alınmamalıdır. İleride gelir modeli
düşünülürse, destekçi kurumlara doğrulama, raporlama veya yönetim hizmeti
sunulabilir. Öğrenci verisi satılamaz ve reklam listesi olarak kullanılamaz.

## Mevcut temel kapsam

Bu projede aday profili, ayrı rıza, e-posta doğrulama, kapalı Firestore
koleksiyonu, destekçi başvuru formu ve yalnızca izinli hesaba açık yönetici
inceleme paneli hazırdır. Destekçilerin aday kartlarını göreceği ayrı portal;
rol bazlı erişim, ayrıntılı erişim günlüğü ve çift onaylı iletişim paylaşımı
tamamlandıktan sonra açılmalıdır.
