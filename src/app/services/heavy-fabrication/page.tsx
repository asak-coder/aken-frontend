import type { Metadata } from "next";
import ServiceLandingPage from "@/components/ServiceLandingPage";
import { SCHEMA_SITE_URL, getServicePageStructuredDataJson } from "@/lib/schema";
import { getServiceContent } from "@/lib/services/service-data";

const service = getServiceContent("heavy-fabrication");
const canonicalUrl = `${SCHEMA_SITE_URL}${service.path}`;

export const metadata: Metadata = {
  title: service.title,
  description: service.metaDescription,
  alternates: {
    canonical: service.path,
  },
  openGraph: {
    type: "website",
    url: canonicalUrl,
    title: service.openGraphTitle,
    description: service.openGraphDescription,
    siteName: "AKEN",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: service.openGraphTitle,
    description: service.openGraphDescription,
  },
};

export default function HeavyFabricationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: getServicePageStructuredDataJson(service) }}
      />
      <ServiceLandingPage service={service} />
    </>
  );
}
