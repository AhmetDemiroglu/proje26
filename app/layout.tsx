import type { Metadata } from "next";
import { headers } from "next/headers";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "tercihce.vercel.app";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: {
      default: "Tercihçe | 2026 YKS Tercih Rehberi",
      template: "%s | Tercihçe",
    },
    description:
      "Kimlik bilgisi vermeden 2026 YKS sonucunu değerlendir, 2025 taban sıralamalarına göre üniversite ve bölüm seçeneklerini keşfet.",
    keywords: [
      "YKS 2026",
      "üniversite tercih",
      "YKS sıralama",
      "taban puan",
      "tercih robotu",
    ],
    openGraph: {
      title: "Tercihçe | Sıralamanı gir, seçeneklerini gör",
      description:
        "Kimlik bilgisi zorunlu olmayan, ücretsiz ve veriye dayalı 2026 YKS tercih rehberi.",
      type: "website",
      locale: "tr_TR",
      images: [
        {
          url: "/og.png",
          width: 1731,
          height: 909,
          alt: "Tercihçe 2026 YKS tercih rehberi",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Tercihçe | 2026 YKS Tercih Rehberi",
      description:
        "Sıralamanı kimlik bilgisi vermeden değerlendir, seçeneklerini keşfet.",
      images: ["/og.png"],
    },
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        {children}
        <AnalyticsTracker />
      </body>
    </html>
  );
}
