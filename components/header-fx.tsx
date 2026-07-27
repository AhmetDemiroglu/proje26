"use client";

import { useEffect, useRef } from "react";

/**
 * Site başlığına kaydırmaya bağlı davranış kazandıran görünmez yardımcı:
 *
 * - 12px'den sonra başlığa `.is-scrolled` ekler (yüzen cam kapsül görünümü).
 * - Render ettiği `.scroll-progress` çubuğunu sayfa ilerlemesiyle doldurur
 *   (transform tabanlı, layout tetiklemez).
 * - Sayfa içi bağlantılarda (`#...`) scrollspy: görünürdeki bölümün
 *   bağlantısına `.is-spy-active` ekler.
 *
 * `.site-header` içine yerleştirilmesi yeterli; hem ana sayfa hem içerik
 * sayfalarındaki başlıkta çalışır.
 */
export function HeaderFx() {
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const header = bar?.closest(".site-header");
    if (!bar || !header) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      header.classList.toggle("is-scrolled", window.scrollY > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (raf === 0) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    const links = Array.from(
      header.querySelectorAll<HTMLAnchorElement>('.desktop-nav a[href^="#"]'),
    );
    const sections = links
      .map((link) => {
        const href = link.getAttribute("href");
        return href ? document.getElementById(href.slice(1)) : null;
      })
      .filter((el): el is HTMLElement => el !== null);

    const spy =
      sections.length > 0 && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                for (const link of links) {
                  link.classList.toggle(
                    "is-spy-active",
                    link.getAttribute("href") === `#${entry.target.id}`,
                  );
                }
              }
            },
            { rootMargin: "-25% 0px -65% 0px" },
          )
        : null;
    if (spy) {
      for (const section of sections) spy.observe(section);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
      spy?.disconnect();
    };
  }, []);

  return (
    <span className="scroll-progress-track" aria-hidden="true">
      <span ref={barRef} className="scroll-progress" />
    </span>
  );
}
