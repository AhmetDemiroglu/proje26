"use client";

import type { User } from "firebase/auth";
import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  CircleOff,
  Database,
  Download,
  Eye,
  GraduationCap,
  HeartHandshake,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  ScrollText,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type JsonRecord = Record<string, unknown>;

type Overview = {
  period: { days: number; start: string; end: string };
  totals: {
    pageViews: number;
    uniqueSessions: number;
    analyzerStarts: number;
    analyzerCompletions: number;
    scholarshipOptins: number;
    donorApplications: number;
  };
  allTime: {
    submissions: number;
    scholarshipProfiles: number;
    activeScholarships: number;
    donorApplications: number;
    pendingDonors: number;
  };
  daily: Array<
    {
      day: string;
      pageViews?: number;
      uniqueSessions?: number;
      analyzerCompletions?: number;
    } & JsonRecord
  >;
  cities: Array<{ city: string; count: number }>;
  submissionStatistics: {
    sampleSize: number;
    isSample: boolean;
    totalAvailable: number;
    scores: Record<
      string,
      {
        count: number;
        averageRank: number | null;
        averagePlacementScore: number | null;
        rankBands: Record<string, number>;
      }
    >;
    interest: {
      degree: Record<string, number>;
      funding: Record<string, number>;
      universityTypes: Record<string, number>;
    };
  };
  recentEvents: JsonRecord[];
  config: {
    scholarshipApplicationsEnabled: boolean;
    legalNoticeReady: boolean;
  };
};

type Tab =
  | "overview"
  | "submissions"
  | "scholarships"
  | "donors"
  | "audit"
  | "system";

const TABS: Array<{
  id: Tab;
  label: string;
  icon: typeof BarChart3;
}> = [
  { id: "overview", label: "Genel bakış", icon: BarChart3 },
  { id: "submissions", label: "Sonuç kayıtları", icon: Database },
  { id: "scholarships", label: "Burs adayları", icon: GraduationCap },
  { id: "donors", label: "Destekçiler", icon: HeartHandshake },
  { id: "audit", label: "İşlem günlüğü", icon: ScrollText },
  { id: "system", label: "Sistem", icon: Settings },
];

const STATUS_LABELS: Record<string, string> = {
  pending_review: "İncelemede",
  approved: "Onaylı",
  rejected: "Reddedildi",
  paused: "Duraklatıldı",
  pending_email_verification: "E-posta bekleniyor",
  active: "Aktif",
};

function formatNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString("tr-TR");
}

const LOGIN_ERRORS: Record<string, string> = {
  "auth/unauthorized-domain":
    "Bu alan adı Firebase'de yetkili değil. Authentication > Settings > Authorized domains listesine ekleyin.",
  "auth/operation-not-allowed":
    "Google sağlayıcısı Firebase'de kapalı. Authentication > Sign-in method bölümünden açın.",
  "auth/popup-blocked":
    "Tarayıcı giriş penceresini engelledi. Açılır pencerelere izin verip tekrar deneyin.",
  "auth/popup-closed-by-user": "Giriş penceresi kapatıldı.",
  "auth/cancelled-popup-request": "Giriş penceresi kapatıldı.",
  "auth/network-request-failed": "Ağ bağlantısı kurulamadı.",
  "auth/invalid-api-key":
    "Firebase API anahtarı geçersiz. Ortam değişkenlerini kontrol edin.",
};

function loginErrorMessage(reason: unknown) {
  const code =
    typeof reason === "object" && reason !== null && "code" in reason
      ? String((reason as { code: unknown }).code)
      : "";
  if (code && LOGIN_ERRORS[code]) return LOGIN_ERRORS[code];
  if (code) return `Google ile giriş tamamlanamadı. (${code})`;
  return "Google ile giriş tamamlanamadı.";
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function scoreSummary(value: unknown) {
  if (!value || typeof value !== "object") return "Puan yok";
  return Object.entries(value as Record<string, { rank?: number }>)
    .map(([type, score]) => `${type} ${formatNumber(score.rank)}`)
    .join(" · ");
}

function csvCell(value: unknown) {
  let text =
    value && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: JsonRecord[]) {
  if (!rows.length) return;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(30);
  const [scoreType, setScoreType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const signInRef = useRef<typeof import("@/lib/firebase/client") | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => undefined;
    import("@/lib/firebase/client")
      .then((firebaseClient) => {
        // Giriş fonksiyonlarını önden sakla. Tıklama anında await beklenirse
        // tarayıcı kullanıcı hareketi bağlamını yitirir ve açılır pencere
        // sessizce engellenir.
        signInRef.current = firebaseClient;
        unsubscribe = firebaseClient.observeAdminUser((currentUser) => {
          setUser(currentUser?.isAnonymous ? null : currentUser);
          setAuthLoading(false);
        });
      })
      .catch(() => setAuthLoading(false));
    return () => unsubscribe();
  }, []);

  const adminFetch = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const { getAdminIdToken } = await import("@/lib/firebase/client");
      const token = await getAdminIdToken();
      if (!token) throw new Error("Yönetici oturumu bulunamadı.");
      const response = await fetch(path, {
        ...init,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          ...init?.headers,
        },
        cache: "no-store",
      });
      const payload = (await response.json()) as T & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Yönetim isteği başarısız.");
      }
      return payload;
    },
    [],
  );

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(
        await adminFetch<Overview>(`/api/admin/overview?days=${period}`),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [adminFetch, period]);

  useEffect(() => {
    if (!user || tab !== "overview") return;
    const timer = window.setTimeout(() => void loadOverview(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview, tab, user]);

  async function loadRows(
    target: Tab = tab,
    nextScoreType = scoreType,
    nextStatusFilter = statusFilter,
  ) {
    if (target === "overview" || target === "system") return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextScoreType && target !== "donors") {
        params.set("scoreType", nextScoreType);
      }
      if (nextStatusFilter && target !== "submissions") {
        params.set("status", nextStatusFilter);
      }
      const path =
        target === "submissions"
          ? "/api/admin/submissions"
          : target === "scholarships"
            ? "/api/admin/scholarships"
            : target === "donors"
              ? "/api/admin/donors"
              : "/api/admin/audit";
      const payload = await adminFetch<{ rows: JsonRecord[] }>(
        `${path}?${params}`,
      );
      setRows(payload.rows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function selectTab(next: Tab) {
    setTab(next);
    setRows([]);
    setScoreType("");
    setStatusFilter("");
    if (next !== "overview" && next !== "system") {
      window.setTimeout(() => void loadRows(next, "", ""), 0);
    }
  }

  async function login() {
    setError("");
    const preloaded = signInRef.current;
    try {
      if (preloaded) {
        // await yok: window.open tıklama bağlamı içinde çağrılır.
        await preloaded.signInAdminWithGoogle();
        return;
      }
      const firebaseClient = await import("@/lib/firebase/client");
      await firebaseClient.signInAdminWithGoogle();
    } catch (reason) {
      const code =
        typeof reason === "object" && reason !== null && "code" in reason
          ? String((reason as { code: unknown }).code)
          : "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          const firebaseClient =
            preloaded ?? (await import("@/lib/firebase/client"));
          await firebaseClient.signInAdminWithGoogleRedirect();
          return;
        } catch (redirectReason) {
          setError(loginErrorMessage(redirectReason));
          return;
        }
      }
      setError(loginErrorMessage(reason));
    }
  }

  async function logout() {
    const { signOutAdmin } = await import("@/lib/firebase/client");
    await signOutAdmin();
    setOverview(null);
    setRows([]);
  }

  async function updateDonor(id: string, status: string) {
    const reviewNote =
      status === "rejected"
        ? window.prompt("Ret notu ekle. Öğrenci verisi paylaşılmayacak.") ?? ""
        : "";
    setLoading(true);
    setError("");
    try {
      await adminFetch("/api/admin/donors", {
        method: "PATCH",
        body: JSON.stringify({ id, status, reviewNote }),
      });
      await loadRows("donors");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Güncelleme yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleScholarship(enabled: boolean) {
    if (
      enabled &&
      !window.confirm(
        "Aydınlatma metni ve veri sorumlusu bilgilerinin hazır olduğunu doğruluyor musun?",
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await adminFetch("/api/admin/config", {
        method: "PATCH",
        body: JSON.stringify({ scholarshipApplicationsEnabled: enabled }),
      });
      await loadOverview();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ayar güncellenemedi.");
    } finally {
      setLoading(false);
    }
  }

  const chartMax = useMemo(
    () =>
      Math.max(
        1,
        ...(overview?.daily.map((day) => Number(day.pageViews ?? 0)) ?? []),
      ),
    [overview],
  );

  if (authLoading) {
    return (
      <main className="admin-auth">
        <LoaderCircle className="spin" size={28} />
        <p>Yönetici oturumu kontrol ediliyor.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-auth">
        <Link className="admin-brand" href="/">
          tercihçe<span>.</span>
        </Link>
        <span className="admin-lock">
          <LockKeyhole size={28} />
        </span>
        <h1>Yönetim merkezi</h1>
        <p>
          Bu alan öğrenci sonuçları ve destekçi başvuruları içerir. Yalnızca
          izin verilen, doğrulanmış yönetici hesabı erişebilir.
        </p>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="button" onClick={login}>
          Google ile güvenli giriş
        </button>
        <Link className="text-link" href="/">
          Siteye dön
        </Link>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">
          tercihçe<span>.</span>
        </Link>
        <div className="admin-user">
          <span>
            <ShieldCheck size={16} />
          </span>
          <div>
            <strong>Yönetici</strong>
            <small>{user.email}</small>
          </div>
        </div>
        <nav aria-label="Yönetim bölümleri">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              onClick={() => void selectTab(id)}
            >
              <Icon size={18} />
              {label}
              <ChevronRight size={15} />
            </button>
          ))}
        </nav>
        <button className="admin-logout" type="button" onClick={logout}>
          <LogOut size={17} />
          Çıkış yap
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="section-kicker">Özel yönetim alanı</span>
            <h1>{TABS.find((item) => item.id === tab)?.label}</h1>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Verileri yenile"
            onClick={() =>
              tab === "overview" || tab === "system"
                ? void loadOverview()
                : void loadRows()
            }
          >
            <RefreshCw className={loading ? "spin" : ""} size={19} />
          </button>
        </header>

        {error && (
          <div className="admin-alert">
            <CircleOff size={18} />
            {error}
          </div>
        )}

        {(tab === "overview" || tab === "system") && !overview && loading && (
          <div className="admin-loading">
            <LoaderCircle className="spin" size={24} />
            Veriler yükleniyor
          </div>
        )}

        {tab === "overview" && overview && (
          <OverviewPanel
            overview={overview}
            period={period}
            setPeriod={setPeriod}
            chartMax={chartMax}
          />
        )}

        {tab === "submissions" && (
          <DataPanel
            kind="submissions"
            rows={rows}
            loading={loading}
            scoreType={scoreType}
            setScoreType={setScoreType}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            reload={() => loadRows("submissions")}
          />
        )}

        {tab === "scholarships" && (
          <DataPanel
            kind="scholarships"
            rows={rows}
            loading={loading}
            scoreType={scoreType}
            setScoreType={setScoreType}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            reload={() => loadRows("scholarships")}
          />
        )}

        {tab === "donors" && (
          <DataPanel
            kind="donors"
            rows={rows}
            loading={loading}
            scoreType={scoreType}
            setScoreType={setScoreType}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            reload={() => loadRows("donors")}
            updateDonor={updateDonor}
          />
        )}

        {tab === "audit" && (
          <AuditPanel
            rows={rows}
            loading={loading}
            reload={() => loadRows("audit")}
          />
        )}

        {tab === "system" && overview && (
          <SystemPanel
            overview={overview}
            loading={loading}
            toggleScholarship={toggleScholarship}
          />
        )}
      </main>
    </div>
  );
}

function OverviewPanel({
  overview,
  period,
  setPeriod,
  chartMax,
}: {
  overview: Overview;
  period: number;
  setPeriod: (value: number) => void;
  chartMax: number;
}) {
  const conversion = overview.totals.analyzerStarts
    ? Math.round(
        (overview.totals.analyzerCompletions /
          overview.totals.analyzerStarts) *
          100,
      )
    : 0;
  const cards = [
    ["Sayfa görüntüleme", overview.totals.pageViews, Eye],
    ["Yaklaşık tekil oturum", overview.totals.uniqueSessions, Users],
    ["Tamamlanan analiz", overview.totals.analyzerCompletions, Activity],
    ["Analiz dönüşümü", `%${conversion}`, BarChart3],
    ["Kaydedilen sonuç", overview.allTime.submissions, Database],
    ["Bekleyen destekçi", overview.allTime.pendingDonors, HeartHandshake],
  ] as const;
  const rankBandOrder = [
    "1-10K",
    "10K-25K",
    "25K-50K",
    "50K-100K",
    "100K-250K",
    "250K-500K",
    "500K+",
  ];
  const rankBands = rankBandOrder.map((band) => ({
    band,
    count: Object.values(overview.submissionStatistics.scores).reduce(
      (sum, score) => sum + Number(score.rankBands[band] ?? 0),
      0,
    ),
  }));
  const rankBandMax = Math.max(1, ...rankBands.map((item) => item.count));
  const preferenceRows = [
    ...Object.entries(overview.submissionStatistics.interest.degree).map(
      ([label, count]) => ({ group: "Program düzeyi", label, count }),
    ),
    ...Object.entries(overview.submissionStatistics.interest.funding).map(
      ([label, count]) => ({ group: "Ücret tercihi", label, count }),
    ),
    ...Object.entries(
      overview.submissionStatistics.interest.universityTypes,
    ).map(([label, count]) => ({
      group: "Üniversite türü",
      label,
      count,
    })),
  ].sort((a, b) => b.count - a.count);

  return (
    <>
      <div className="admin-toolbar">
        <label>
          Dönem
          <select
            value={period}
            onChange={(event) => {
              setPeriod(Number(event.target.value));
            }}
          >
            <option value={7}>Son 7 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
          </select>
        </label>
        <span>
          Bot imzası taşıyan istekler hariç, çerezsiz yaklaşık oturum ölçümü
        </span>
      </div>

      <section className="metric-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <span>
              <Icon size={18} />
            </span>
            <small>{label}</small>
            <strong>{typeof value === "number" ? formatNumber(value) : value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-grid-two">
        <article className="admin-card chart-card">
          <div className="admin-card-head">
            <div>
              <span className="section-kicker">Trafik</span>
              <h2>Günlük görüntüleme</h2>
            </div>
          </div>
          <div className="mini-chart" aria-label="Günlük sayfa görüntüleme grafiği">
            {overview.daily.length ? (
              overview.daily.map((day) => (
                <div className="chart-column" key={day.day}>
                  <span
                    style={{
                      height: `${Math.max(
                        4,
                        (Number(day.pageViews ?? 0) / chartMax) * 100,
                      )}%`,
                    }}
                    title={`${day.day}: ${formatNumber(day.pageViews)}`}
                  />
                  <small>{day.day.slice(5)}</small>
                </div>
              ))
            ) : (
              <p className="empty-state">Henüz trafik verisi yok.</p>
            )}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <span className="section-kicker">Coğrafya</span>
              <h2>En çok görülen şehirler</h2>
            </div>
          </div>
          <div className="city-list">
            {overview.cities.length ? (
              overview.cities.slice(0, 8).map((item, index) => (
                <div key={item.city}>
                  <span>{index + 1}</span>
                  <strong>{item.city}</strong>
                  <small>{formatNumber(item.count)} olay</small>
                </div>
              ))
            ) : (
              <p className="empty-state">Şehir verisi henüz oluşmadı.</p>
            )}
          </div>
        </article>
      </section>

      <section className="admin-card submission-stats-card">
        <div className="admin-card-head">
          <div>
            <span className="section-kicker">Onaylı araştırma kayıtları</span>
            <h2>Puan türü ortalamaları</h2>
          </div>
          <small>
            {overview.submissionStatistics.isSample
              ? `${formatNumber(overview.submissionStatistics.sampleSize)} / ${formatNumber(overview.submissionStatistics.totalAvailable)} kayıt incelendi`
              : `${formatNumber(overview.submissionStatistics.sampleSize)} kayıt`}
          </small>
        </div>
        <div className="score-stat-grid">
          {Object.entries(overview.submissionStatistics.scores).map(
            ([type, score]) => (
              <article key={type}>
                <span>{type}</span>
                <strong>{formatNumber(score.count)}</strong>
                <small>kayıt</small>
                <dl>
                  <div>
                    <dt>Ort. sıra</dt>
                    <dd>
                      {score.averageRank
                        ? formatNumber(score.averageRank)
                        : "Yok"}
                    </dd>
                  </div>
                  <div>
                    <dt>Ort. puan</dt>
                    <dd>
                      {score.averagePlacementScore?.toLocaleString("tr-TR", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      }) ?? "Yok"}
                    </dd>
                  </div>
                </dl>
              </article>
            ),
          )}
        </div>
        <p className="admin-footnote">
          Bu istatistikler yalnızca anonim araştırma kaydına açıkça onay veren
          adayların sonuçlarından hesaplanır.
        </p>
      </section>

      <section className="admin-grid-two stats-detail-grid">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <span className="section-kicker">İlgi yoğunluğu</span>
              <h2>Sıralama dilimleri</h2>
            </div>
          </div>
          <div className="rank-band-list">
            {rankBands.map((item) => (
              <div key={item.band}>
                <strong>{item.band}</strong>
                <span>
                  <i
                    style={{
                      width: `${Math.max(2, (item.count / rankBandMax) * 100)}%`,
                    }}
                  />
                </span>
                <small>{formatNumber(item.count)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <span className="section-kicker">Tercih davranışı</span>
              <h2>En çok seçilen filtreler</h2>
            </div>
          </div>
          <div className="preference-stat-list">
            {preferenceRows.length ? (
              preferenceRows.slice(0, 10).map((item) => (
                <div key={`${item.group}-${item.label}`}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.group}</small>
                  </span>
                  <b>{formatNumber(item.count)}</b>
                </div>
              ))
            ) : (
              <p className="empty-state">Henüz onaylı tercih kaydı yok.</p>
            )}
          </div>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <span className="section-kicker">Akış</span>
            <h2>Son önemli olaylar</h2>
          </div>
        </div>
        <div className="activity-list">
          {overview.recentEvents.length ? (
            overview.recentEvents.map((event) => (
              <div key={String(event.id)}>
                <span className="activity-dot" />
                <div>
                  <strong>{String(event.event ?? "olay")}</strong>
                  <small>
                    {String(event.city ?? "Bilinmiyor")} ·{" "}
                    {formatDate(event.createdAt)}
                  </small>
                </div>
                <small>{String(event.path ?? "/")}</small>
              </div>
            ))
          ) : (
            <p className="empty-state">Henüz önemli olay kaydı yok.</p>
          )}
        </div>
      </section>
    </>
  );
}

function DataPanel({
  kind,
  rows,
  loading,
  scoreType,
  setScoreType,
  statusFilter,
  setStatusFilter,
  reload,
  updateDonor,
}: {
  kind: "submissions" | "scholarships" | "donors";
  rows: JsonRecord[];
  loading: boolean;
  scoreType: string;
  setScoreType: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  reload: () => void;
  updateDonor?: (id: string, status: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [minRank, setMinRank] = useState("");
  const [maxRank, setMaxRank] = useState("");
  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    const minimum = Number(minRank) || 0;
    const maximum = Number(maxRank) || 5_000_000;
    return rows.filter((row) => {
      if (
        normalizedQuery &&
        !JSON.stringify(row)
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery)
      ) {
        return false;
      }
      if (kind === "donors" || (!minRank && !maxRank)) return true;
      const scores = (row.scores as Record<string, { rank?: number }>) ?? {};
      return Object.values(scores).some(
        (score) =>
          Number(score.rank) >= minimum && Number(score.rank) <= maximum,
      );
    });
  }, [kind, maxRank, minRank, query, rows]);

  return (
    <section className="admin-card data-card">
      <div className="admin-toolbar">
        <label className="admin-search-field">
          Ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              kind === "donors"
                ? "Ad, e-posta veya kurum"
                : "Ad, e-posta, şehir veya program"
            }
          />
        </label>
        {kind !== "donors" && (
          <label>
            Puan türü
            <select
              value={scoreType}
              onChange={(event) => setScoreType(event.target.value)}
            >
              <option value="">Tümü</option>
              {["TYT", "SAY", "EA", "SÖZ", "DİL"].map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind !== "donors" && (
          <>
            <label>
              En iyi sıra
              <input
                type="number"
                min={1}
                max={5_000_000}
                value={minRank}
                onChange={(event) => setMinRank(event.target.value)}
                placeholder="1"
              />
            </label>
            <label>
              En düşük sıra
              <input
                type="number"
                min={1}
                max={5_000_000}
                value={maxRank}
                onChange={(event) => setMaxRank(event.target.value)}
                placeholder="5.000.000"
              />
            </label>
          </>
        )}
        {kind !== "submissions" && (
          <label>
            Durum
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Tümü</option>
              {(kind === "donors"
                ? ["pending_review", "approved", "rejected", "paused"]
                : ["pending_email_verification", "active"]
              ).map((status) => (
                <option value={status} key={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className="secondary-button" type="button" onClick={reload}>
          <Search size={16} />
          Filtrele
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={!visibleRows.length}
          onClick={() =>
            downloadCsv(
              `tercihce-${kind}-${new Date().toISOString().slice(0, 10)}.csv`,
              visibleRows,
            )
          }
        >
          <Download size={16} />
          CSV indir
        </button>
      </div>

      {loading && !rows.length ? (
        <div className="admin-loading">
          <LoaderCircle className="spin" size={22} />
          Kayıtlar yükleniyor
        </div>
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tarih</th>
                {kind === "donors" ? (
                  <>
                    <th>Başvuran</th>
                    <th>Destek</th>
                    <th>Durum</th>
                    <th>İşlem</th>
                  </>
                ) : (
                  <>
                    {kind === "scholarships" && <th>Aday</th>}
                    <th>Sıralamalar</th>
                    <th>Tercih özeti</th>
                    {kind === "scholarships" && <th>Durum</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={String(row.id)}>
                  <td>
                    <small>{formatDate(row.createdAt)}</small>
                  </td>
                  {kind === "donors" ? (
                    <>
                      <td>
                        <strong>{String(row.name ?? "")}</strong>
                        <small>{String(row.organizationName ?? row.email ?? "")}</small>
                      </td>
                      <td>
                        {Array.isArray(row.supportTypes)
                          ? row.supportTypes.join(", ")
                          : ""}
                        <small>
                          {formatNumber(row.estimatedStudents)} öğrenci
                        </small>
                        {typeof row.note === "string" && row.note && (
                          <small>{row.note}</small>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${String(row.status)}`}>
                          {STATUS_LABELS[String(row.status)] ?? String(row.status)}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            title="Onayla"
                            onClick={() =>
                              updateDonor?.(String(row.id), "approved")
                            }
                          >
                            <Check size={15} />
                          </button>
                          <button
                            type="button"
                            title="Duraklat"
                            onClick={() =>
                              updateDonor?.(String(row.id), "paused")
                            }
                          >
                            <CircleOff size={15} />
                          </button>
                          <button
                            type="button"
                            title="Reddet"
                            onClick={() =>
                              updateDonor?.(String(row.id), "rejected")
                            }
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {kind === "scholarships" && (
                        <td>
                          <strong>{String(row.name ?? "İsimsiz")}</strong>
                          <small>{String(row.email ?? "")}</small>
                        </td>
                      )}
                      <td>{scoreSummary(row.scores)}</td>
                      <td>
                        <small>
                          {kind === "submissions"
                            ? JSON.stringify(row.interest ?? {})
                            : JSON.stringify(row.preferences ?? {})}
                        </small>
                      </td>
                      {kind === "scholarships" && (
                        <td>
                          <span className={`status-pill ${String(row.status)}`}>
                            {STATUS_LABELS[String(row.status)] ?? String(row.status)}
                          </span>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleRows.length && (
            <p className="empty-state">Bu filtrede kayıt bulunamadı.</p>
          )}
        </div>
      )}
      <p className="admin-footnote">
        İlk sürüm performans için en güncel 250 kaydı tarar. CSV dışa aktarma
        yalnızca yönetici oturumunda çalışır.
      </p>
    </section>
  );
}

function AuditPanel({
  rows,
  loading,
  reload,
}: {
  rows: JsonRecord[];
  loading: boolean;
  reload: () => void;
}) {
  const [query, setQuery] = useState("");
  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return rows;
    return rows.filter((row) =>
      JSON.stringify(row).toLocaleLowerCase("tr-TR").includes(normalized),
    );
  }, [query, rows]);

  return (
    <section className="admin-card data-card">
      <div className="admin-toolbar">
        <label className="admin-search-field">
          Ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="İşlem, yönetici veya hedef"
          />
        </label>
        <button className="secondary-button" type="button" onClick={reload}>
          <RefreshCw size={16} />
          Yenile
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={!visibleRows.length}
          onClick={() =>
            downloadCsv(
              `tercihce-islem-gunlugu-${new Date().toISOString().slice(0, 10)}.csv`,
              visibleRows,
            )
          }
        >
          <Download size={16} />
          CSV indir
        </button>
      </div>

      {loading && !rows.length ? (
        <div className="admin-loading">
          <LoaderCircle className="spin" size={22} />
          İşlem günlüğü yükleniyor
        </div>
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Yönetici</th>
                <th>İşlem</th>
                <th>Hedef</th>
                <th>Değişiklik</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={String(row.id)}>
                  <td>
                    <small>{formatDate(row.createdAt)}</small>
                  </td>
                  <td>{String(row.actorEmail ?? "")}</td>
                  <td>
                    <strong>{String(row.action ?? "")}</strong>
                  </td>
                  <td>
                    {String(row.targetType ?? "")}
                    <small>{String(row.targetId ?? "")}</small>
                  </td>
                  <td>
                    <small>
                      {row.afterStatus
                        ? `${String(row.beforeStatus ?? "yok")} → ${String(row.afterStatus)}`
                        : `${row.beforeEnabled === true ? "açık" : "kapalı"} → ${row.afterEnabled === true ? "açık" : "kapalı"}`}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleRows.length && (
            <p className="empty-state">İşlem günlüğü kaydı bulunamadı.</p>
          )}
        </div>
      )}
      <p className="admin-footnote">
        Destekçi durumları ve kritik sistem anahtarları kim, ne zaman, neyi
        değiştirdi bilgisiyle kaydedilir.
      </p>
    </section>
  );
}

function SystemPanel({
  overview,
  loading,
  toggleScholarship,
}: {
  overview: Overview;
  loading: boolean;
  toggleScholarship: (enabled: boolean) => void;
}) {
  const enabled = overview.config.scholarshipApplicationsEnabled;
  return (
    <section className="system-grid">
      <article className="admin-card system-card">
        <span className={`system-status ${enabled ? "online" : "offline"}`}>
          {enabled ? <Check size={16} /> : <CircleOff size={16} />}
          {enabled ? "Başvurular açık" : "Başvurular kapalı"}
        </span>
        <h2>Burs adayı toplama</h2>
        <p>
          Kapalıyken e-posta ve burs profili sunucuya gönderilmez. Firestore
          güvenlik kuralı, arayüzden bağımsız olarak yazmayı da reddeder.
        </p>
        <button
          className={enabled ? "danger-button" : "primary-button"}
          type="button"
          disabled={loading || (!overview.config.legalNoticeReady && !enabled)}
          onClick={() => toggleScholarship(!enabled)}
        >
          {enabled ? "Başvuruları kapat" : "Başvuruları aç"}
        </button>
        {!overview.config.legalNoticeReady && (
          <small className="system-warning">
            Önce veri sorumlusu adı ve iletişim e-postası tanımlanmalı.
          </small>
        )}
      </article>

      <article className="admin-card system-card">
        <span className="system-status online">
          <ShieldCheck size={16} />
          Korumalı
        </span>
        <h2>Yönetici erişimi</h2>
        <p>
          Erişim, Firebase tarafından doğrulanmış Google hesabı ve sunucu
          tarafındaki ADMIN_EMAILS izin listesi ile sınırlandırılır.
        </p>
        <small>
          Firestore kişisel koleksiyonları istemci tarafında hiçbir kullanıcıya
          okunabilir değildir.
        </small>
      </article>

      <article className="admin-card system-card">
        <span className="system-status">
          <Activity size={16} />
          Analitik
        </span>
        <h2>Ölçüm sınırları</h2>
        <p>
          Yaklaşık tekil oturum, sekme oturumunda üretilen rastgele kimliğin
          günlük HMAC özetiyle hesaplanır. IP adresi ve cihaz parmak izi
          saklanmaz.
        </p>
        <small>
          Bilinen bot imzaları ve Do Not Track tercihi olan tarayıcılar
          sayılmaz. Gelişmiş botlar yine de ölçüme karışabilir.
        </small>
      </article>
    </section>
  );
}
