import Image from "next/image";
import Link from "next/link";
import {
  getVerifiedImages,
  type ProjectStage,
  type VerifiedProject,
} from "@/lib/projects/project-types";
import { getServiceSummaries } from "@/lib/services/service-data";
import type { ServiceSlug } from "@/lib/services/service-types";

type ProjectCaseStudyProps = {
  project: VerifiedProject;
};

const STAGE_LABELS: Record<ProjectStage, string> = {
  planning: "In planning",
  "in-progress": "In progress",
  completed: "Completed",
  "on-hold": "On hold",
};

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs font-semibold tracking-widest text-slate-400">
        {number}
      </span>
      <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
          <span
            aria-hidden="true"
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders a verified project case study. Every section is optional: a section
 * is only rendered when the corresponding field exists in the verified record,
 * so nothing is ever invented to fill the template.
 */
export default function ProjectCaseStudy({ project }: ProjectCaseStudyProps) {
  const gallery = getVerifiedImages(project);
  const serviceSummaries = getServiceSummaries();
  const deliveredServices = (project.servicesDelivered ?? [])
    .map((slug: ServiceSlug) =>
      serviceSummaries.find((service) => service.slug === slug),
    )
    .filter((service): service is NonNullable<typeof service> => Boolean(service));

  const metaParts: string[] = [];
  if (project.projectType) metaParts.push(project.projectType);
  metaParts.push(STAGE_LABELS[project.stage]);
  if (project.completionDate) metaParts.push(`Completed ${project.completionDate}`);

  const showClientSection =
    project.clientDisclosure === "authorised"
      ? Boolean(project.client)
      : Boolean(project.industry);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-14 lg:py-16">
        {project.overview ? (
          <section>
            <SectionHeading number="01" title="Project overview" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              {metaParts.join(" · ")}
            </p>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700">
              {project.overview}
            </p>
          </section>
        ) : null}

        {showClientSection ? (
          <section>
            <SectionHeading number="02" title="Client and industry" />
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {project.clientDisclosure === "authorised" && project.client ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {project.client}
                  </dd>
                </div>
              ) : null}
              {project.industry ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Industry
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">
                    {project.industry}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {project.location ? (
          <section>
            <SectionHeading number="03" title="Location" />
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              {project.location}
            </p>
          </section>
        ) : null}

        {project.requirement ? (
          <section>
            <SectionHeading number="04" title="Requirement" />
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700">
              {project.requirement}
            </p>
          </section>
        ) : null}

        {project.scopeOfWork && project.scopeOfWork.length > 0 ? (
          <section>
            <SectionHeading number="05" title="AKEN scope" />
            <BulletList items={project.scopeOfWork} />
          </section>
        ) : null}

        {project.engineeringScope && project.engineeringScope.length > 0 ? (
          <section>
            <SectionHeading number="06" title="Engineering approach" />
            <BulletList items={project.engineeringScope} />
          </section>
        ) : null}

        {project.executionScope && project.executionScope.length > 0 ? (
          <section>
            <SectionHeading number="07" title="Fabrication and execution" />
            <BulletList items={project.executionScope} />
            {project.materialsSystems && project.materialsSystems.length > 0 ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Materials and systems
                </p>
                <BulletList items={project.materialsSystems} />
              </div>
            ) : null}
          </section>
        ) : null}

        {project.keyChallenges && project.keyChallenges.length > 0 ? (
          <section>
            <SectionHeading number="08" title="Challenges" />
            <BulletList items={project.keyChallenges} />
          </section>
        ) : null}

        {project.solution ? (
          <section>
            <SectionHeading number="09" title="Solution delivered" />
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700">
              {project.solution}
            </p>
          </section>
        ) : null}

        {project.outcome && project.outcome.length > 0 ? (
          <section>
            <SectionHeading number="10" title="Project outcome" />
            <BulletList items={project.outcome} />
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section>
            <SectionHeading number="11" title="Project gallery" />
            <p className="mt-3 text-sm text-slate-600">
              Photographs from this project, supplied or verified by
              A K ENGINEERING.
            </p>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2">
              {gallery.map((image) => (
                <li
                  key={image.src}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  {image.caption ? (
                    <p className="px-4 py-3 text-xs text-slate-600">
                      {image.caption}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {deliveredServices.length > 0 ? (
          <section>
            <SectionHeading number="12" title="Services delivered" />
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {deliveredServices.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={service.path}
                    className="flex h-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    {service.navLabel}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
