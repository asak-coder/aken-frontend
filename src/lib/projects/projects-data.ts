import {
  isPublishedProject,
  type ProjectRecord,
  type VerifiedProject,
} from "@/lib/projects/project-types";
import type { ServiceSlug } from "@/lib/services/service-types";

/**
 * PROJECT RECORDS
 * ===============
 *
 * This array is intentionally empty.
 *
 * No AKEN project has been documented and verified for publication yet, so
 * nothing is published. Do not add illustrative, sample or example records
 * here — a record added as a draft stays invisible, but a record marked
 * "verified" is published immediately and becomes a factual claim about
 * A K ENGINEERING.
 *
 * To add a real project, follow PROJECT_CONTENT_GUIDE.md and set
 * verification: { status: "verified", approvedForPublication: true, ... }
 * only once A K ENGINEERING has confirmed every published field.
 */
export const projectRecords: ProjectRecord[] = [];

/** Only verified, publication-approved projects. */
export function getPublishedProjects(): VerifiedProject[] {
  return projectRecords.filter(isPublishedProject);
}

export function getProjectBySlug(slug: string): VerifiedProject | undefined {
  return getPublishedProjects().find((project) => project.slug === slug);
}

export function getProjectPath(slug: string): string {
  return `/projects/${slug}`;
}

export function hasPublishedProjects(): boolean {
  return getPublishedProjects().length > 0;
}

/**
 * Published projects that delivered a given service.
 * Used to link service pages to genuine case studies — never to invent one.
 */
export function getProjectsForService(
  serviceSlug: ServiceSlug,
): VerifiedProject[] {
  return getPublishedProjects().filter((project) =>
    (project.servicesDelivered ?? []).includes(serviceSlug),
  );
}

/** Distinct services actually delivered in published projects. */
export function getPublishedProjectServiceSlugs(): ServiceSlug[] {
  const slugs = new Set<ServiceSlug>();
  for (const project of getPublishedProjects()) {
    for (const slug of project.servicesDelivered ?? []) {
      slugs.add(slug);
    }
  }
  return [...slugs];
}
