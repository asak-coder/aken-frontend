/**
 * Service landing page content model.
 *
 * Every field here is sourced from AKEN / A K ENGINEERING content that is
 * already published on /services or /about. Nothing in this model invents
 * machinery, certifications, clients, tonnage, dates or statistics.
 */

export type ServiceSlug =
  | "peb"
  | "structural-steel-fabrication"
  | "structural-steel-erection"
  | "roofing-wall-cladding"
  | "industrial-maintenance-shutdown"
  | "mechanical-equipment-erection"
  | "heavy-fabrication";

export type ProcessStep = {
  title: string;
  detail: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type WhyAkenItem = {
  title: string;
  text: string;
};

/**
 * A representative industrial image. These are NEVER an AKEN project
 * photograph and must always be rendered together with the
 * RepresentativeImageryNotice.
 */
export type RepresentativeImage = {
  src: string;
  alt: string;
  caption: string;
};

export type ServiceContent = {
  slug: ServiceSlug;
  /** Canonical path, e.g. "/services/peb". */
  path: string;
  /** Short label used in navigation and internal links. */
  navLabel: string;

  /** <title> — unique per page. */
  title: string;
  /** Meta description — unique per page. */
  metaDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;

  /** Visible page H1 — unique per page. */
  h1: string;
  /** Strong engineering-focused statement shown under the H1. */
  heroStatement: string;
  heroIntro: string;

  overviewHeadline: string;
  overviewParagraphs: string[];

  scopeHeadline: string;
  scopeItems: string[];

  processHeadline: string;
  processNote: string;
  processSteps: ProcessStep[];

  applicationsHeadline: string;
  applications: string[];

  materialsHeadline: string;
  materialsNote: string;
  materials: string[];

  whyAkenHeadline: string;
  whyAken: WhyAkenItem[];

  faqs: FaqItem[];

  representativeImages: RepresentativeImage[];

  relatedServiceSlugs: ServiceSlug[];
};

export const SERVICE_SLUGS: ServiceSlug[] = [
  "peb",
  "structural-steel-fabrication",
  "structural-steel-erection",
  "roofing-wall-cladding",
  "industrial-maintenance-shutdown",
  "mechanical-equipment-erection",
  "heavy-fabrication",
];

export type ServiceLandingSummary = {
  slug: ServiceSlug;
  path: string;
  navLabel: string;
  h1: string;
};
