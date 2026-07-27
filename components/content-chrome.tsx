import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { GlassCanvas } from "@/components/glass-canvas";
import { HeaderFx } from "@/components/header-fx";

const NAV_LINKS = [
  { href: "/#nasil-calisir", label: "Nasıl çalışır?" },
  { href: "/#veri-kaynagi", label: "Veri kaynağı" },
  { href: "/destekci-basvuru", label: "Destekçi ol" },
  { href: "/gizlilik", label: "Gizlilik" },
];

export function ContentHeader({ current }: { current?: string }) {
  return (
    <header className="site-header content-header">
      <div className="site-header-inner">
        <GlassCanvas />
        <Link className="brand" href="/" aria-label="Tercihçe ana sayfa">
          <BrandMark />
          <span>tercihçe</span>
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="header-cta" href="/#analiz">
          Sonucumu değerlendir
          <ArrowRight size={17} />
        </Link>
        <HeaderFx />
      </div>
    </header>
  );
}

export function ContentFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <Link className="brand footer-brand" href="/">
            <BrandMark />
            <span>tercihçe</span>
          </Link>
          <p>YKS tercihlerine sakin, veriye dayalı ve ücretsiz bir başlangıç.</p>
        </div>
        <div className="footer-links">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <p className="disclaimer">
          Tercihçe, ÖSYM veya YÖK’e bağlı değildir. Son kararından önce güncel
          kılavuzu ve program koşullarını kontrol et.
        </p>
      </div>
    </footer>
  );
}
