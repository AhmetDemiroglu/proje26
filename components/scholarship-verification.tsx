"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MailCheck,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  completeScholarshipVerification,
  getPendingScholarshipEmail,
  isFirebaseConfigured,
  isScholarshipVerificationLink,
} from "../lib/firebase/client";

export default function ScholarshipVerification() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    "ready" | "loading" | "success" | "error" | "not-configured"
  >("ready");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEmail(getPendingScholarshipEmail());
      if (!isFirebaseConfigured()) {
        setState("not-configured");
      } else if (!isScholarshipVerificationLink(window.location.href)) {
        setState("error");
        setMessage("Bu doğrulama bağlantısı geçerli değil veya süresi dolmuş.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setMessage("Burs profiline yazdığın e-posta adresini gir.");
      return;
    }
    setState("loading");
    setMessage("");
    try {
      await completeScholarshipVerification(
        email.trim().toLocaleLowerCase("tr-TR"),
        window.location.href,
      );
      setState("success");
    } catch {
      setState("error");
      setMessage(
        "E-posta doğrulanamadı. Bağlantı süresi dolmuş olabilir veya farklı bir e-posta girdin.",
      );
    }
  }

  return (
    <main className="verification-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} />
        Tercihçe’ye dön
      </Link>
      <div className="verification-card">
        <span className="verification-icon">
          {state === "success" ? (
            <CheckCircle2 size={31} />
          ) : state === "error" || state === "not-configured" ? (
            <ShieldAlert size={31} />
          ) : (
            <MailCheck size={31} />
          )}
        </span>
        {state === "success" ? (
          <>
            <span className="section-kicker">Doğrulandı</span>
            <h1>Burs profilin aktif.</h1>
            <p>
              Uygun ve doğrulanmış bir burs eşleşmesi olduğunda sana e-posta
              gönderilecek. İletişim bilgin, sen ayrıca onaylamadan hiçbir
              destekçiyle paylaşılmaz.
            </p>
            <Link className="primary-button" href="/">
              Tercihçe’ye dön
            </Link>
          </>
        ) : state === "not-configured" ? (
          <>
            <span className="section-kicker">Yerel mod</span>
            <h1>Firebase bağlantısı bekleniyor.</h1>
            <p>
              Bu ekran hazır, ancak e-posta doğrulama Firebase web uygulaması
              bağlandıktan sonra çalışacak.
            </p>
          </>
        ) : (
          <>
            <span className="section-kicker">Burs ağı</span>
            <h1>E-postanı doğrula.</h1>
            <p>
              Burs profiline yazdığın e-posta adresini doğrulamak için aşağıdaki
              alanı kontrol et.
            </p>
            <form onSubmit={verify}>
              <label className="field">
                <span>E-posta adresin</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@eposta.com"
                  autoComplete="email"
                  required
                />
              </label>
              {message && <p className="form-error">{message}</p>}
              <button
                className="primary-button"
                type="submit"
                disabled={state === "loading"}
              >
                {state === "loading" ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    Doğrulanıyor
                  </>
                ) : (
                  "E-postayı doğrula"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
