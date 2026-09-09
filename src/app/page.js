import Image from "next/image";
import SmartEnquiryWizard from "@/components/SmartEnquiryWizard";
import HeroMedia from "@/components/HeroMedia";
import TrackedAnchor from "@/components/TrackedAnchor";
import TrackedLink from "@/components/TrackedLink";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_URL,
} from "@/lib/contact";
import { getStructuredDataJson } from "@/lib/schema";

export const metadata = {
  title: "AKEN | A K ENGINEERING | Industrial Engineering & Steel Construction",
  description:
    "AKEN, a brand of A K ENGINEERING, delivers industrial engineering and steel construction solutions across structural steel fabrication, PEB, erection, roofing, mechanical installation and industrial maintenance.",
  keywords:
    "AKEN, A K ENGINEERING, industrial EPC contractor India, PEB contractor, structural steel fabrication, industrial shed construction, steel erection, industrial maintenance",
  alternates: {
    canonical: "https://aken.firm.in",
  },
};

const serviceBlocks = [
  {
    title: "Pre-Engineered Buildings (PEB)",
    text:
      "Efficient and durable PEB solutions for warehouses, industrial facilities and other large-span applications.",
  },
  {
    title: "Structural Steel Fabrication",
    text:
      "Precision fabrication of structural steel components with focus on dimensional accuracy and workmanship.",
  },
  {
    title: "Industrial Erection Services",
    text:
      "Professional site erection with emphasis on safety, alignment, lifting coordination and execution quality.",
  },
];

const trustPoints = [
  "Engineering-led execution from planning through site erection",
  "Controlled fabrication processes focused on accuracy and reliable assembly",
  "Safety integrated into planning, lifting, fabrication and erection activities",
  "Coordination between engineering, fabrication, logistics and site execution",
];

const compliancePoints = [
  "Direct contractor communication through official phone and email channels",
  "Transparent enquiry-to-quotation process with scope clarification before pricing",
  "Dedicated policy pages for privacy and usage terms",
  "No misleading guaranteed claims on cost, timeline, or approvals",
];

const faqItems = [
  {
    q: "What type of projects does AKEN handle?",
    a: "AKEN handles industrial engineering and steel construction scopes including PEB structures, structural steel fabrication, erection, roofing and industrial maintenance across India.",
  },
  {
    q: "Who is AKEN?",
    a: "AKEN is the customer-facing brand of A K ENGINEERING, an engineering and steel construction company focused on dependable execution for industrial and infrastructure projects.",
  },
  {
    q: "How can I request a quotation quickly?",
    a: "Use the homepage enquiry form or contact us by phone and WhatsApp for rapid technical discussion and scope alignment.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-white text-slate-900">
      {/* JSON-LD (Organization + LocalBusiness placeholders are emitted by getStructuredDataJson) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: getStructuredDataJson() }}
      />

      {/* Floating WhatsApp */}
      <TrackedAnchor
        href={CONTACT_WHATSAPP_URL}
        ctaName="WhatsApp Floating"
        ctaLocation="global_floating"
        eventName="whatsapp_click"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-black/20 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10">
          {/* WhatsApp icon */}
          <svg
            viewBox="0 0 32 32"
            className="h-5 w-5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M19.11 17.56c-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14-.18.27-.7.87-.86 1.05-.16.18-.32.2-.59.07-.27-.14-1.15-.42-2.19-1.35-.81-.72-1.36-1.62-1.52-1.89-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.46-.84-2-.22-.54-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.28s.98 2.64 1.11 2.82c.14.18 1.93 2.94 4.68 4.12.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.59-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.12-.25-.18-.52-.32z" />
            <path d="M26.7 5.3A13.3 13.3 0 0 0 16 1C8.8 1 3 6.8 3 14c0 2.3.6 4.5 1.7 6.5L3 31l10.7-1.7c1.9 1 4 1.6 6.3 1.6h0c7.2 0 13-5.8 13-13 0-3.5-1.4-6.8-3.3-9.6ZM16 28.4h0c-2 0-3.9-.5-5.6-1.5l-.4-.2-6.4 1 1-6.2-.3-.4A11.2 11.2 0 0 1 4.8 14C4.8 7.9 9.8 2.8 16 2.8c3 0 5.8 1.2 7.9 3.3a11.1 11.1 0 0 1 3.3 7.9c0 6.2-5.1 11.2-11.2 11.2Z" />
          </svg>
        </span>
        WhatsApp
      </TrackedAnchor>

      {/* HERO (Cinematic enterprise) */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <HeroMedia />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-3">
                <Image
                  src="/logo/logo-white.svg"
                  alt="AKEN"
                  width={1000}
                  height={300}
                  priority
                  className="h-7 w-auto object-contain md:h-8"
                />
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-white/90">
                  A Brand of A K ENGINEERING • Hirakud, Sambalpur
                </p>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                ENGINEERING WHAT&rsquo;S NEXT. BUILDING WHAT LASTS.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
                AKEN, a brand of A K ENGINEERING, delivers industrial engineering and
                steel construction solutions across structural steel fabrication, PEB,
                erection, roofing, mechanical installation and industrial maintenance.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <TrackedLink
                  href="/contact"
                  ctaName="Discuss Your Project"
                  ctaLocation="home_hero"
                  eventName="request_quotation_click"
                  className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-black hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                >
                  Discuss Your Project
                </TrackedLink>

                <TrackedLink
                  href="/services"
                  ctaName="Explore Our Capabilities"
                  ctaLocation="home_hero"
                  eventName="cta_click"
                  className="rounded-lg border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                >
                  Explore Our Capabilities
                </TrackedLink>

                <TrackedAnchor
                  href={`tel:${CONTACT_PHONE_E164}`}
                  ctaName="Call Now"
                  ctaLocation="home_hero"
                  eventName="phone_click"
                  className="rounded-lg border border-white/25 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  {CONTACT_PHONE_DISPLAY}
                </TrackedAnchor>
              </div>

              <p className="mt-5 text-xs text-white/60">
                Serving industrial teams across power, cement, mining, manufacturing and
                infrastructure.
              </p>
            </div>

            <div className="lg:col-span-5">
              {/* Smart Project Enquiry Wizard */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/20 backdrop-blur">
                <SmartEnquiryWizard />
                <p className="mt-3 text-xs text-white/70">
                  Your technical drawings are kept strictly confidential.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POSITIONING BAR (verifiable capabilities — no fabricated statistics) */}
      <section className="bg-slate-900 text-white reveal">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="text-xl font-extrabold tracking-tight">Industrial EPC</div>
              <div className="mt-1 text-sm text-white/70">Engineering-led execution</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="text-xl font-extrabold tracking-tight">Steel Fabrication</div>
              <div className="mt-1 text-sm text-white/70">Hirakud fabrication capability</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="text-xl font-extrabold tracking-tight">Site Erection</div>
              <div className="mt-1 text-sm text-white/70">Safety-driven execution</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="text-xl font-extrabold tracking-tight">Pan-India</div>
              <div className="mt-1 text-sm text-white/70">Project delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT AKEN */}
      <section className="mx-auto max-w-7xl px-6 py-20 reveal">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src="/engineers-blueprint.jpg"
                alt="AKEN engineering team reviewing industrial drawings"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>

          <div className="lg:col-span-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              ABOUT AKEN
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-700">
              AKEN is the customer-facing brand of A K ENGINEERING, an engineering and
              steel construction company focused on delivering dependable solutions for
              industrial and infrastructure projects.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">
              From engineering and structural steel fabrication to site erection, roofing,
              mechanical equipment installation and industrial maintenance, AKEN brings
              together technical capability, skilled execution and disciplined project
              management.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">
              Our approach is simple: understand the requirement, engineer the right
              solution, execute with precision and deliver with a strong focus on quality,
              safety and schedule.
            </p>

            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900">
              AKEN — A Brand of A K ENGINEERING
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CORE SERVICES GRID (4 cards) */}
      <section className="bg-slate-50 reveal">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Core Services
              </h2>
              <p className="mt-2 max-w-2xl text-slate-700">
                Engineered for performance. Built for industry.
              </p>
            </div>
            <TrackedLink
              href="/services"
              ctaName="Explore All Services"
              ctaLocation="home_services"
              eventName="cta_click"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              Explore All Services
            </TrackedLink>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Pre-Engineered Buildings (PEB)",
                desc: "Efficient and durable PEB solutions for warehouses, industrial facilities and other large-span applications.",
                href: "/services#peb",
              },
              {
                title: "Structural Steel Fabrication",
                desc: "Precision fabrication of structural steel components with focus on dimensional accuracy and workmanship.",
                href: "/services#fabrication",
              },
              {
                title: "Structural Steel Erection",
                desc: "Professional site erection with emphasis on safety, alignment and lifting coordination.",
                href: "/services#erection",
              },
              {
                title: "Industrial Maintenance & Shutdown",
                desc: "Planned maintenance, modification and shutdown execution for industrial facilities.",
                href: "/services#maintenance",
              },
            ].map((s) => (
              <article
                key={s.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M4 20V10l8-6 8 6v10" />
                      <path d="M9 20v-7h6v7" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    Learn More
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{s.desc}</p>

                <TrackedLink
                  href={s.href}
                  ctaName={`Service Card: ${s.title}`}
                  ctaLocation="home_services"
                  eventName="cta_click"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 group-hover:decoration-slate-900"
                >
                  View capability <span aria-hidden="true">→</span>
                </TrackedLink>

                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-2xl" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE SECTION */}
      <section className="bg-slate-950 text-white reveal">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <h2 className="text-3xl font-extrabold tracking-tight">
                Ready to Discuss Your Next Project?
              </h2>
              <p className="mt-3 max-w-3xl text-white/75">
                Submit your project parameters or technical drawings for a detailed technical
                consultation.
              </p>
            </div>
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <TrackedLink
                href="/contact"
                ctaName="Submit Project Requirement"
                ctaLocation="home_lead_section"
                eventName="request_quotation_click"
                className="inline-flex w-full items-center justify-center rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-black hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition lg:w-auto"
              >
                Submit Project Requirement
              </TrackedLink>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold">Fast procurement response</h3>
              <p className="mt-2 text-sm text-white/75">
                Share scope, drawings, and timelines. We align requirements before issuing a
                quotation.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-bold">Confidential drawings handling</h3>
              <p className="mt-2 text-sm text-white/75">
                Your technical documents are treated strictly confidential and used only for
                estimation and engineering discussion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business credibility & compliance */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl rounded-2xl border border-gray-200 bg-gray-50 p-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Business Credibility and Compliance
          </h2>
          <p className="mt-3 max-w-4xl text-gray-700">
            We maintain a clear communication and quotation process suitable for industrial
            procurement workflows and digital ad compliance standards.
          </p>

          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {compliancePoints.map((point) => (
              <li
                key={point}
                className="rounded-lg bg-white px-4 py-3 text-gray-800 shadow-sm"
              >
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href="/privacy-policy"
              ctaName="Privacy Policy"
              ctaLocation="home_compliance"
              eventName="policy_click"
              className="rounded-lg border border-gray-400 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
            >
              View Privacy Policy
            </TrackedLink>
            <TrackedLink
              href="/terms-and-conditions"
              ctaName="Terms and Conditions"
              ctaLocation="home_compliance"
              eventName="policy_click"
              className="rounded-lg border border-gray-400 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
            >
              View Terms and Conditions
            </TrackedLink>
            <TrackedLink
              href="/contact"
              ctaName="Official Contact Page"
              ctaLocation="home_compliance"
              eventName="cta_click"
              className="rounded-lg border border-gray-400 px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
            >
              Official Contact Details
            </TrackedLink>
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-5">
            {faqItems.map((item) => (
              <article key={item.q} className="rounded-xl border border-gray-700 p-5">
                <h3 className="text-xl font-semibold">{item.q}</h3>
                <p className="mt-2 text-gray-300">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-orange-500 px-6 py-20 text-center text-black">
        <h2 className="text-3xl font-bold">Planning an Industrial Expansion or New Facility?</h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg">
          Discuss your scope with our engineering team and get a practical quotation aligned with
          your project timeline, compliance needs, and budget target.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <TrackedLink
            href="/contact"
            ctaName="Discuss Your Project"
            ctaLocation="home_bottom_cta"
            eventName="request_quotation_click"
            className="rounded-lg bg-black px-8 py-3 font-semibold text-white hover:bg-gray-800 transition"
          >
            Discuss Your Project
          </TrackedLink>
          <TrackedLink
            href="/about"
            ctaName="About AKEN"
            ctaLocation="home_bottom_cta"
            eventName="cta_click"
            className="rounded-lg border border-black px-8 py-3 font-semibold hover:bg-black hover:text-white transition"
          >
            About AKEN
          </TrackedLink>
          <TrackedLink
            href="/blog"
            ctaName="Read Industrial Blog"
            ctaLocation="home_bottom_cta"
            eventName="blog_article_click"
            className="rounded-lg border border-black px-8 py-3 font-semibold hover:bg-black hover:text-white transition"
          >
            Read Industrial Blog
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
