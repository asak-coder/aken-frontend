import {
  CONTACT_EMAIL,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_URL,
} from "@/lib/contact";
import type { FaqItem } from "@/lib/services/service-types";
import type { ServiceSlug } from "@/lib/services/service-types";

const SITE_URL = "https://aken.firm.in";
const ORG_ID = `${SITE_URL}/#organization`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

/**
 * Service areas expressed as structured data.
 *
 * These describe where A K ENGINEERING states it serves. The registered
 * address of A K ENGINEERING is at Hirakud, Sambalpur, Odisha, and it operates
 * a branch office at Bhubaneswar, Odisha. Execution covers Odisha and
 * pan-India. No street address, additional branch or service location is
 * invented here.
 */
const AREA_SERVED = [
  { "@type": "City", name: "Sambalpur" },
  { "@type": "City", name: "Bhubaneswar" },
  { "@type": "AdministrativeArea", name: "Odisha" },
  { "@type": "Country", name: "India" },
];

const COUNTRY_SERVED = { "@type": "Country", name: "India" };

type ServiceNode = {
  slug: ServiceSlug;
  id: string;
  url: string;
  name: string;
  description: string;
};

const SERVICE_NODES: ServiceNode[] = [
  {
    slug: "peb",
    id: `${SITE_URL}/services/peb`,
    url: `${SITE_URL}/services/peb`,
    name: "Pre-Engineered Buildings (PEB)",
    description:
      "Pre-engineered building execution for industrial warehouses, factory sheds and plant buildings, including structural fabrication, erection, roofing and cladding.",
  },
  {
    slug: "structural-steel-fabrication",
    id: `${SITE_URL}/services/structural-steel-fabrication`,
    url: `${SITE_URL}/services/structural-steel-fabrication`,
    name: "Structural Steel Fabrication",
    description:
      "Industrial structural steel fabrication — beams, columns, trusses, bracings, platforms and built-up sections, executed with fit-up and dimensional control.",
  },
  {
    slug: "structural-steel-erection",
    id: `${SITE_URL}/services/structural-steel-erection`,
    url: `${SITE_URL}/services/structural-steel-erection`,
    name: "Structural Steel Erection",
    description:
      "Structural steel erection with sequence planning, crane and lifting plans, alignment checks and controlled bolting for industrial structures.",
  },
  {
    slug: "roofing-wall-cladding",
    id: `${SITE_URL}/services/roofing-wall-cladding`,
    url: `${SITE_URL}/services/roofing-wall-cladding`,
    name: "Industrial Roofing & Wall Cladding",
    description:
      "Industrial roofing, sheeting and wall cladding installation, including insulated panel systems, flashing and rainwater detailing.",
  },
  {
    slug: "industrial-maintenance-shutdown",
    id: `${SITE_URL}/services/industrial-maintenance-shutdown`,
    url: `${SITE_URL}/services/industrial-maintenance-shutdown`,
    name: "Industrial Maintenance & Shutdown Services",
    description:
      "Shutdown and maintenance execution for operating plants — structural modification, replacement, repair and dismantling works within planned outage windows.",
  },
  {
    slug: "mechanical-equipment-erection",
    id: `${SITE_URL}/services/mechanical-equipment-erection`,
    url: `${SITE_URL}/services/mechanical-equipment-erection`,
    name: "Mechanical Equipment Erection & Installation",
    description:
      "Fabrication and erection of equipment support structures for ducts, pipelines, conveyors, tanks and process equipment, with alignment and interface coordination.",
  },
  {
    slug: "heavy-fabrication",
    id: `${SITE_URL}/services/heavy-fabrication`,
    url: `${SITE_URL}/services/heavy-fabrication`,
    name: "Heavy Fabrication & Custom Engineered Steel Solutions",
    description:
      "Custom and heavy steel fabrication for industrial modifications — supports, brackets, housings, access structures and mezzanine floors.",
  },
];

export function getStructuredDataGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "A K ENGINEERING",
        alternateName: "AKEN",
        url: SITE_URL,
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE_E164,
        brand: {
          "@type": "Brand",
          name: "AKEN",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "Sales",
            telephone: CONTACT_PHONE_E164,
            email: CONTACT_EMAIL,
            areaServed: "IN",
            availableLanguage: ["English", "Hindi"],
          },
        ],
      },
      {
        "@type": ["LocalBusiness", "GeneralContractor"],
        "@id": LOCAL_BUSINESS_ID,
        name: "A K ENGINEERING",
        alternateName: "AKEN",
        url: SITE_URL,
        telephone: CONTACT_PHONE_E164,
        email: CONTACT_EMAIL,
        priceRange: "$$",
        sameAs: [CONTACT_WHATSAPP_URL],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sambalpur",
          addressRegion: "Odisha",
          addressCountry: "IN",
        },
        areaServed: AREA_SERVED,
        makesOffer: SERVICE_NODES.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@id": service.id,
          },
        })),
      },
      ...SERVICE_NODES.map((service) => ({
        "@type": "Service",
        "@id": service.id,
        name: service.name,
        description: service.description,
        url: service.url,
        provider: {
          "@id": ORG_ID,
        },
        areaServed: AREA_SERVED,
        serviceType: service.name,
      })),
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "AKEN",
        publisher: {
          "@id": ORG_ID,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#homepage`,
        url: SITE_URL,
        name: "AKEN | A K ENGINEERING | Industrial Engineering & Steel Construction",
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        about: {
          "@id": ORG_ID,
        },
      },
    ],
  };
}

export function getStructuredDataJson() {
  return JSON.stringify(getStructuredDataGraph());
}

export function getServiceStructuredDataJson() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": getStructuredDataGraph()["@graph"].filter(
      (item: { "@type": string | string[] }) => {
        const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        return (
          types.includes("Organization") ||
          types.includes("LocalBusiness") ||
          types.includes("Service")
        );
      },
    ),
  });
}

export type BreadcrumbEntry = {
  label: string;
  path: string;
};

export function getBreadcrumbJsonLd(entries: BreadcrumbEntry[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.label,
      item: `${SITE_URL}${entry.path === "/" ? "" : entry.path}`,
    })),
  };
}

export function getFaqPageJsonLd(faqs: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Structured data for a single service landing page: the service entity, its
 * breadcrumb trail and its FAQ set. Only content published on that page is
 * described.
 */
export function getServicePageStructuredDataJson(service: {
  slug: ServiceSlug;
  path: string;
  h1: string;
  metaDescription: string;
  navLabel: string;
  faqs: FaqItem[];
}) {
  const node = SERVICE_NODES.find((item) => item.slug === service.slug);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "A K ENGINEERING",
      alternateName: "AKEN",
      url: SITE_URL,
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE_E164,
    },
    {
      "@type": ["LocalBusiness", "GeneralContractor"],
      "@id": LOCAL_BUSINESS_ID,
      name: "A K ENGINEERING",
      alternateName: "AKEN",
      url: SITE_URL,
      telephone: CONTACT_PHONE_E164,
      email: CONTACT_EMAIL,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sambalpur",
        addressRegion: "Odisha",
        addressCountry: "IN",
      },
      areaServed: AREA_SERVED,
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}${service.path}`,
      name: node?.name ?? service.h1,
      description: service.metaDescription,
      url: `${SITE_URL}${service.path}`,
      provider: {
        "@id": ORG_ID,
      },
      areaServed: AREA_SERVED,
      serviceType: node?.name ?? service.h1,
    },
    getBreadcrumbJsonLd([
      { label: "Home", path: "/" },
      { label: "Services", path: "/services" },
      { label: service.navLabel, path: service.path },
    ]),
  ];

  if (service.faqs.length > 0) {
    graph.push(getFaqPageJsonLd(service.faqs));
  }

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  });
}

export const SCHEMA_SITE_URL = SITE_URL;
export const SCHEMA_AREA_SERVED = AREA_SERVED;
export const SCHEMA_COUNTRY_SERVED = COUNTRY_SERVED;
