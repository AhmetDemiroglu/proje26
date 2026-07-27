import type { Metadata } from "next";
import ScholarshipVerification from "../../components/scholarship-verification";

export const metadata: Metadata = {
  title: "Burs Profili E-posta Doğrulama",
  robots: { index: false, follow: false },
};

export default function ScholarshipVerificationPage() {
  return <ScholarshipVerification />;
}
