"use client";

import {
  ArrowLeft,
  Check,
  HeartHandshake,
  LoaderCircle,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ContentFooter, ContentHeader } from "@/components/content-chrome";
import { trackEvent } from "@/lib/analytics-client";

const SUPPORT_TYPES = [
  ["monthly", "Düzenli burs"],
  ["one_time", "Tek seferlik destek"],
  ["technology", "Bilgisayar veya eğitim ekipmanı"],
  ["mentorship", "Mentorluk"],
] as const;

export function DonorApplicationForm() {
  const [donorType, setDonorType] = useState<"individual" | "organization">(
    "individual",
  );
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [supportTypes, setSupportTypes] = useState<string[]>([]);
  const [estimatedStudents, setEstimatedStudents] = useState(1);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  function toggleSupport(value: string) {
    setSupportTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Adını veya yetkili kişi adını gir.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }
    if (donorType === "organization" && organizationName.trim().length < 2) {
      setError("Kurum adını gir.");
      return;
    }
    if (!supportTypes.length) {
      setError("En az bir destek türü seç.");
      return;
    }
    if (!consent) {
      setError("Başvuru incelemesi için bilgilendirme onayını işaretle.");
      return;
    }

    setStatus("loading");
    try {
      const { isFirebaseConfigured, submitDonorApplication } = await import(
        "@/lib/firebase/client"
      );
      if (!isFirebaseConfigured()) {
        throw new Error("Firebase bağlantısı henüz etkin değil.");
      }
      await submitDonorApplication({
        donorType,
        name,
        organizationName,
        email,
        supportTypes,
        estimatedStudents,
        note,
      });
      void trackEvent("donor_application");
      setStatus("success");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Başvuru şu anda gönderilemedi.",
      );
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <>
        <ContentHeader current="/destekci-basvuru" />
        <main className="page-main">
          <div className="page-hero-band">
            <div className="shell page-hero is-centered">
              <span className="section-kicker">Başvuru alındı</span>
              <h1>Teşekkür ederiz.</h1>
              <p className="page-lede">
                Başvurun yönetim panelindeki inceleme kuyruğuna eklendi. Kimlik
                ve destek koşulları doğrulandıktan sonra e-posta ile iletişime
                geçeceğiz.
              </p>
            </div>
          </div>
          <div className="shell page-body">
            <section className="page-card is-narrow is-success">
              <span className="page-card-icon">
                <Check size={28} />
              </span>
              <h1>Sırada ne var?</h1>
              <p>
                İnceleme sonucunu e-posta ile paylaşacağız. Bu süreçte
                öğrencilerin iletişim bilgileri paylaşılmaz; eşleşme yalnızca
                öğrencinin ayrıca onayıyla başlar.
              </p>
              <Link className="primary-button" href="/">
                Tercihçe’ye dön
              </Link>
            </section>
          </div>
        </main>
        <ContentFooter />
      </>
    );
  }

  return (
    <>
      <ContentHeader current="/destekci-basvuru" />
      <main className="page-main">
        <div className="page-hero-band">
          <div className="shell page-hero">
            <Link className="page-back" href="/">
              <ArrowLeft size={15} />
              Tercihçe’ye dön
            </Link>
            <span className="scholarship-icon">
              <HeartHandshake size={22} />
            </span>
            <span className="section-kicker">Burs ağı</span>
            <h1>Bir öğrencinin yoluna destek ol.</h1>
            <p className="page-lede">
              Bireysel veya kurumsal destekçi başvuruları önce doğrulanır.
              Öğrenci iletişim bilgileri, öğrencinin belirli eşleşmeye ayrıca
              onayı olmadan paylaşılmaz.
            </p>
            <div className="page-chips">
              <span>
                <ShieldCheck size={15} />
                Her başvuru elle doğrulanır
              </span>
              <span>
                <UserRoundX size={15} />
                Öğrenci onayı olmadan iletişim yok
              </span>
              <span>
                <HeartHandshake size={15} />
                Öğrenciden ücret alınmaz
              </span>
            </div>
          </div>
        </div>

        <div className="shell page-body">
          <form className="page-card donor-form" onSubmit={submit}>
            <div className="donor-form-intro">
              <h2>Başvuru formu</h2>
              <p>
                Aşağıdaki bilgiler yalnızca başvuru incelemesi ve seninle
                iletişim için kullanılır.
              </p>
            </div>

            <fieldset>
              <legend>Başvuru türü</legend>
              <div className="age-options">
                <button
                  type="button"
                  className={donorType === "individual" ? "active" : ""}
                  onClick={() => setDonorType("individual")}
                >
                  Bireysel destekçi
                </button>
                <button
                  type="button"
                  className={donorType === "organization" ? "active" : ""}
                  onClick={() => setDonorType("organization")}
                >
                  Kurum veya şirket
                </button>
              </div>
            </fieldset>

            <div className="identity-grid">
              <label className="field">
                <span>Ad soyad veya yetkili kişi</span>
                <input
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="field">
                <span>E-posta</span>
                <input
                  type="email"
                  value={email}
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            {donorType === "organization" && (
              <label className="field">
                <span>Kurum veya şirket adı</span>
                <input
                  value={organizationName}
                  maxLength={160}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  autoComplete="organization"
                  required
                />
              </label>
            )}

            <fieldset>
              <legend>Sunmayı düşündüğün destek</legend>
              <div className="donor-support-grid">
                {SUPPORT_TYPES.map(([value, label]) => {
                  const selected = supportTypes.includes(value);
                  return (
                    <button
                      type="button"
                      key={value}
                      className={selected ? "selected" : ""}
                      aria-pressed={selected}
                      onClick={() => toggleSupport(value)}
                    >
                      <span className="custom-checkbox">
                        {selected && <Check size={14} />}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="field">
              <span>Yaklaşık kaç öğrenci?</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={estimatedStudents}
                onChange={(event) =>
                  setEstimatedStudents(Number(event.target.value))
                }
              />
            </label>

            <label className="field">
              <span>
                Ek not <small>Opsiyonel</small>
              </span>
              <textarea
                value={note}
                maxLength={1000}
                rows={5}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Destek koşulları, süre veya hedeflediğin öğrenci profili"
              />
            </label>

            <label className="consent-card">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span className="custom-checkbox">{consent && <Check size={15} />}</span>
              <span>
                <strong>Başvuru incelemesini kabul ediyorum</strong>
                <small>
                  Başvuru bilgilerimin destekçi doğrulaması, güvenlik incelemesi ve
                  benimle iletişim kurulması amacıyla işlenmesini kabul ediyorum.
                </small>
              </span>
            </label>

            <div className="notice-box">
              <ShieldCheck size={18} />
              <p>
                Başvurunun alınması otomatik onay anlamına gelmez. Tercihçe,
                öğrencilerden ücret talep eden veya doğrulanamayan başvuruları
                reddeder.
              </p>
            </div>

            {error && <p className="form-error">{error}</p>}
            <button
              className="primary-button"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Gönderiliyor
                </>
              ) : (
                "İncelemeye gönder"
              )}
            </button>
          </form>
        </div>
      </main>
      <ContentFooter />
    </>
  );
}

