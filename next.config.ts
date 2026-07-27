import type { NextConfig } from "next";

// Firebase kimlik işleyicisi varsayılan olarak <proje>.firebaseapp.com üzerinde
// çalışır. Uygulama farklı bir alan adındayken tarayıcılar üçüncü taraf
// depolamayı bölümlendirdiği için yönlendirmeli Google girişi oturumu geri
// veremez. İşleyiciyi kendi alan adımızdan yansıtıp akışı aynı origin'de
// tutuyoruz. Etkin olması için üretimde NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
// uygulamanın kendi alan adına ayarlanmalıdır.
const firebaseProjectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "yks-project-eeaa1";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${firebaseProjectId}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
