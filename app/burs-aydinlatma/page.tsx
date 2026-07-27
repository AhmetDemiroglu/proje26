import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowLeft,
  MailCheck,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundX,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ContentFooter, ContentHeader } from "@/components/content-chrome";

export const metadata: Metadata = {
  title: "Burs Ağı Aydınlatma Metni",
  description:
    "Tercihçe burs eşleştirme ağı kişisel veri işleme aydınlatma metni.",
};

const LAST_UPDATED = "27 Temmuz 2026";
const DOCUMENT_VERSION = "1.0";

const SECTIONS = [
  { id: "sorumlu", label: "Veri sorumlusu" },
  { id: "veriler", label: "İşlenen veriler" },
  { id: "amac", label: "Amaç ve hukuki sebep" },
  { id: "aktarim", label: "Aktarım" },
  { id: "saklama", label: "Toplama ve saklama" },
  { id: "yas", label: "18 yaşından küçükler" },
  { id: "haklar", label: "Haklar ve başvuru" },
];

const PROCESSED = [
  "Girildiğinde ad veya hitap bilgisi",
  "E-posta adresi ve e-posta doğrulama durumu",
  "2026 YKS yerleştirme puanı, başarı sırası ve girilen netler",
  "Şehir, program, üniversite türü ve burs tercihleri",
  "18 yaş altı veya 18 yaş ve üzeri olma bilgisi",
  "Açık rıza metni sürümü, tarih ve profil durumu",
];

export default function ScholarshipNoticePage() {
  const controllerName =
    process.env.DATA_CONTROLLER_NAME || "Tercihçe proje yürütücüsü";
  const controllerEmail = process.env.DATA_CONTROLLER_EMAIL;
  const isDraft =
    !process.env.DATA_CONTROLLER_NAME || !process.env.DATA_CONTROLLER_EMAIL;

  return (
    <>
      <ContentHeader />

      <main className="page-main">
        <div className="page-hero-band">
          <div className="shell page-hero">
            <Link className="page-back" href="/">
              <ArrowLeft size={15} />
              Tercihçe’ye dön
            </Link>
            <span className="section-kicker">
              <ShieldCheck size={14} />
              Burs ağı
            </span>
            <h1>Kişisel veri işleme aydınlatma metni</h1>
            <p className="page-lede">
              Bu metin, burs eşleştirme profili oluşturmayı seçen adayların hangi
              verilerinin, hangi amaçla ve nasıl işlendiğini açıklar. Aydınlatma
              ile açık rıza birbirinden ayrı süreçlerdir.
            </p>
            <dl className="page-meta">
              <div>
                <dt>Son güncelleme</dt>
                <dd>{LAST_UPDATED}</dd>
              </div>
              <div>
                <dt>Sürüm</dt>
                <dd>{DOCUMENT_VERSION}</dd>
              </div>
              <div>
                <dt>Kapsam</dt>
                <dd>Burs eşleştirme profili</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="shell doc-layout">
          <aside className="doc-toc" aria-label="Sayfa içeriği">
            <span className="doc-toc-title">Bu sayfada</span>
            <ol>
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className="doc-body">
            {isDraft && (
              <section className="doc-section draft-warning">
                <header className="doc-section-head">
                  <span className="doc-section-icon" aria-hidden="true">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <span className="doc-section-index">TASLAK</span>
                    <h2>Yerel geliştirme taslağı</h2>
                  </div>
                </header>
                <p>
                  Veri sorumlusunun gerçek kimliği ve iletişim adresi yayına
                  alınmadan önce doldurulmalıdır. Bu bilgiler tamamlanmadan burs
                  profili toplama özelliği üretimde açılmamalıdır.
                </p>
              </section>
            )}

            <section className="doc-section" id="sorumlu">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <span className="doc-section-index">01</span>
                  <h2>Veri sorumlusu</h2>
                </div>
              </header>
              <p>
                Veri sorumlusu: <strong>{controllerName}</strong>
                <br />
                İletişim:{" "}
                <strong>
                  {controllerEmail || "Yayına alınmadan önce eklenecek"}
                </strong>
              </p>
            </section>

            <section className="doc-section" id="veriler">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <ScrollText size={18} />
                </span>
                <div>
                  <span className="doc-section-index">02</span>
                  <h2>İşlenen veriler</h2>
                </div>
              </header>
              <ul>
                {PROCESSED.map((item) => (
                  <li key={item}>
                    <Sparkles size={14} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="doc-section" id="amac">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <Target size={18} />
                </span>
                <div>
                  <span className="doc-section-index">03</span>
                  <h2>İşleme amacı ve hukuki sebep</h2>
                </div>
              </header>
              <p>
                Veriler, adayın burs eşleştirme ağına katılmasını sağlamak,
                uygun burs fırsatları hakkında e-posta göndermek, aday ile
                doğrulanmış destekçi arasında güvenli bir eşleşme süreci
                yürütmek ve kötüye kullanımı önlemek amacıyla işlenir.
              </p>
              <p className="doc-note">
                Bu işlem, adayın burs formunda verdiği açık rızaya dayanır. Açık
                rıza verilmemesi tercih analizini engellemez.
              </p>
            </section>

            <section className="doc-section" id="aktarim">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <Users size={18} />
                </span>
                <div>
                  <span className="doc-section-index">04</span>
                  <h2>Kimlere ve ne zaman aktarılabilir?</h2>
                </div>
              </header>
              <p>
                Doğrulanmış burs verenler ilk aşamada yalnızca kimliksiz aday
                özetlerini görür. Ad ve e-posta, yalnızca aday belirli bir
                eşleşmeye ayrıca onay verdiğinde ilgili doğrulanmış destekçiyle
                paylaşılır. Veri barındırma ve e-posta doğrulama için kullanılan
                Firebase gibi teknik hizmet sağlayıcılar altyapı kapsamında veri
                işleyebilir.
              </p>
            </section>

            <section className="doc-section" id="saklama">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <MailCheck size={18} />
                </span>
                <div>
                  <span className="doc-section-index">05</span>
                  <h2>Toplama yöntemi ve saklama süresi</h2>
                </div>
              </header>
              <p>
                Veriler internet sitesindeki burs formundan elektronik olarak
                toplanır. Profil, açık rıza geri çekilene veya eşleştirme amacı
                sona erene kadar, her durumda en fazla 24 ay tutulur. Süre
                sonunda silinir veya geri döndürülemeyecek biçimde anonim hale
                getirilir.
              </p>
            </section>

            <section className="doc-section" id="yas">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <UserRoundX size={18} />
                </span>
                <div>
                  <span className="doc-section-index">06</span>
                  <h2>18 yaşından küçük adaylar</h2>
                </div>
              </header>
              <p>
                18 yaşından küçük adayların iletişim bilgileri destekçilerle
                doğrudan paylaşılmaz. Eşleşme aşamasında veli veya yasal
                temsilci katılımı tamamlanmadan iletişim kurulmaz.
              </p>
            </section>

            <section className="doc-section doc-contact" id="haklar">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <span className="doc-section-index">07</span>
                  <h2>Haklar ve başvuru</h2>
                </div>
              </header>
              <p>
                Adaylar, kendileriyle ilgili veri işlenip işlenmediğini öğrenme,
                işlenen veriler hakkında bilgi isteme, düzeltme veya silme talep
                etme, açık rızayı geri çekme ve kanuni diğer haklarını veri
                sorumlusu iletişim adresi üzerinden kullanabilir.
              </p>
              <div className="doc-contact-actions">
                {controllerEmail ? (
                  <a className="doc-primary" href={`mailto:${controllerEmail}`}>
                    {controllerEmail}
                  </a>
                ) : (
                  <span className="doc-primary is-muted">
                    İletişim adresi yayına alınmadan önce eklenecek
                  </span>
                )}
                <Link className="doc-ghost" href="/gizlilik">
                  Gizlilik ve veri kullanımı
                </Link>
              </div>
            </section>

            <p className="doc-footnote">
              Bu metin sürüm {DOCUMENT_VERSION} olarak {LAST_UPDATED} tarihinde
              güncellendi. Kapsamı etkileyen bir değişiklik olduğunda tarih ve
              sürüm burada yenilenir.
            </p>
          </div>
        </div>
      </main>

      <ContentFooter />
    </>
  );
}
