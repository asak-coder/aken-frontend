import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PEB Budgetary Estimator | AKEN – A K ENGINEERING",
  description:
    "Share your industrial shed or warehouse parameters to receive a budgetary PEB estimate. A K ENGINEERING, trading as AKEN, executes PEB, structural steel fabrication, erection, roofing and cladding.",
  alternates: {
    canonical: "/capabilities-estimation",
  },
  openGraph: {
    type: "website",
    url: "https://aken.firm.in/capabilities-estimation",
    title: "PEB Budgetary Estimator | AKEN",
    description:
      "Estimate a budgetary range for your industrial shed or warehouse, then request an engineer-verified quotation from A K ENGINEERING.",
    siteName: "AKEN",
    locale: "en_IN",
  },
};

export default function CapabilitiesEstimationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
