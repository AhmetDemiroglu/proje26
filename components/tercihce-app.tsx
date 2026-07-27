"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  Compass,
  Database,
  ExternalLink,
  FileDown,
  Heart,
  Info,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand";
import { HeaderFx } from "@/components/header-fx";
import {
  formatRank,
  formatScore,
  groupMatches,
  MATCH_BANDS,
  rankPrograms,
} from "../lib/scoring";
import { trackEvent } from "../lib/analytics-client";
import { loadPrograms } from "../lib/programs";
import type {
  AiAdvice,
  CandidateNets,
  CandidatePreferences,
  CandidateScores,
  MatchBand,
  ProgramMatch,
  ScholarshipProfileInput,
  ScoreType,
} from "../lib/types";
import { NET_FIELDS, SCORE_TYPES } from "../lib/types";

function firebaseIsConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

const CITIES = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Aksaray",
  "Amasya",
  "Ankara",
  "Antalya",
  "Ardahan",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bartın",
  "Batman",
  "Bayburt",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Düzce",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Iğdır",
  "Isparta",
  "İstanbul",
  "İzmir",
  "Kahramanmaraş",
  "Karabük",
  "Karaman",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırıkkale",
  "Kırklareli",
  "Kırşehir",
  "Kilis",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Mardin",
  "Mersin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Osmaniye",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Şanlıurfa",
  "Şırnak",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Uşak",
  "Van",
  "Yalova",
  "Yozgat",
  "Zonguldak",
];

const SCORE_LABELS: Record<
  ScoreType,
  { title: string; score: string; helper: string }
> = {
  TYT: {
    title: "TYT",
    score: "Y-TYT puanı",
    helper: "Önlisans programları için",
  },
  SAY: {
    title: "Sayısal",
    score: "Y-SAY puanı",
    helper: "Mühendislik, tıp ve fen alanları",
  },
  EA: {
    title: "Eşit Ağırlık",
    score: "Y-EA puanı",
    helper: "Hukuk, işletme ve sosyal alanlar",
  },
  SÖZ: {
    title: "Sözel",
    score: "Y-SÖZ puanı",
    helper: "İletişim, eğitim ve beşeri alanlar",
  },
  DİL: {
    title: "Dil",
    score: "Y-DİL puanı",
    helper: "Dil ve edebiyat programları",
  },
};

const NET_LABELS: Record<(typeof NET_FIELDS)[number], string> = {
  tytTurkce: "TYT Türkçe",
  tytSosyal: "TYT Sosyal Bilimler",
  tytMatematik: "TYT Temel Matematik",
  tytFen: "TYT Fen Bilimleri",
  aytMatematik: "AYT Matematik",
  aytFizik: "AYT Fizik",
  aytKimya: "AYT Kimya",
  aytBiyoloji: "AYT Biyoloji",
  aytEdebiyat: "AYT Türk Dili ve Edebiyatı",
  aytTarih1: "AYT Tarih-1",
  aytCografya1: "AYT Coğrafya-1",
  aytTarih2: "AYT Tarih-2",
  aytCografya2: "AYT Coğrafya-2",
  aytFelsefe: "AYT Felsefe Grubu",
  aytDin: "AYT Din Kültürü",
  ydt: "YDT neti",
};

type ScoreInput = Record<ScoreType, { rank: string; score: string }>;

const EMPTY_SCORES: ScoreInput = {
  TYT: { rank: "", score: "" },
  SAY: { rank: "", score: "" },
  EA: { rank: "", score: "" },
  SÖZ: { rank: "", score: "" },
  DİL: { rank: "", score: "" },
};

const DEFAULT_PREFERENCES: CandidatePreferences = {
  degree: "all",
  cities: [],
  universityTypes: [],
  funding: "all",
  programQuery: "",
};

function parseNumber(value: string) {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

function buildCandidateScores(
  selected: ScoreType[],
  scoreInputs: ScoreInput,
): CandidateScores {
  return Object.fromEntries(
    selected.map((type) => [
      type,
      {
        rank: parseNumber(scoreInputs[type].rank),
        placementScore: parseNumber(scoreInputs[type].score),
      },
    ]),
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function Hero() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand" href="#top" aria-label="Tercihçe ana sayfa">
            <BrandMark />
            <span>tercihçe</span>
          </a>
          <nav className="desktop-nav" aria-label="Ana menü">
            <a href="#nasil-calisir">Nasıl çalışır?</a>
            <a href="#veri-kaynagi">Veri kaynağı</a>
            <a href="/destekci-basvuru">Destekçi ol</a>
            <a href="/gizlilik">Gizlilik</a>
          </nav>
          <button className="header-cta" onClick={() => scrollToId("analiz")}>
            Sonucumu değerlendir
            <ArrowRight size={17} />
          </button>
          <button
            className="mobile-menu"
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü göster"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <HeaderFx />
        </div>
        {mobileOpen && (
          <nav className="mobile-nav" aria-label="Mobil ana menü">
            <a href="#nasil-calisir" onClick={() => setMobileOpen(false)}>
              Nasıl çalışır?
            </a>
            <a href="#veri-kaynagi" onClick={() => setMobileOpen(false)}>
              Veri kaynağı
            </a>
            <a href="/destekci-basvuru">Destekçi ol</a>
            <a href="/gizlilik">Gizlilik</a>
            <button
              className="mobile-nav-cta"
              onClick={() => {
                setMobileOpen(false);
                scrollToId("analiz");
              }}
            >
              Sonucumu değerlendir
              <ArrowRight size={17} />
            </button>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="hero shell">
          <div className="hero-copy">
            <h1>
              Sıralaman bir sayı.
              <br />
              <span>Seçeneklerin ondan büyük.</span>
            </h1>
            <p className="hero-lede">
              Sonucunu kimlik bilgisi vermeden değerlendir. 2026 program
              kataloğunu, 2025 taban sıralamalarıyla tarayalım ve sana dengeli
              bir başlangıç listesi çıkaralım.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollToId("analiz")}>
                Ücretsiz analiz et
                <ArrowRight size={19} />
              </button>
              <a className="text-button" href="#nasil-calisir">
                Önce nasıl çalıştığını gör
              </a>
            </div>
            <div className="trust-strip" aria-label="Gizlilik özellikleri">
              <span>
                <UserRoundX size={17} />
                T.C. kimlik no yok
              </span>
              <span>
                <FileDown size={17} />
                Belge yükleme yok
              </span>
              <span>
                <LockKeyhole size={17} />
                Üyelik zorunlu değil
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Örnek tercih analizi">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="rank-card">
              <div className="rank-card-top">
                <span>Sayısal sıran</span>
                <span className="verified-pill">
                  <CircleCheck size={14} />
                  Hazır
                </span>
              </div>
              <strong>42.680</strong>
              <div className="rank-meter">
                <span />
              </div>
              <div className="range-labels">
                <span>Güçlü</span>
                <span>Dengeli</span>
                <span>İddialı</span>
              </div>
            </div>
            <div className="floating-program program-one">
              <span className="program-icon green">
                <Target size={17} />
              </span>
              <div>
                <strong>Bilgisayar Mühendisliği</strong>
                <small>Dengeli seçenek</small>
              </div>
              <Check size={18} />
            </div>
            <div className="floating-program program-two">
              <span className="program-icon coral">
                <BookOpen size={17} />
              </span>
              <div>
                <strong>Endüstri Mühendisliği</strong>
                <small>Güçlü seçenek</small>
              </div>
              <Check size={18} />
            </div>
            <div className="floating-stat">
              <Database size={16} />
              <span>
                <strong>21.482</strong>
                güncel program
              </span>
            </div>
          </div>
        </section>

        <section className="proof-bar">
          <div className="shell proof-inner">
            <p>Resmi veriye dayalı, sakin ve ücretsiz bir başlangıç rehberi.</p>
            <div>
              <span>2026 YÖK Atlas kataloğu</span>
              <span>2025 taban sıralamaları</span>
              <span>Anonim kullanım</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: BarChart3,
      title: "Yerleştirme sonucunu gir",
      copy: "ÖSYM belgendeki Y-TYT, Y-SAY, Y-EA, Y-SÖZ veya Y-DİL puanı ile başarı sıranı yaz.",
    },
    {
      number: "02",
      icon: Compass,
      title: "Önceliklerini seç",
      copy: "Şehir, üniversite türü, burs ve program ilgi alanınla sonuçları daralt.",
    },
    {
      number: "03",
      icon: Sparkles,
      title: "Aralığını keşfet",
      copy: "Güçlü, dengeli, sınırda ve iddialı seçenekleri tek listede karşılaştır.",
    },
  ];

  return (
    <section className="how-section shell" id="nasil-calisir">
      <div className="section-heading">
        <span className="section-kicker">3 sade adım</span>
        <h2>Tercih karmaşasını, anlaşılır bir başlangıca çevir.</h2>
        <p>
          Puanı değil, yerleştirme başarı sırasını merkeze alıyoruz. Çünkü
          yıllar arasında daha sağlıklı karşılaştırma sıralama üzerinden yapılır.
        </p>
      </div>
      <div className="step-grid">
        {steps.map(({ number, icon: Icon, title, copy }) => (
          <article className="step-card" key={number}>
            <span className="step-number">{number}</span>
            <span className="step-icon">
              <Icon size={22} />
            </span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="wizard-progress" aria-label={`Analiz adımı ${step} / 3`}>
      {[1, 2, 3].map((number) => (
        <div
          className={`progress-item ${number <= step ? "active" : ""}`}
          key={number}
        >
          <span>{number < step ? <Check size={15} /> : number}</span>
          <small>
            {number === 1 ? "Sonucun" : number === 2 ? "Tercihlerin" : "Analiz"}
          </small>
        </div>
      ))}
    </div>
  );
}

function ResultInputs({
  nickname,
  setNickname,
  scholarshipProfile,
  setScholarshipProfile,
  selectedTypes,
  setSelectedTypes,
  scores,
  setScores,
  nets,
  setNets,
  error,
  scholarshipApplicationsEnabled,
  onNext,
}: {
  nickname: string;
  setNickname: (value: string) => void;
  scholarshipProfile: ScholarshipProfileInput;
  setScholarshipProfile: (value: ScholarshipProfileInput) => void;
  selectedTypes: ScoreType[];
  setSelectedTypes: (value: ScoreType[]) => void;
  scores: ScoreInput;
  setScores: (value: ScoreInput) => void;
  nets: CandidateNets;
  setNets: (value: CandidateNets) => void;
  error: string;
  scholarshipApplicationsEnabled: boolean;
  onNext: () => void;
}) {
  const [showNets, setShowNets] = useState(false);

  function toggleScoreType(type: ScoreType) {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return;
      setSelectedTypes(selectedTypes.filter((item) => item !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  }

  return (
    <div className="wizard-step">
      <div className="wizard-heading">
        <span className="step-label">Adım 1</span>
        <h2>Sonuç belgende hangi sıralamalar var?</h2>
        <p>
          Yerleştirme puanını ve başarı sıranı gir. Ham sınav puanı yerine
          başında “Y-” bulunan yerleştirme puanını kullan.
        </p>
      </div>

      <div className="identity-grid">
        <label className="field">
          <span>
            Sana nasıl seslenelim? <small>Opsiyonel</small>
          </span>
          <input
            value={nickname}
            maxLength={60}
            onChange={(event) => {
              setNickname(event.target.value);
              setScholarshipProfile({
                ...scholarshipProfile,
                name: event.target.value,
              });
            }}
            placeholder="Örneğin: Deniz"
            autoComplete="name"
          />
        </label>
        <label className="field">
          <span>
            E-posta adresin <small>Opsiyonel</small>
          </span>
          <input
            type="email"
            value={scholarshipProfile.email}
            maxLength={254}
            onChange={(event) =>
              setScholarshipProfile({
                ...scholarshipProfile,
                email: event.target.value,
              })
            }
            placeholder="ornek@eposta.com"
            autoComplete="email"
          />
        </label>
      </div>

      <div className="scholarship-option">
        <div className="scholarship-option-head">
          <span className="scholarship-icon">
            <Heart size={20} />
          </span>
          <div>
            <strong>Burs eşleşmesine açık ol</strong>
            <p>
              E-posta adresini girersen sıralamana uygun burs fırsatları için
              bilgilendirme alabilir, doğrulanmış destekçilerle güvenli bir
              eşleşme sürecine katılabilirsin.
            </p>
          </div>
        </div>
        {!scholarshipApplicationsEnabled && (
          <div className="notice-box">
            <Info size={18} />
            <p>
              Burs ağı başvuruları güvenlik ve aydınlatma kontrolleri
              tamamlanana kadar kapalıdır. Bu aşamada yazdığın e-posta sunucuya
              gönderilmez.
            </p>
          </div>
        )}
        {scholarshipApplicationsEnabled && scholarshipProfile.email && (
          <div className="scholarship-fields">
            <fieldset>
              <legend>Yaş durumu</legend>
              <div className="age-options">
                <button
                  type="button"
                  className={
                    scholarshipProfile.ageGroup === "adult" ? "active" : ""
                  }
                  onClick={() =>
                    setScholarshipProfile({
                      ...scholarshipProfile,
                      ageGroup: "adult",
                    })
                  }
                >
                  18 yaşındayım veya daha büyüğüm
                </button>
                <button
                  type="button"
                  className={
                    scholarshipProfile.ageGroup === "minor" ? "active" : ""
                  }
                  onClick={() =>
                    setScholarshipProfile({
                      ...scholarshipProfile,
                      ageGroup: "minor",
                    })
                  }
                >
                  18 yaşından küçüğüm
                </button>
              </div>
            </fieldset>
            <div className="notice-box">
              <Info size={18} />
              <p>
                Adın, e-postan ve YKS sonuçların burs eşleştirmesi için ayrı ve
                özel erişimli bir profilde tutulur. Destekçiler önce kimliksiz
                aday özetlerini görür. İletişim bilgin yalnızca belirli bir
                eşleşmeyi ayrıca onayladığında paylaşılır.{" "}
                <a href="/burs-aydinlatma" target="_blank">
                  Burs ağı aydınlatma metni
                </a>
              </p>
            </div>
            <label className="consent-card scholarship-consent">
              <input
                type="checkbox"
                checked={scholarshipProfile.consent}
                onChange={(event) =>
                  setScholarshipProfile({
                    ...scholarshipProfile,
                    consent: event.target.checked,
                  })
                }
              />
              <span className="custom-checkbox">
                {scholarshipProfile.consent && <Check size={15} />}
              </span>
              <span>
                <strong>Burs eşleştirmesi için açık rıza veriyorum</strong>
                <small>
                  Ad, e-posta, YKS sonucu ve tercihlerimin burs eşleştirmesi
                  amacıyla saklanmasını; iletişim bilgilerimin yalnızca ayrıca
                  onaylayacağım doğrulanmış bir eşleşmede paylaşılmasını kabul
                  ediyorum.
                </small>
              </span>
            </label>
          </div>
        )}
      </div>

      <fieldset className="score-type-fieldset">
        <legend>Puan türlerini seç</legend>
        <div className="score-type-grid">
          {SCORE_TYPES.map((type) => {
            const selected = selectedTypes.includes(type);
            return (
              <button
                type="button"
                key={type}
                className={`score-type-card ${selected ? "selected" : ""}`}
                onClick={() => toggleScoreType(type)}
                aria-pressed={selected}
              >
                <span className="selection-check">
                  {selected && <Check size={15} />}
                </span>
                <strong>{SCORE_LABELS[type].title}</strong>
                <small>{SCORE_LABELS[type].helper}</small>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="score-input-list">
        {selectedTypes.map((type) => (
          <div className="score-input-row" key={type}>
            <div className="score-input-title">
              <span>{type}</span>
              <div>
                <strong>{SCORE_LABELS[type].title}</strong>
                <small>ÖSYM sonuç belgesindeki yerleştirme değeri</small>
              </div>
            </div>
            <label className="field">
              <span>{SCORE_LABELS[type].score}</span>
              <input
                inputMode="decimal"
                value={scores[type].score}
                onChange={(event) =>
                  setScores({
                    ...scores,
                    [type]: { ...scores[type], score: event.target.value },
                  })
                }
                placeholder="Örn. 412,482"
                aria-label={`${type} yerleştirme puanı`}
              />
            </label>
            <label className="field">
              <span>Başarı sırası</span>
              <input
                inputMode="numeric"
                value={scores[type].rank}
                onChange={(event) =>
                  setScores({
                    ...scores,
                    [type]: { ...scores[type], rank: event.target.value },
                  })
                }
                placeholder="Örn. 42.680"
                aria-label={`${type} yerleştirme başarı sırası`}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        className="details-toggle"
        type="button"
        onClick={() => setShowNets(!showNets)}
        aria-expanded={showNets}
      >
        <span>
          <Plus size={17} />
          Netlerimi de eklemek istiyorum
          <small>Opsiyonel, toplu analiz kalitesini artırır</small>
        </span>
        <ChevronDown className={showNets ? "rotated" : ""} size={19} />
      </button>

      {showNets && (
        <div className="nets-grid">
          {NET_FIELDS.map((field) => (
            <label className="field" key={field}>
              <span>{NET_LABELS[field]}</span>
              <input
                inputMode="decimal"
                value={nets[field] ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setNets({
                    ...nets,
                    [field]: value === "" ? undefined : parseNumber(value),
                  });
                }}
                placeholder="Net"
              />
            </label>
          ))}
        </div>
      )}

      <div className="privacy-note">
        <ShieldCheck size={20} />
        <p>
          <strong>İki ayrı veri alanı kullanıyoruz.</strong> İstatistik kaydı
          kimliksiz tutulur. Ad ve e-posta yalnızca burs ağına açık rıza
          verirsen özel erişimli burs profiline gönderilir.
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="wizard-actions end">
        <button className="primary-button" type="button" onClick={onNext}>
          Tercihlerini ekle
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function PreferenceInputs({
  preferences,
  setPreferences,
  onBack,
  onAnalyze,
  loading,
  consent,
  setConsent,
  error,
}: {
  preferences: CandidatePreferences;
  setPreferences: (value: CandidatePreferences) => void;
  onBack: () => void;
  onAnalyze: () => void;
  loading: boolean;
  consent: boolean;
  setConsent: (value: boolean) => void;
  error: string;
}) {
  const [cityValue, setCityValue] = useState("");
  const availableCities = CITIES.filter(
    (city) => !preferences.cities.includes(city),
  );

  function toggleUniversityType(type: string) {
    const exists = preferences.universityTypes.includes(type);
    setPreferences({
      ...preferences,
      universityTypes: exists
        ? preferences.universityTypes.filter((item) => item !== type)
        : [...preferences.universityTypes, type],
    });
  }

  return (
    <div className="wizard-step">
      <div className="wizard-heading">
        <span className="step-label">Adım 2</span>
        <h2>Senin için önemli olan ne?</h2>
        <p>
          Hepsini boş bırakabilirsin. Ne kadar az filtre seçersen o kadar geniş
          bir keşif listesi görürsün.
        </p>
      </div>

      <fieldset className="preference-group">
        <legend>Program düzeyi</legend>
        <div className="segmented-control">
          {[
            ["all", "Fark etmez"],
            ["lisans", "Lisans"],
            ["onlisans", "Önlisans"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={preferences.degree === value ? "active" : ""}
              onClick={() =>
                setPreferences({
                  ...preferences,
                  degree: value as CandidatePreferences["degree"],
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="preference-grid">
        <label className="field">
          <span>İlgilendiğin program</span>
          <div className="input-with-icon">
            <Search size={18} />
            <input
              value={preferences.programQuery}
              onChange={(event) =>
                setPreferences({
                  ...preferences,
                  programQuery: event.target.value,
                })
              }
              placeholder="Örn. bilgisayar, psikoloji"
              maxLength={60}
            />
          </div>
        </label>

        <label className="field">
          <span>Şehir ekle</span>
          <div className="select-with-icon">
            <MapPin size={18} />
            <select
              value={cityValue}
              onChange={(event) => {
                const city = event.target.value;
                setCityValue("");
                if (city) {
                  setPreferences({
                    ...preferences,
                    cities: [...preferences.cities, city],
                  });
                }
              }}
            >
              <option value="">Tüm şehirler</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      {preferences.cities.length > 0 && (
        <div className="selected-chips" aria-label="Seçili şehirler">
          {preferences.cities.map((city) => (
            <button
              type="button"
              key={city}
              onClick={() =>
                setPreferences({
                  ...preferences,
                  cities: preferences.cities.filter((item) => item !== city),
                })
              }
            >
              {city}
              <X size={14} />
            </button>
          ))}
        </div>
      )}

      <fieldset className="preference-group">
        <legend>Üniversite türü</legend>
        <div className="toggle-chips">
          {[
            ["DEVLET", "Devlet"],
            ["VAKIF", "Vakıf"],
            ["KKTC", "KKTC"],
            ["YURTDISI KAMU", "Yurt dışı"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={
                preferences.universityTypes.includes(value) ? "active" : ""
              }
              onClick={() => toggleUniversityType(value)}
              aria-pressed={preferences.universityTypes.includes(value)}
            >
              {preferences.universityTypes.includes(value) && <Check size={15} />}
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="preference-group">
        <legend>Ücret ve burs</legend>
        <div className="segmented-control funding-control">
          {[
            ["all", "Fark etmez"],
            ["free", "Ücretsiz veya tam burslu"],
            ["scholarship", "Yalnızca tam burslu"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={preferences.funding === value ? "active" : ""}
              onClick={() =>
                setPreferences({
                  ...preferences,
                  funding: value as CandidatePreferences["funding"],
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="consent-card">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span className="custom-checkbox">{consent && <Check size={15} />}</span>
        <span>
          <strong>Anonim sonucumu araştırma için paylaş</strong>
          <small>
            İsim, kimlik, e-posta ve belge olmadan yalnızca puan, sıra ve genel
            ilgi sinyalleri toplu istatistik için kaydedilir. Seçmezsen analiz
            yine çalışır.
          </small>
        </span>
      </label>

      {error && <p className="form-error">{error}</p>}
      <div className="wizard-actions">
        <button className="secondary-button" type="button" onClick={onBack}>
          <ChevronLeft size={18} />
          Geri
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={onAnalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle className="spin" size={19} />
              21.482 program taranıyor
            </>
          ) : (
            <>
              Analizi başlat
              <Sparkles size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  saved,
  onSave,
}: {
  match: ProgramMatch;
  saved: boolean;
  onSave: (match: ProgramMatch) => void;
}) {
  return (
    <article className="match-card">
      <div className="match-card-head">
        <span className={`band-badge ${match.band}`}>
          {MATCH_BANDS[match.band].label}
        </span>
        <button
          type="button"
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={() => onSave(match)}
          aria-label={saved ? "Listeden çıkar" : "Tercih listeme ekle"}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <h3>{match.program}</h3>
      <p className="university-name">{match.university}</p>
      <div className="program-meta">
        <span>
          <MapPin size={14} />
          {match.city}
        </span>
        <span>{match.funding}</span>
        {match.language && <span>{match.language}</span>}
      </div>
      <div className="rank-comparison">
        <div>
          <small>2025 taban sırası</small>
          <strong>{formatRank(match.rank2025)}</strong>
        </div>
        <span className="comparison-line" />
        <div>
          <small>2025 taban puanı</small>
          <strong>{formatScore(match.score2025)}</strong>
        </div>
      </div>
      <div className="card-footer">
        <span>Program kodu {match.code}</span>
        <a
          href={`https://yokatlas.yok.gov.tr/lisans.php?y=${match.code}`}
          target="_blank"
          rel="noreferrer"
        >
          YÖK Atlas
          <ExternalLink size={13} />
        </a>
      </div>
    </article>
  );
}

function Results({
  nickname,
  scores,
  matches,
  selectedTypes,
  consent,
  saveStatus,
  onRestart,
}: {
  nickname: string;
  scores: CandidateScores;
  matches: ProgramMatch[];
  selectedTypes: ScoreType[];
  consent: boolean;
  saveStatus: string;
  onRestart: () => void;
}) {
  const [activeType, setActiveType] = useState<ScoreType>(selectedTypes[0]);
  const [activeBand, setActiveBand] = useState<MatchBand>("dengeli");
  const [savedCodes, setSavedCodes] = useState<number[]>([]);
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const typeMatches = useMemo(
    () => matches.filter((match) => match.scoreType === activeType),
    [matches, activeType],
  );
  const grouped = useMemo(() => groupMatches(typeMatches), [typeMatches]);
  const visibleMatches = grouped[activeBand];
  const candidateRank = scores[activeType]?.rank ?? 0;

  function toggleSaved(match: ProgramMatch) {
    const exists = savedCodes.includes(match.code);
    setSavedCodes(
      exists
        ? savedCodes.filter((code) => code !== match.code)
        : [...savedCodes, match.code],
    );
    if (!exists && consent && firebaseIsConfigured()) {
      void import("../lib/firebase/client")
        .then(({ saveInterestEvent }) =>
          saveInterestEvent({
            program: match,
            candidateRank,
            band: match.band,
          }),
        )
        .catch(() => undefined);
    }
  }

  async function getAiAdvice() {
    const candidates = [
      ...grouped.dengeli,
      ...grouped.guclu,
      ...grouped.sinir,
      ...grouped.iddiali,
    ].slice(0, 8);
    if (!candidates.length) return;

    setAiLoading(true);
    setAiError("");
    try {
      const response = await fetch("/api/advice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scoreType: activeType,
          candidateRank,
          programs: candidates.map((program) => ({
            code: program.code,
            university: program.university,
            program: program.program,
            city: program.city,
            funding: program.funding,
            scoreType: program.scoreType,
            rank2025: program.rank2025,
            band: program.band,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Yorum alınamadı.");
      }
      setAdvice(payload as AiAdvice);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Yorum alınamadı.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="results-view" id="sonuclar">
      <div className="results-hero">
        <div>
          <span className="step-label">Analiz hazır</span>
          <h2>
            {nickname.trim() ? `${nickname.trim()}, ` : ""}
            seçeneklerini birlikte daraltalım.
          </h2>
          <p>
            Liste 2026 program kataloğunu ve 2025 taban sıralamalarını kullanır.
            Bir tahmin modeli veya yerleşme garantisi değildir.
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onRestart}>
          Sonucu değiştir
        </button>
      </div>

      {saveStatus && (
        <div className="save-status">
          <ShieldCheck size={18} />
          {saveStatus}
        </div>
      )}

      <div className="result-summary-grid">
        <article>
          <small>{SCORE_LABELS[activeType].title} sıran</small>
          <strong>{formatRank(candidateRank)}</strong>
        </article>
        <article>
          <small>Eşleşen aralık</small>
          <strong>{typeMatches.length.toLocaleString("tr-TR")}</strong>
        </article>
        <article>
          <small>Listene eklediklerin</small>
          <strong>{savedCodes.length}</strong>
        </article>
      </div>

      {selectedTypes.length > 1 && (
        <div className="result-type-tabs" role="tablist" aria-label="Puan türleri">
          {selectedTypes.map((type) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeType === type}
              className={activeType === type ? "active" : ""}
              key={type}
              onClick={() => {
                setActiveType(type);
                setActiveBand("dengeli");
                setAdvice(null);
                setAiError("");
              }}
            >
              {SCORE_LABELS[type].title}
            </button>
          ))}
        </div>
      )}

      <div className="band-tabs" role="tablist" aria-label="Eşleşme aralıkları">
        {(Object.keys(MATCH_BANDS) as MatchBand[]).map((band) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeBand === band}
            className={`${band} ${activeBand === band ? "active" : ""}`}
            key={band}
            onClick={() => setActiveBand(band)}
          >
            <span>{MATCH_BANDS[band].label}</span>
            <small>{grouped[band].length}</small>
          </button>
        ))}
      </div>

      <div className="band-explanation">
        <Info size={18} />
        <p>{MATCH_BANDS[activeBand].description}</p>
      </div>

      {visibleMatches.length ? (
        <div className="match-grid">
          {visibleMatches.map((match) => (
            <MatchCard
              key={match.code}
              match={match}
              saved={savedCodes.includes(match.code)}
              onSave={toggleSaved}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={26} />
          <h3>Bu aralıkta eşleşme bulunamadı.</h3>
          <p>Başka bir aralığı aç veya tercih filtrelerini genişlet.</p>
        </div>
      )}

      <section className="ai-panel">
        <div className="ai-icon">
          <Bot size={26} />
        </div>
        <div className="ai-content">
          <span className="section-kicker">Tercihçe AI</span>
          <h3>Listeyi daha sakin okumak ister misin?</h3>
          <p>
            Yalnızca bu ekrandaki sıralama ve programları Gemini’ye göndererek
            kısa bir karşılaştırma özeti al. İsim ve netler gönderilmez.
          </p>
          {!advice && (
            <button
              className="ai-button"
              type="button"
              onClick={getAiAdvice}
              disabled={aiLoading || !typeMatches.length}
            >
              {aiLoading ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Yorum hazırlanıyor
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  AI yorumunu al
                </>
              )}
            </button>
          )}
          {aiError && <p className="ai-error">{aiError}</p>}
          {advice && (
            <div className="advice-card">
              <p className="advice-summary">{advice.summary}</p>
              <div className="advice-columns">
                <div>
                  <strong>Gözlemler</strong>
                  <ul>
                    {advice.observations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Sonraki adımlar</strong>
                  <ul>
                    {advice.nextSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="advice-caution">{advice.caution}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Analyzer() {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [scholarshipProfile, setScholarshipProfile] =
    useState<ScholarshipProfileInput>({
      name: "",
      email: "",
      ageGroup: "adult",
      consent: false,
    });
  const [selectedTypes, setSelectedTypes] = useState<ScoreType[]>(["SAY"]);
  const [scoreInputs, setScoreInputs] = useState<ScoreInput>(EMPTY_SCORES);
  const [nets, setNets] = useState<CandidateNets>({});
  const [preferences, setPreferences] =
    useState<CandidatePreferences>(DEFAULT_PREFERENCES);
  const [consent, setConsent] = useState(false);
  const [matches, setMatches] = useState<ProgramMatch[]>([]);
  const [candidateScores, setCandidateScores] = useState<CandidateScores>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [
    scholarshipApplicationsEnabled,
    setScholarshipApplicationsEnabled,
  ] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/public-config", { cache: "no-store" })
      .then((response) => response.json())
      .then((config: { scholarshipApplicationsEnabled?: boolean }) => {
        if (active) {
          setScholarshipApplicationsEnabled(
            config.scholarshipApplicationsEnabled === true,
          );
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function validateScores() {
    const normalizedEmail = scholarshipProfile.email.trim();
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return "Geçerli bir e-posta adresi gir veya e-posta alanını boş bırak.";
    }
    if (scholarshipProfile.consent && !normalizedEmail) {
      return "Burs eşleşmesine katılmak için e-posta adresini gir.";
    }
    if (
      scholarshipProfile.consent &&
      !scholarshipApplicationsEnabled
    ) {
      return "Burs ağı başvuruları henüz açılmadı.";
    }
    for (const type of selectedTypes) {
      const rank = parseNumber(scoreInputs[type].rank);
      const score = parseNumber(scoreInputs[type].score);
      if (!Number.isInteger(rank) || rank < 1 || rank > 5_000_000) {
        return `${SCORE_LABELS[type].title} başarı sıranı 1 ile 5.000.000 arasında gir.`;
      }
      if (!Number.isFinite(score) || score < 100 || score > 600) {
        return `${SCORE_LABELS[type].title} yerleştirme puanını 100 ile 600 arasında gir.`;
      }
    }
    for (const value of Object.values(nets)) {
      if (value !== undefined && (!Number.isFinite(value) || value < -10 || value > 120)) {
        return "Net değerlerini -10 ile 120 arasında gir.";
      }
    }
    return "";
  }

  function goToPreferences() {
    const validationError = validateScores();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep(2);
    void trackEvent("analyzer_started");
  }

  async function analyze() {
    setLoading(true);
    setError("");
    setSaveStatus("");
    const scores = buildCandidateScores(selectedTypes, scoreInputs);

    try {
      const programLists = await Promise.all(
        selectedTypes.map(async (type) => ({
          type,
          programs: await loadPrograms(type),
        })),
      );
      const allMatches = programLists.flatMap(({ type, programs }) =>
        rankPrograms(
          programs,
          scores[type]?.rank ?? 0,
          type,
          preferences,
        ),
      );

      setMatches(allMatches);
      setCandidateScores(scores);
      void trackEvent("analyzer_completed", {
        resultCount: allMatches.length,
      });

      let submissionId: string | null = null;
      const statusMessages: string[] = [];

      if (consent) {
        if (firebaseIsConfigured()) {
          try {
            const { saveAnonymousSubmission } = await import(
              "../lib/firebase/client"
            );
            submissionId = await saveAnonymousSubmission({
              scores,
              nets,
              preferences,
            });
            statusMessages.push(
              "Anonim sonucun araştırma havuzuna güvenli biçimde kaydedildi.",
            );
          } catch {
            statusMessages.push(
              "Analiz tamamlandı, ancak anonim kayıt şu anda yapılamadı.",
            );
          }
        } else {
          statusMessages.push(
            "Analiz yerel modda çalıştı. Firebase bağlanana kadar sonuç sunucuya kaydedilmez.",
          );
        }
      } else {
        statusMessages.push("Anonim araştırma kaydı oluşturulmadı.");
      }

      if (
        scholarshipApplicationsEnabled &&
        scholarshipProfile.consent
      ) {
        if (firebaseIsConfigured()) {
          try {
            const { createScholarshipProfile } = await import(
              "../lib/firebase/client"
            );
            await createScholarshipProfile({
              profile: scholarshipProfile,
              scores,
              preferences,
              submissionId,
            });
            statusMessages.push(
              "Burs profilin oluşturuldu. E-posta doğrulama bağlantısını kontrol et.",
            );
            void trackEvent("scholarship_optin");
          } catch {
            statusMessages.push(
              "Burs profili veya doğrulama e-postası şu anda oluşturulamadı.",
            );
          }
        } else {
          statusMessages.push(
            "Burs profili Firebase bağlantısı tamamlanana kadar kaydedilmedi.",
          );
        }
      }

      setSaveStatus(statusMessages.join(" "));
      setStep(3);
      window.setTimeout(() => scrollToId("analiz"), 60);
    } catch {
      setError(
        "Program verileri yüklenemedi. İnternet bağlantını kontrol edip yeniden dene.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="analyzer-section" id="analiz">
      <div className="shell">
        <div className="analyzer-intro">
          <span className="section-kicker">Ücretsiz tercih taraması</span>
          <h2>Sonuç belgen yanında mı?</h2>
          <p>
            Yalnızca başında “Y-” bulunan yerleştirme puanını ve başarı sıranı
            yazman yeterli.
          </p>
        </div>
        <div className="analyzer-card">
          <Progress step={step} />
          {step === 1 && (
            <ResultInputs
              nickname={nickname}
              setNickname={setNickname}
              scholarshipProfile={scholarshipProfile}
              setScholarshipProfile={setScholarshipProfile}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              scores={scoreInputs}
              setScores={setScoreInputs}
              nets={nets}
              setNets={setNets}
              error={error}
              scholarshipApplicationsEnabled={scholarshipApplicationsEnabled}
              onNext={goToPreferences}
            />
          )}
          {step === 2 && (
            <PreferenceInputs
              preferences={preferences}
              setPreferences={setPreferences}
              onBack={() => {
                setError("");
                setStep(1);
              }}
              onAnalyze={analyze}
              loading={loading}
              consent={consent}
              setConsent={setConsent}
              error={error}
            />
          )}
          {step === 3 && (
            <Results
              nickname={nickname}
              scores={candidateScores}
              matches={matches}
              selectedTypes={selectedTypes}
              consent={consent}
              saveStatus={saveStatus}
              onRestart={() => {
                setError("");
                setStep(1);
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function DataSection() {
  return (
    <section className="data-section shell" id="veri-kaynagi">
      <div className="data-card">
        <div className="data-copy">
          <span className="section-kicker">Veri nereden geliyor?</span>
          <h2>Kaynağı açık, yorumu temkinli.</h2>
          <p>
            Program kataloğu YÖK Atlas’ın 2026 tercih kılavuzu verilerinden,
            karşılaştırma sıraları ise 2025 merkezi yerleştirme sonuçlarından
            alınır. Tercihçe resmi bir kurum değildir ve nihai kontrol her zaman
            güncel ÖSYM kılavuzundan yapılmalıdır.
          </p>
          <div className="data-links">
            <a
              href="https://yokatlas.yok.gov.tr/"
              target="_blank"
              rel="noreferrer"
            >
              YÖK Atlas
              <ExternalLink size={15} />
            </a>
            <a
              href="https://www.osym.gov.tr/"
              target="_blank"
              rel="noreferrer"
            >
              ÖSYM
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
        <div className="data-stats">
          <div>
            <strong>21.482</strong>
            <span>2026 program kaydı</span>
          </div>
          <div>
            <strong>5</strong>
            <span>puan türü</span>
          </div>
          <div>
            <strong>0</strong>
            <span>zorunlu kimlik bilgisi</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <a className="brand footer-brand" href="#top">
            <BrandMark />
            <span>tercihçe</span>
          </a>
          <p>
            YKS tercihlerine sakin, veriye dayalı ve ücretsiz bir başlangıç.
          </p>
        </div>
        <div className="footer-links">
          <a href="#nasil-calisir">Nasıl çalışır?</a>
          <a href="#veri-kaynagi">Veri kaynağı</a>
          <a href="/destekci-basvuru">Destekçi ol</a>
          <a href="/gizlilik">Gizlilik ve veri kullanımı</a>
        </div>
        <p className="disclaimer">
          Tercihçe, ÖSYM veya YÖK’e bağlı değildir. Son kararından önce güncel
          kılavuzu ve program koşullarını kontrol et.
        </p>
      </div>
    </footer>
  );
}

export default function TercihceApp() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Analyzer />
      <DataSection />
      <Footer />
    </>
  );
}
