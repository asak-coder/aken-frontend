import type { Metadata } from "next";
import Link from "next/link";
import type { ProjectGalleryItem } from "@/components/ProjectGallery";
import Breadcrumbs from "@/components/Breadcrumbs";
import RepresentativeGallery from "@/components/RepresentativeGallery";
import { getProjectPath, getPublishedProjects } from "@/lib/projects/projects-data";
import { SCHEMA_SITE_URL, getBreadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Industrial Steel Capability Showcase | AKEN – A K ENGINEERING",
  description:
    "Representative industrial imagery illustrating AKEN's structural steel fabrication, PEB, erection, roofing and cladding capability, plus verified project case studies as they are published. AKEN is a brand of A K ENGINEERING.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    type: "website",
    url: `${SCHEMA_SITE_URL}/projects`,
    title: "Industrial Steel Capability Showcase | AKEN",
    description:
      "Representative industrial imagery for AKEN's fabrication, PEB, erection, roofing and cladding disciplines, plus verified project case studies.",
    siteName: "AKEN",
    locale: "en_IN",
  },
};

const representativeItems: ProjectGalleryItem[] = [
  {
    src: "/projects/peb-shed-erection.jpg",
    alt: "Steel shed frame erection at an industrial construction site",
    title: "Steel Shed Erection",
  },
  {
    src: "/projects/steel-fabrication-workshop-cutting-welding.jpg",
    alt: "Structural steel cutting and welding in a fabrication workshop",
    title: "Steel Fabrication",
  },
  {
    src: "/projects/structure-erection-crane-lifting.jpg",
    alt: "Crane lifting a steel structure during erection works",
    title: "Structure Erection",
  },
  {
    src: "/projects/roofing-cladding-industrial-shed.jpg",
    alt: "Roofing and cladding installation on an industrial steel shed",
    title: "Roofing & Cladding",
  },
  {
    src: "/projects/puf-panel-installation-insulated-shed.jpg",
    alt: "Insulated panel installation on an industrial shed",
    title: "Insulated Panel Installation",
  },
];

export default function ProjectsPage() {
  const publishedProjects = getPublishedProjects();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      getBreadcrumbJsonLd([
        { label: "Home", path: "/" },
        { label: "Projects", path: "/projects" },
      ]),
    ],
  };

  return (
    <main className="bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Projects" }]}
      />

      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold md:text-5xl">Capability Showcase</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This page distinguishes two different things: verified AKEN project
            case studies, and representative industrial imagery that illustrates
            our disciplines. They are never mixed.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            How this page is organised
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                A
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-950">
                Verified AKEN project
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                A project documented by A K ENGINEERING with verified scope,
                verified photographs and confirmed outcomes. Only projects that
                have been checked and approved for publication appear as case
                studies.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                B
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-950">
                Representative industrial imagery
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Imagery that illustrates a discipline or work activity. It is
                not a photograph of an AKEN project and is always labelled as
                representative.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Verified AKEN projects
          </h2>

          {publishedProjects.length > 0 ? (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {publishedProjects.map((project) => (
                <li key={project.slug}>
                  <Link
                    href={getProjectPath(project.slug)}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <span>
                      <span className="block text-base font-semibold text-slate-950">
                        {project.name}
                      </span>
                      {project.projectType ? (
                        <span className="mt-2 block text-xs font-medium text-slate-500">
                          {project.projectType}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-4 text-xs font-semibold text-slate-700">
                      View case study
                      <span aria-hidden="true"> →</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-700">
                No verified project case studies have been published yet.
                Project records, scopes and site photographs are being
                documented, and each case study will be published only after
                A K ENGINEERING has confirmed every detail.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                We would rather show nothing than publish an unverified project.
                For references relevant to your scope,{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
                >
                  contact our engineering team
                </Link>{" "}
                or review the{" "}
                <Link
                  href="/services"
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
                >
                  services we deliver
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <RepresentativeGallery
            headline="Representative industrial imagery"
            items={representativeItems}
          />
        </div>
      </section>
    </main>
  );
}
