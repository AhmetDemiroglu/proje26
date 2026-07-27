"use client";

import { useEffect, useRef, useState } from "react";

/**
 * iOS tarzı "liquid glass" — pürüzsüz mercek kırılması.
 *
 * Gürültü (feTurbulence) tabanlı yaklaşım dalgalı/buzlu cam üretir; iOS
 * camı ise pürüzsüz bir mercektir: merkez neredeyse düz, bükülme yalnızca
 * kapsülün yuvarlak kenarındaki dar bantta yoğunlaşır. Bu bileşen, kapsül
 * geometrisinden (rounded-rect SDF) piksel piksel bir yer değiştirme
 * haritası üretir: R kanalı yatay, G kanalı dikey itme; 128 = nötr.
 * Kenara yaklaştıkça itme, dışa bakan normal yönünde easing ile artar —
 * kalın camın rim kırılması. Harita feImage → feDisplacementMap ile
 * `backdrop-filter: url(#glass-lens)` içinde arkadaki gerçek pikselleri
 * büker (yalnız Chromium; diğerleri .glass-base bulanıklığına düşer).
 *
 * Kapsül boyutu değişince (breakpoint, is-scrolled yükseklik animasyonu)
 * harita rAF gazlamasıyla yeniden üretilir.
 */

/** Kenar bandı genişliği (CSS px) — bükülmenin eriştiği derinlik. */
const EDGE_BAND = 26;
/** Bükülmenin kenara toplanma eğrisi; büyüdükçe merkez daha düz kalır. */
const EDGE_POWER = 2.6;
/** feDisplacementMap scale — rim'deki azami kayma ≈ scale/2 px. */
const LENS_SCALE = 44;

function buildLensMap(width: number, height: number, radius: number) {
  const w = Math.max(2, Math.round(width));
  const h = Math.max(2, Math.round(height));
  const r = Math.max(1, Math.min(radius, Math.min(w, h) / 2));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const image = ctx.createImageData(w, h);
  const data = image.data;
  const hw = w / 2;
  const hh = h / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw;
      const py = y + 0.5 - hh;

      /* Yuvarlatılmış dikdörtgen SDF ve dışa bakan normal */
      const qx = Math.abs(px) - (hw - r);
      const qy = Math.abs(py) - (hh - r);
      let d: number;
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy);
        d = len - r;
        nx = (Math.sign(px) * qx) / len;
        ny = (Math.sign(py) * qy) / len;
      } else if (qx > qy) {
        d = qx - r;
        nx = Math.sign(px);
      } else {
        d = qy - r;
        ny = Math.sign(py);
      }

      /* Kenar bandında easing'li şiddet: merkez 0, rim'de 1 */
      const t = Math.min(1, Math.max(0, 1 + d / EDGE_BAND));
      const s = Math.pow(t, EDGE_POWER);

      const i = (y * w + x) * 4;
      data[i] = Math.round(128 + nx * s * 127);
      data[i + 1] = Math.round(128 + ny * s * 127);
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export function GlassCanvas() {
  const rootRef = useRef<HTMLSpanElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const feImage = feImageRef.current;
    const host = root?.parentElement;
    if (!root || !feImage || !host) return;

    let raf = 0;
    let lastKey = "";

    const regenerate = () => {
      raf = 0;
      const rect = host.getBoundingClientRect();
      const radius =
        parseFloat(window.getComputedStyle(host).borderTopLeftRadius) || 0;
      const key = `${Math.round(rect.width)}x${Math.round(rect.height)}r${radius}`;
      if (key === lastKey || rect.width < 2 || rect.height < 2) return;
      const url = buildLensMap(rect.width, rect.height, radius);
      if (!url) return;
      lastKey = key;
      feImage.setAttribute("href", url);
      setReady(true);
    };

    const schedule = () => {
      if (raf === 0) raf = window.requestAnimationFrame(regenerate);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    schedule();

    return () => {
      observer.disconnect();
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span ref={rootRef} className="glass-stack" aria-hidden="true">
      <svg className="glass-defs" focusable="false">
        <defs>
          <filter
            id="glass-lens"
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              ref={feImageRef}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={LENS_SCALE}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <span className="glass-base" />
      {/* Harita hazır olana dek filtre kapalı; yoksa boş harita tüm
          arka planı köşeye kaydırır. */}
      <span
        className="glass-refract"
        style={ready ? undefined : { backdropFilter: "none" }}
      />
      <span className="glass-shine" />
    </span>
  );
}
