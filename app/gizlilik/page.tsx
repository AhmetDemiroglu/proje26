import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileDown,
  LockKeyhole,
  MailCheck,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { ContentFooter, ContentHeader } from "@/components/content-chrome";

export const metadata: Metadata = {
  title: "Gizlilik ve Veri Kullanımı",
  description:
    "Tercihçe hangi verileri kaydeder, ne zaman kaydeder ve neyi asla toplamaz? Anonim YKS analizinin veri politikası, sade bir dille.",
};

const LAST_UPDATED = "27 Temmuz 2026";
const DOCUMENT_VERSION = "1.0";

const SECTIONS = [
  { id: "ozet", label: "Kısaca" },
  { id: "veriler", label: "Toplanan veriler" },
  { id: "onay", label: "Kayıt ne zaman oluşur?" },
  { id: "olcum", label: "Ziyaret ve kullanım ölçümü" },
  { id: "isleme", label: "Veri nerede işlenir?" },
  { id: "burs", label: "Burs eşleştirmesi" },
  { id: "destekci", label: "Destekçi başvuruları" },
  { id: "guvenlik", label: "Güvenlik ve sınırlar" },
  { id: "kaynak", label: "Veri kaynağı ve sorumluluk" },
  { id: "haklar", label: "Haklarınız ve iletişim" },
];

const SUMMARY = [
  {
    icon: UserRoundX,
    title: "Kimlik bilgisi istemiyoruz",
    body: "T.C. kimlik numarası, telefon, okul adı veya ÖSYM sonuç belgesi hiçbir aşamada sorulmaz.",
  },
  {
    icon: CheckCircle2,
    title: "Onay vermeden kayıt yok",
    body: "Analizin çalışması için hiçbir şey kaydedilmez. Kayıt yalnızca araştırma kutusunu işaretlersen oluşur.",
  },
  {
    icon: LockKeyhole,
    title: "Reklam takibi yok",
    body: "Ham IP adresi, reklam kimliği veya cihaz parmak izi saklanmaz.",
  },
  {
    icon: FileDown,
    title: "Ad ve e-posta opsiyonel",
    body: "Yalnızca burs ağına katılmayı ayrıca seçen kullanıcılardan istenir; istatistik kayıtlarında yer almaz.",
  },
];

const COLLECTED = [
  "2026 YKS yerleştirme puanı ve başarı sırası",
  "Kullanıcı isterse sınav netleri",
  "Program düzeyi, üniversite türü ve burs gibi genel ilgi sinyalleri",
  "Kaydedilen programın kodu ve geniş başarı sırası aralığı",
];

const NOT_COLLECTED = [
  "T.C. kimlik numarası veya kimlik belgesi",
  "Telefon numarası, adres veya okul adı",
  "ÖSYM sonuç belgesi ya da herhangi bir dosya yüklemesi",
  "Ham IP adresi, reklam kimliği veya cihaz parmak izi",
];

export default function PrivacyPage() {
  const controllerEmail = process.env.DATA_CONTROLLER_EMAIL;

  return (
    <>
      <ContentHeader current="/gizlilik" />

      <main className="page-main">
        <div className="page-hero-band">
          <div className="shell page-hero">
            <Link className="page-back" href="/">
              <ArrowLeft size={15} />
              Tercihçe’ye dön
            </Link>
            <span className="section-kicker">
              <ShieldCheck size={14} />
              Açık ve sade
            </span>
            <h1>Gizlilik ve veri kullanımı</h1>
            <p className="page-lede">
              Tercihçe, üniversite adaylarına ücretsiz rehberlik etmek için
              tasarlandı. Bu sayfa hangi verinin neden tutulduğunu, neyin hiç
              toplanmadığını ve kararın her aşamada nasıl sende kaldığını
              anlatır.
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
                <dd>Tercihçe web sitesi</dd>
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
            <section className="doc-section" id="ozet">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <Sparkles size={18} />
                </span>
                <div>
                  <span className="doc-section-index">01</span>
                  <h2>Kısaca</h2>
                </div>
              </header>
              <div className="doc-summary">
                {SUMMARY.map((item) => (
                  <div className="doc-summary-card" key={item.title}>
                    <item.icon size={19} aria-hidden="true" />
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="doc-section" id="veriler">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <ScrollText size={18} />
                </span>
                <div>
                  <span className="doc-section-index">02</span>
                  <h2>Toplanan veriler</h2>
                </div>
              </header>
              <p>
                Anonim araştırma kaydı oluştuğunda tutulan alanların tamamı
                aşağıdadır. Sağ sütun, hiçbir aşamada istemediğimiz bilgileri
                gösterir.
              </p>
              <div className="doc-compare">
                <div className="doc-compare-col is-yes">
                  <span className="doc-compare-title">Kaydedilebilenler</span>
                  <ul>
                    {COLLECTED.map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={15} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="doc-compare-col is-no">
                  <span className="doc-compare-title">
                    Hiç istemediklerimiz
                  </span>
                  <ul>
                    {NOT_COLLECTED.map((item) => (
                      <li key={item}>
                        <X size={15} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p>
                Ad ve e-posta yalnızca burs ağına katılma seçeneği ayrıca
                işaretlendiğinde, özel erişimli burs profiline kaydedilir.
                İstatistik kayıtlarında ad ve e-posta tutulmaz.
              </p>
            </section>

            <section className="doc-section" id="onay">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <span className="doc-section-index">03</span>
                  <h2>Kayıt ne zaman oluşur?</h2>
                </div>
              </header>
              <p>
                Sonuçlar yalnızca analiz formundaki anonim araştırma seçeneğini
                kullanıcı işaretlediğinde kaydedilir. Bu seçenek işaretlenmeden
                öneri motoru çalışır ve sonuç sunucuya yazılmaz.
              </p>
              <p>
                Burs profili için ayrı bir aydınlatma metni gösterilir ve ayrı
                açık rıza alınır. E-posta doğrulanmadan burs profili aktif hale
                gelmez.
              </p>
              <p className="doc-inline-link">
                <Link href="/burs-aydinlatma">
                  Burs ağı aydınlatma metnini oku
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </p>
            </section>

            <section className="doc-section" id="olcum">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <Search size={18} />
                </span>
                <div>
                  <span className="doc-section-index">04</span>
                  <h2>Ziyaret ve kullanım ölçümü</h2>
                </div>
              </header>
              <p>
                Sitenin kaç kez açıldığını, yaklaşık kaç tarayıcı oturumu
                oluştuğunu, analiz akışının tamamlanma oranını ve şehir bazında
                genel ilgiyi ölçeriz. Şehir bilgisi, barındırma sağlayıcısının
                isteğe eklediği yaklaşık şehir ve bölge bilgisinden alınır.
              </p>
              <p>
                Ham IP adresi, reklam kimliği veya cihaz parmak izi saklanmaz.
                Tarayıcı sekmesinde üretilen rastgele oturum değeri, sunucuda
                gizli anahtarla günlük olarak özetlenir. Do Not Track tercihi
                açık olan tarayıcılarda ürün analitiği gönderilmez. Trafik
                olaylarına YKS puanı veya başarı sırası eklenmez.
              </p>
              <p className="doc-note">
                Bilinen bot imzaları sayımdan çıkarılır, ancak bu filtre
                kusursuz değildir; ziyaret sayıları yaklaşık değerlerdir.
              </p>
            </section>

            <section className="doc-section" id="isleme">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <Settings size={18} />
                </span>
                <div>
                  <span className="doc-section-index">05</span>
                  <h2>Veri nerede işlenir?</h2>
                </div>
              </header>
              <p>
                Anonim araştırma kayıtları Firebase Cloud Firestore’da tutulur.
                İsteğe bağlı yapay zeka yorumu alındığında yalnızca seçilen puan
                türü, başarı sırası ve ekranda görülen sınırlı program listesi
                Gemini API’ye gönderilir. İsim ve netler yapay zeka isteğine
                eklenmez.
              </p>
            </section>

            <section className="doc-section" id="burs">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <Users size={18} />
                </span>
                <div>
                  <span className="doc-section-index">06</span>
                  <h2>Burs eşleştirmesinde paylaşım</h2>
                </div>
              </header>
              <p>
                Doğrulanmış destekçiler ilk aşamada kimliksiz aday özetlerini
                görür. Ad ve e-posta, öğrenci belirli bir eşleşmeyi ayrıca
                onaylamadan destekçilerle paylaşılmaz.
              </p>
              <p className="doc-note">
                18 yaşından küçük adaylarda veli veya yasal temsilci katılımı
                tamamlanmadan doğrudan iletişim kurulmaz.
              </p>
            </section>

            <section className="doc-section" id="destekci">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <MailCheck size={18} />
                </span>
                <div>
                  <span className="doc-section-index">07</span>
                  <h2>Destekçi başvuruları</h2>
                </div>
              </header>
              <p>
                Destekçi olmak isteyen kişi veya kurumların ad, e-posta, kurum,
                destek türü ve açıklama bilgileri başvuruyu incelemek ve
                güvenlik doğrulaması yapmak için saklanır. Başvurular otomatik
                onaylanmaz ve yalnızca yetkili yönetici tarafından görüntülenir.
              </p>
            </section>

            <section className="doc-section" id="guvenlik">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <LockKeyhole size={18} />
                </span>
                <div>
                  <span className="doc-section-index">08</span>
                  <h2>Güvenlik ve sınırlar</h2>
                </div>
              </header>
              <p>
                Firestore istemci kuralları kayıtların ziyaretçiler tarafından
                okunmasını, değiştirilmesini ve silinmesini engeller. Firebase
                anonim oturum anahtarı yalnızca kötüye kullanımı azaltmak için
                cihazda tutulur. Yönetim paneli, doğrulanmış Firebase hesabı ve
                sunucu tarafındaki yönetici e-posta izin listesi ile korunur.
              </p>
              <p className="doc-note">
                Barındırma ve altyapı sağlayıcıları hizmet güvenliği için
                sınırlı teknik günlükler işleyebilir.
              </p>
            </section>

            <section className="doc-section" id="kaynak">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <Target size={18} />
                </span>
                <div>
                  <span className="doc-section-index">09</span>
                  <h2>Veri kaynağı ve sorumluluk</h2>
                </div>
              </header>
              <p>
                Programlar YÖK Atlas verilerinden derlenir. Tercihçe resmi bir
                kurum değildir ve yerleşme garantisi vermez. Nihai tercih
                öncesinde güncel ÖSYM kılavuzu ve üniversitenin kendi koşulları
                kontrol edilmelidir.
              </p>
            </section>

            <section className="doc-section doc-contact" id="haklar">
              <header className="doc-section-head">
                <span className="doc-section-icon" aria-hidden="true">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <span className="doc-section-index">10</span>
                  <h2>Haklarınız ve iletişim</h2>
                </div>
              </header>
              <p>
                Burs profili veya destekçi başvurusu oluşturduysan; verinin
                işlenip işlenmediğini öğrenme, içeriği hakkında bilgi isteme,
                düzeltme veya silinmesini talep etme ve açık rızanı geri çekme
                hakkın vardır. Anonim araştırma kaydında ad, e-posta veya kimlik
                bilgisi bulunmaz.
              </p>
              <div className="doc-contact-actions">
                {controllerEmail ? (
                  <a
                    className="doc-primary"
                    href={`mailto:${controllerEmail}`}
                  >
                    {controllerEmail}
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="doc-primary is-muted">
                    İletişim adresi yayına alınmadan önce eklenecek
                  </span>
                )}
                <a
                  className="doc-ghost"
                  href="https://www.kvkk.gov.tr/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Kişisel Verileri Koruma Kurumu
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
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
