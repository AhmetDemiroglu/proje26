import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik ve Veri Kullanımı",
  description:
    "Tercihçe'nin anonim YKS sonucu verilerini nasıl kullandığını öğrenin.",
};

export default function PrivacyPage() {
  return (
    <main className="content-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} />
        Tercihçe’ye dön
      </Link>
      <span className="section-kicker">Açık ve sade</span>
      <h1>Gizlilik ve veri kullanımı</h1>
      <p>
        Tercihçe, üniversite adaylarına ücretsiz rehberlik etmek için tasarlandı.
        Kimlik belgesi, T.C. kimlik numarası, telefon, okul adı veya sonuç
        belgesi istemez. Ad ve e-posta yalnızca burs ağına katılmak isteyen
        kullanıcılar için opsiyoneldir.
      </p>

      <section className="content-card">
        <h2>Hangi veriler kaydedilebilir?</h2>
        <ul>
          <li>2026 YKS yerleştirme puanı ve başarı sırası</li>
          <li>Kullanıcı isterse sınav netleri</li>
          <li>Program düzeyi, üniversite türü ve burs gibi genel ilgi sinyalleri</li>
          <li>Kaydedilen programın kodu ve geniş başarı sırası aralığı</li>
        </ul>
        <p>
          Ad ve e-posta yalnızca burs ağına katılma seçeneği ayrıca
          işaretlendiğinde, özel erişimli burs profiline kaydedilir. İstatistik
          kayıtlarında ad ve e-posta tutulmaz.
        </p>
      </section>

      <section className="content-card">
        <h2>Ziyaret ve kullanım ölçümü</h2>
        <p>
          Sitenin kaç kez açıldığını, yaklaşık kaç tarayıcı oturumu oluştuğunu,
          analiz akışının tamamlanma oranını ve şehir bazında genel ilgiyi
          ölçeriz. Şehir bilgisi, barındırma sağlayıcısının isteğe eklediği
          yaklaşık şehir ve bölge bilgisinden alınır.
        </p>
        <p>
          Ham IP adresi, reklam kimliği veya cihaz parmak izi saklanmaz.
          Tarayıcı sekmesinde üretilen rastgele oturum değeri, sunucuda gizli
          anahtarla günlük olarak özetlenir. Do Not Track tercihi açık olan
          tarayıcılarda ürün analitiği gönderilmez. Bilinen bot imzaları
          sayımdan çıkarılır, ancak bu filtre kusursuz değildir. Trafik
          olaylarına YKS puanı veya başarı sırası eklenmez.
        </p>
      </section>

      <section className="content-card">
        <h2>Ne zaman kaydedilir?</h2>
        <p>
          Sonuçlar yalnızca analiz formundaki anonim araştırma seçeneğini
          kullanıcı işaretlediğinde kaydedilir. Bu seçenek işaretlenmeden
          öneri motoru çalışır ve sonuç sunucuya yazılmaz.
        </p>
        <p>
          Burs profili için ayrı bir aydınlatma metni gösterilir ve ayrı açık
          rıza alınır. E-posta doğrulanmadan burs profili aktif hale gelmez.
        </p>
      </section>

      <section className="content-card">
        <h2>Veri nerede işlenir?</h2>
        <p>
          Anonim araştırma kayıtları Firebase Cloud Firestore’da tutulur.
          İsteğe bağlı yapay zeka yorumu alındığında yalnızca seçilen puan
          türü, başarı sırası ve ekranda görülen sınırlı program listesi Gemini
          API’ye gönderilir. İsim ve netler yapay zeka isteğine eklenmez.
        </p>
      </section>

      <section className="content-card">
        <h2>Burs eşleştirmesinde paylaşım</h2>
        <p>
          Doğrulanmış destekçiler ilk aşamada kimliksiz aday özetlerini görür.
          Ad ve e-posta, öğrenci belirli bir eşleşmeyi ayrıca onaylamadan
          destekçilerle paylaşılmaz. 18 yaşından küçük adaylarda veli veya
          yasal temsilci katılımı tamamlanmadan doğrudan iletişim kurulmaz.
        </p>
      </section>

      <section className="content-card">
        <h2>Destekçi başvuruları</h2>
        <p>
          Destekçi olmak isteyen kişi veya kurumların ad, e-posta, kurum,
          destek türü ve açıklama bilgileri başvuruyu incelemek ve güvenlik
          doğrulaması yapmak için saklanır. Başvurular otomatik onaylanmaz ve
          yalnızca yetkili yönetici tarafından görüntülenir.
        </p>
      </section>

      <section className="content-card">
        <h2>Güvenlik ve sınırlamalar</h2>
        <p>
          Firestore istemci kuralları kayıtların ziyaretçiler tarafından
          okunmasını, değiştirilmesini ve silinmesini engeller. Firebase anonim
          oturum anahtarı yalnızca kötüye kullanımı azaltmak için cihazda
          tutulur. Barındırma ve altyapı sağlayıcıları hizmet güvenliği için
          sınırlı teknik günlükler işleyebilir. Yönetim paneli, doğrulanmış
          Firebase hesabı ve sunucu tarafındaki yönetici e-posta izin listesi
          ile korunur.
        </p>
      </section>

      <section className="content-card">
        <h2>Veri kaynağı ve sorumluluk</h2>
        <p>
          Programlar YÖK Atlas verilerinden derlenir. Tercihçe resmi bir kurum
          değildir ve yerleşme garantisi vermez. Nihai tercih öncesinde güncel
          ÖSYM kılavuzu ve üniversitenin kendi koşulları kontrol edilmelidir.
        </p>
        <p>
          <a
            href="https://www.kvkk.gov.tr/"
            target="_blank"
            rel="noreferrer"
          >
            Kişisel Verileri Koruma Kurumu
            <ExternalLink size={13} style={{ display: "inline", marginLeft: 5 }} />
          </a>
        </p>
      </section>
    </main>
  );
}
