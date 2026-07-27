import type { Metadata } from "next";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Burs Ağı Aydınlatma Metni",
  description:
    "Tercihçe burs eşleştirme ağı kişisel veri işleme aydınlatma metni.",
};

export default function ScholarshipNoticePage() {
  const controllerName =
    process.env.DATA_CONTROLLER_NAME || "Tercihçe proje yürütücüsü";
  const controllerEmail =
    process.env.DATA_CONTROLLER_EMAIL || "Yayına alınmadan önce eklenecek";
  const isDraft =
    !process.env.DATA_CONTROLLER_NAME || !process.env.DATA_CONTROLLER_EMAIL;

  return (
    <main className="content-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} />
        Tercihçe’ye dön
      </Link>
      <span className="section-kicker">Burs ağı</span>
      <h1>Kişisel veri işleme aydınlatma metni</h1>
      <p>
        Bu metin, burs eşleştirme profili oluşturmayı seçen adayların hangi
        verilerinin, hangi amaçla ve nasıl işlendiğini açıklar. Aydınlatma ile
        açık rıza birbirinden ayrı süreçlerdir.
      </p>

      {isDraft && (
        <section className="content-card draft-warning">
          <AlertTriangle size={20} />
          <div>
            <h2>Yerel geliştirme taslağı</h2>
            <p>
              Veri sorumlusunun gerçek kimliği ve iletişim adresi yayına
              alınmadan önce doldurulmalıdır. Bu bilgiler tamamlanmadan burs
              profili toplama özelliği üretimde açılmamalıdır.
            </p>
          </div>
        </section>
      )}

      <section className="content-card">
        <h2>1. Veri sorumlusu</h2>
        <p>
          Veri sorumlusu: <strong>{controllerName}</strong>
          <br />
          İletişim: <strong>{controllerEmail}</strong>
        </p>
      </section>

      <section className="content-card">
        <h2>2. İşlenen veriler</h2>
        <ul>
          <li>Girildiğinde ad veya hitap bilgisi</li>
          <li>E-posta adresi ve e-posta doğrulama durumu</li>
          <li>2026 YKS yerleştirme puanı, başarı sırası ve girilen netler</li>
          <li>Şehir, program, üniversite türü ve burs tercihleri</li>
          <li>18 yaş altı veya 18 yaş ve üzeri olma bilgisi</li>
          <li>Açık rıza metni sürümü, tarih ve profil durumu</li>
        </ul>
      </section>

      <section className="content-card">
        <h2>3. İşleme amacı ve hukuki sebep</h2>
        <p>
          Veriler, adayın burs eşleştirme ağına katılmasını sağlamak, uygun burs
          fırsatları hakkında e-posta göndermek, aday ile doğrulanmış destekçi
          arasında güvenli bir eşleşme süreci yürütmek ve kötüye kullanımı
          önlemek amacıyla işlenir. Bu işlem, adayın burs formunda verdiği açık
          rızaya dayanır. Açık rıza verilmemesi tercih analizini engellemez.
        </p>
      </section>

      <section className="content-card">
        <h2>4. Kimlere ve ne zaman aktarılabilir?</h2>
        <p>
          Doğrulanmış burs verenler ilk aşamada yalnızca kimliksiz aday
          özetlerini görür. Ad ve e-posta, yalnızca aday belirli bir eşleşmeye
          ayrıca onay verdiğinde ilgili doğrulanmış destekçiyle paylaşılır. Veri
          barındırma ve e-posta doğrulama için kullanılan Firebase gibi teknik
          hizmet sağlayıcılar altyapı kapsamında veri işleyebilir.
        </p>
      </section>

      <section className="content-card">
        <h2>5. Toplama yöntemi ve saklama süresi</h2>
        <p>
          Veriler internet sitesindeki burs formundan elektronik olarak
          toplanır. Profil, açık rıza geri çekilene veya eşleştirme amacı sona
          erene kadar, her durumda en fazla 24 ay tutulur. Süre sonunda silinir
          veya geri döndürülemeyecek biçimde anonim hale getirilir.
        </p>
      </section>

      <section className="content-card">
        <h2>6. 18 yaşından küçük adaylar</h2>
        <p>
          18 yaşından küçük adayların iletişim bilgileri destekçilerle doğrudan
          paylaşılmaz. Eşleşme aşamasında veli veya yasal temsilci katılımı
          tamamlanmadan iletişim kurulmaz.
        </p>
      </section>

      <section className="content-card">
        <h2>7. Haklar ve başvuru</h2>
        <p>
          Adaylar, kendileriyle ilgili veri işlenip işlenmediğini öğrenme,
          işlenen veriler hakkında bilgi isteme, düzeltme veya silme talep etme,
          açık rızayı geri çekme ve kanuni diğer haklarını veri sorumlusu
          iletişim adresi üzerinden kullanabilir.
        </p>
      </section>
    </main>
  );
}
