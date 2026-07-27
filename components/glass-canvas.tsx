/**
 * "Liquid glass" başlık camı — gerçek kırılma.
 *
 * Canvas/WebGL arkadaki sayfa piksellerini örnekleyemez; bu yüzden eski
 * yaklaşım yalnızca bulanıklık gibi görünüyordu. Gerçek kırılma için
 * `backdrop-filter: url(#…)` ile SVG feDisplacementMap kullanılır:
 * tarayıcı, kapsülün ARKASINDAKİ pikselleri gürültü haritasına göre
 * büker. Katmanlar (globals.css):
 *
 * - .glass-base    → her tarayıcıda garanti buzlu cam (blur + doygunluk).
 * - .glass-refract → #glass-lens ile içeriği büker; R/G/B kanalları farklı
 *                    kuvvetle yer değiştirir (kromatik sapma — gerçek cam
 *                    kenarındaki renk saçaklanması).
 * - .glass-edge    → kapsül çeperinde #glass-lens-edge ile çok daha sert
 *                    bükülme; maske ile yalnız kenar çerçevesinde görünür
 *                    (kalın cam kenarının mercek etkisi).
 * - .glass-shine   → speküler parlama: üst ışık çizgisi, alt gölge, sheen.
 *
 * `backdrop-filter: url()` yalnızca Chromium'da işlenir; diğer tarayıcılar
 * .glass-base'in yoğun bulanıklığına düşer (CSS @supports bloğu yönetir).
 * Kırılma statiktir: içerik kapsülün altından kayarken bükülme kendiliğinden
 * "akar" — sürekli animasyon maliyeti yoktur.
 */

const CHANNEL_R = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
const CHANNEL_G = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0";
const CHANNEL_B = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0";

function LensFilter({
  id,
  frequency,
  softness,
  scale,
  aberration,
}: {
  id: string;
  frequency: string;
  softness: number;
  scale: number;
  aberration: number;
}) {
  return (
    <filter
      id={id}
      x="-40%"
      y="-40%"
      width="180%"
      height="180%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency={frequency}
        numOctaves={2}
        seed={92}
        result="noise"
      />
      {/* Gürültüyü yumuşatmak çakıllı titremeyi akışkan bükülmeye çevirir */}
      <feGaussianBlur in="noise" stdDeviation={softness} result="soft" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="soft"
        scale={scale - aberration}
        xChannelSelector="R"
        yChannelSelector="G"
        result="dispR"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="soft"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="dispG"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="soft"
        scale={scale + aberration}
        xChannelSelector="R"
        yChannelSelector="G"
        result="dispB"
      />
      {/* Kanal ayrıştırma + screen birleştirme = kromatik sapma */}
      <feColorMatrix in="dispR" type="matrix" values={CHANNEL_R} result="chR" />
      <feColorMatrix in="dispG" type="matrix" values={CHANNEL_G} result="chG" />
      <feColorMatrix in="dispB" type="matrix" values={CHANNEL_B} result="chB" />
      <feBlend in="chR" in2="chG" mode="screen" result="chRG" />
      <feBlend in="chRG" in2="chB" mode="screen" />
    </filter>
  );
}

export function GlassCanvas() {
  return (
    <span className="glass-stack" aria-hidden="true">
      <svg className="glass-defs" focusable="false">
        <defs>
          <LensFilter
            id="glass-lens"
            frequency="0.009 0.022"
            softness={7}
            scale={26}
            aberration={5}
          />
          <LensFilter
            id="glass-lens-edge"
            frequency="0.014 0.036"
            softness={5}
            scale={70}
            aberration={10}
          />
        </defs>
      </svg>
      <span className="glass-base" />
      <span className="glass-refract" />
      <span className="glass-edge" />
      <span className="glass-shine" />
    </span>
  );
}
