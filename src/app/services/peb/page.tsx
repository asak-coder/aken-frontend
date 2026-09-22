import type { Metadata } from "next";
import ServiceLandingPage from "@/components/ServiceLandingPage";
import { SCHEMA_SITE_URL, getServicePageStructuredDataJson } from "@/lib/schema";
import { getServiceContent } from "@/lib/services/service-data";

const service = getServiceContent("peb");
const canonicalUrl = `${SCHEMA_SITE_URL}${service.path}`;

/**
 * Page-level supporting image for /services/peb.
 *
 * This is representative industrial imagery illustrating PEB primary frame
 * erection. It is NOT a photograph of an AKEN project, which is why the page
 * publishes it inside the "Representative imagery" block together with the
 * explicit notice, and never as an AKEN project photograph.
 */
const PEB_SUPPORTING_IMAGE_SRC = "/projects/peb-primary-frame-erection-crane-16x9.jpg";
const PEB_SUPPORTING_IMAGE_ALT =
  "Pre-engineered building primary steel frame being erected by a mobile crane, with tapered built-up rafters, roof purlins, wall girts and cross bracing at an Indian industrial project site";
const PEB_SUPPORTING_IMAGE_WIDTH = 1920;
const PEB_SUPPORTING_IMAGE_HEIGHT = 1080;

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
    images: [
      {
        url: PEB_SUPPORTING_IMAGE_SRC,
        width: PEB_SUPPORTING_IMAGE_WIDTH,
        height: PEB_SUPPORTING_IMAGE_HEIGHT,
        alt: PEB_SUPPORTING_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: service.openGraphTitle,
    description: service.openGraphDescription,
    images: [PEB_SUPPORTING_IMAGE_SRC],
  },
};

export default function PebServicePage() {
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
