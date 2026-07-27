import type { Metadata } from "next";
import { DonorApplicationForm } from "@/components/donor-application-form";

export const metadata: Metadata = {
  title: "Destekçi Başvurusu",
  description:
    "Tercihçe burs ağına bireysel veya kurumsal destekçi olarak başvurun.",
};

export default function DonorApplicationPage() {
  return <DonorApplicationForm />;
}

