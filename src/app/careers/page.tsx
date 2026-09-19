import type { Metadata } from "next";
import CareersClient from "./CareersClient";

export const metadata: Metadata = {
  title: "Careers & Talent Portal | AKEN – A K ENGINEERING",
  description:
    "Join AKEN, a brand of A K ENGINEERING. Apply for engineering, supervision, safety, welding and fitting, and administration roles in industrial fabrication and erection works.",
  alternates: {
    canonical: "/careers",
  },
  openGraph: {
    title: "Careers & Talent Portal | AKEN – A K ENGINEERING",
    description:
      "Build the future of industrial infrastructure with AKEN. Submit your bio-data for engineering, supervision, safety and fabrication roles.",
    type: "website",
    url: "https://aken.firm.in/careers",
    siteName: "AKEN",
    locale: "en_IN",
  },
};

export default function CareersPage() {
  return <CareersClient />;
}
