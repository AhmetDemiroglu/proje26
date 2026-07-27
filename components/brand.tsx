/**
 * Tercihçe marka işareti: lime karo içinde, onay işaretinin uzun kolu
 * yukarı-sağa bakan bir oka dönüşür — "doğru tercih, yukarı taşır".
 * Favicon (public/favicon.svg) bu çizimin döndürülmüş kopyasıdır;
 * burada değişiklik yapılırsa favicon da güncellenmelidir.
 */
export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2.5"
        y="2.5"
        width="43"
        height="43"
        rx="13"
        fill="#c9f36d"
        stroke="#13261f"
        strokeWidth="3"
      />
      <path
        d="M12.5 27 L20.5 34 L35 16.5"
        fill="none"
        stroke="#13261f"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26.5 16.5 H35 V25"
        fill="none"
        stroke="#13261f"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
