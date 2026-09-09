import {
  CONTACT_EMAIL,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_URL,
} from "@/lib/contact";

const SITE_URL = "https://aken.firm.in";
const ORG_ID = `${SITE_URL}/#organization`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

const SERVICE_ITEMS = [
  {
    id: `${SITE_URL}/services#peb`,
    name: "Pre-Engineered Buildings (PEB)",
    description:
      "Efficient and durable PEB solutions for warehouses, industrial facilities and other large-span applications.",
  },
  {
    id: `${SITE_URL}/services#fabrication`,
    name: "Structural Steel Fabrication",
    description:
      "Precision fabrication of structural steel components with focus on dimensional accuracy and workmanship.",
  },
  {
    id: `${SITE_URL}/services#erection`,
    name: "Structural Steel Erection",
    description:
      "Professional site erection with emphasis on safety, alignment, lifting coordination and execution quality.",
  },
  {
    id: `${SITE_URL}/services#roofing`,
    name: "Roofing & Wall Cladding",
    description:
      "Industrial roofing and wall cladding solutions designed for durability, weather protection and long-term performance.",
  },
  {
    id: `${SITE_URL}/services#maintenance`,
    name: "Industrial Maintenance & Shutdown Services",
    description:
      "Planned maintenance, modification, strengthening and shutdown execution for industrial facilities.",
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
        areaServed: {
          "@type": "Country",
          name: "India",
        },
        makesOffer: SERVICE_ITEMS.map((service) => ({
          "@type": "Offer",
          itemOffered: {
            "@id": service.id,
          },
        })),
      },
      ...SERVICE_ITEMS.map((service) => ({
        "@type": "Service",
        "@id": service.id,
        name: service.name,
        description: service.description,
        provider: {
          "@id": ORG_ID,
        },
        areaServed: {
          "@type": "Country",
          name: "India",
        },
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
    "@graph": getStructuredDataGraph()["@graph"].filter((item: { "@type": string | string[] }) => {
      const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      return types.includes("Organization") || types.includes("LocalBusiness") || types.includes("Service");
    }),
  });
}
