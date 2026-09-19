import type { ServiceSlug } from "@/lib/services/service-types";

/**
 * Project and case-study data model.
 *
 * DESIGN RULES (see PROJECT_CONTENT_GUIDE.md):
 * - Every field except slug/name/verification is optional. Only fields that are
 *   actually known are filled in; absent fields are never rendered.
 * - A record is only published when its verification.status is "verified" and
 *   verification.approvedForPublication is true. Draft records are kept in the
 *   codebase but are never rendered or added to the sitemap.
 * - project photographs must carry `verified: true`, which may only be set for
 *   photographs supplied or confirmed by A K ENGINEERING. Representative or
 *   stock imagery must never appear in a project gallery.
 */

export type ProjectStage =
  | "planning"
  | "in-progress"
  | "completed"
  | "on-hold";

export type ProjectImageKind =
  | "overview"
  | "site"
  | "structural-steel"
  | "fabrication"
  | "erection"
  | "roofing-cladding"
  | "engineering-inspection"
  | "completed"
  | "detail";

export type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
  kind: ProjectImageKind;
  /**
   * Only `true` for photographs supplied by A K ENGINEERING or otherwise
   * verified as an actual AKEN project. Never set for representative imagery.
   */
  verified: boolean;
};

/** Which optional sections the client has approved for publication. */
export type ClientDisclosure = "authorised" | "withheld";

type ProjectFields = {
  slug: string;
  name: string;
  /** e.g. "Industrial warehouse", "Factory shed", "Equipment support structure". */
  projectType?: string;
  /** Only publish when disclosure is authorised. */
  client?: string;
  /** Only publish when verified and appropriate for publication. */
  location?: string;
  industry?: string;
  stage: ProjectStage;
  /** ISO date (YYYY-MM-DD). Only when verified. */
  completionDate?: string;

  scopeOfWork?: string[];

  overview?: string;
  /** What the customer required — 04 in the case-study structure. */
  requirement?: string;
  engineeringScope?: string[];
  executionScope?: string[];
  materialsSystems?: string[];
  keyChallenges?: string[];
  solution?: string;
  /** Only measurable, verified outcomes. Never estimates. */
  outcome?: string[];

  gallery?: ProjectImage[];
  servicesDelivered?: ServiceSlug[];

  /** Set when the client has authorised naming them. */
  clientDisclosure?: ClientDisclosure;
  /** Set when details are commercially sensitive. */
  confidential?: boolean;
};

export type VerifiedProject = ProjectFields & {
  verification: {
    status: "verified";
    approvedForPublication: true;
    /** Who confirmed the record is factually correct. */
    verifiedBy: string;
    /** ISO date the record was verified. */
    verifiedOn: string;
  };
};

export type DraftProject = ProjectFields & {
  verification: {
    status: "draft";
    approvedForPublication: false;
  };
};

export type ProjectRecord = VerifiedProject | DraftProject;

/**
 * Type guard: narrows a record to a published, verified project.
 * Draft records are structurally incapable of passing this check.
 */
export function isPublishedProject(
  record: ProjectRecord,
): record is VerifiedProject {
  return (
    record.verification.status === "verified" &&
    record.verification.approvedForPublication === true
  );
}

/** Only genuinely verified project photographs are renderable. */
export function getVerifiedImages(project: VerifiedProject): ProjectImage[] {
  return (project.gallery ?? []).filter((image) => image.verified === true);
}
