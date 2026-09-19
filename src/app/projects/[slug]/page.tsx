import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProjectCaseStudy from "@/components/ProjectCaseStudy";
import {
  getProjectBySlug,
  getPublishedProjects,
} from "@/lib/projects/projects-data";
import { SCHEMA_SITE_URL, getBreadcrumbJsonLd } from "@/lib/schema";

type ProjectRouteParams = {
  slug: string;
};

type ProjectPageProps = {
  params: Promise<ProjectRouteParams>;
};

/**
 * Only slugs of verified, publication-approved projects are generated. When no
 * project has been verified, no case-study URL exists and every unknown slug
 * returns 404 rather than an empty page.
 */
export const dynamicParams = false;

export function generateStaticParams(): ProjectRouteParams[] {
  return getPublishedProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project not found | AKEN",
      description: "The requested project case study is not available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const path = `/projects/${project.slug}`;
  const title = `${project.name} | AKEN Project Case Study`;
  const description = project.overview
    ? project.overview.slice(0, 155)
    : `${project.name} — a verified AKEN project case study delivered by A K ENGINEERING.`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "article",
      url: `${SCHEMA_SITE_URL}${path}`,
      title,
      description,
      siteName: "AKEN",
      locale: "en_IN",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const path = `/projects/${project.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: project.name,
        description: project.overview ?? project.name,
        articleSection: "Project case study",
        inLanguage: "en-IN",
        author: {
          "@type": "Organization",
          name: "A K ENGINEERING",
          url: SCHEMA_SITE_URL,
        },
        publisher: {
          "@id": `${SCHEMA_SITE_URL}/#organization`,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SCHEMA_SITE_URL}${path}`,
        },
      },
      getBreadcrumbJsonLd([
        { label: "Home", path: "/" },
        { label: "Projects", path: "/projects" },
        { label: project.name, path },
      ]),
    ],
  };

  return (
    <main className="bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
      />

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-orange-400"
            />
            Verified AKEN project
          </p>

          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {project.name}
          </h1>

          {project.overview ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
              {project.overview}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/enquiry"
              className="inline-flex items-center justify-center rounded-md bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              Discuss a similar project
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              All projects
            </Link>
          </div>
        </div>
      </section>

      <ProjectCaseStudy project={project} />
    </main>
  );
}
