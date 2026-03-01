import HomeLeadForm from "@/components/HomeLeadForm";
import TrackedAnchor from "@/components/TrackedAnchor";
import TrackedLink from "@/components/TrackedLink";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_URL,
} from "@/lib/contact";

export const metadata = {
  title:
    "Industrial EPC Contractor in India | PEB, Steel Fabrication, Erection - A K ENGINEERING",
  description:
    "A K ENGINEERING is an Industrial EPC contractor for PEB structures, structural steel fabrication, industrial shed construction, and erection services across India for PSU, power plants, cement, mining, and manufacturing sectors.",
  keywords:
    "Industrial EPC contractor India, PEB contractor, steel fabrication company, industrial shed construction, structural steel erection, turnkey industrial projects",
  alternates: {
    canonical: "https://aken.firm.in",
  },
};

const serviceBlocks = [
  {
    title: "Pre-Engineered Buildings (PEB)",
    text:
      "End-to-end PEB design, fabrication, and erection for industrial sheds, warehouses, and production facilities.",
  },
  {
    title: "Structural Steel Fabrication",
    text:
      "Heavy structural fabrication for beams, columns, trusses, platforms, and process-support steel structures.",
  },
  {
    title: "Industrial Erection Services",
    text:
      "On-site erection, installation, and shutdown execution with controlled timelines, safety compliance, and quality checks.",
  },
];

const industries = [
  "PSU and Government Industrial Projects",
  "Power Plants and Energy Infrastructure",
  "Cement and Process Industries",
  "Mining and Bulk Material Handling",
  "Manufacturing and Industrial Expansion",
  "Logistics and Industrial Warehousing",
];

const trustPoints = [
  "Execution-focused EPC mindset with practical site coordination",
  "Safety-first approach for industrial erection and high-risk work zones",
  "Time-bound delivery planning for shutdown and expansion projects",
  "Engineering-driven fabrication quality and dimensional accuracy",
];

const faqItems = [
  {
    q: "What type of projects does A K ENGINEERING handle?",
    a: "We handle industrial EPC scopes including PEB structures, structural steel fabrication, industrial shed construction, and erection support across India.",
  },
  {
    q: "Do you work with PSU and large industrial clients?",
    a: "Yes. We target PSU, power, cement, mining, and manufacturing clients where quality, safety, and execution speed are critical.",
  },
  {
    q: "How can I request a quotation quickly?",
    a: "Use the homepage enquiry form or contact us by phone and WhatsApp for rapid technical discussion and scope alignment.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-white text-gray-900">
      <section className="bg-black px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Industrial EPC Contractor in India for PEB, Steel Fabrication, and Erection
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-300">
              A K ENGINEERING delivers industrial EPC solutions for pre-engineered
              buildings, structural steel fabrication, and site erection services.
              We support PSU and private sector industrial projects with execution discipline,
              safety compliance, and schedule-focused delivery.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-300">
              Our team works across power plants, cement industries, mining operations,
              and manufacturing facilities where reliable infrastructure execution directly
              impacts production and business continuity.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink
                href="/contact"
                ctaName="Request Industrial Quotation"
                ctaLocation="home_hero"
                eventName="request_quotation_click"
                className="rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-black hover:bg-yellow-400 transition"
              >
                Request Industrial Quotation
              </TrackedLink>

              <TrackedAnchor
                href={`tel:${CONTACT_PHONE_E164}`}
                ctaName="Call Now"
                ctaLocation="home_hero"
                eventName="phone_click"
                className="rounded-lg border border-white px-6 py-3 hover:bg-white hover:text-black transition"
              >
                {CONTACT_PHONE_DISPLAY}
              </TrackedAnchor>

              <TrackedAnchor
                href={CONTACT_WHATSAPP_URL}
                ctaName="WhatsApp"
                ctaLocation="home_hero"
                eventName="whatsapp_click"
                className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-400 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </TrackedAnchor>
            </div>
          </div>

          <HomeLeadForm />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold">Core Industrial Services</h2>
        <p className="mt-4 max-w-4xl text-lg text-gray-700">
          We execute practical, production-oriented project scopes that reduce downtime and
          improve long-term industrial infrastructure reliability.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {serviceBlocks.map((service) => (
            <article key={service.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="mt-3 text-gray-700">{service.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <TrackedLink
            href="/services"
            ctaName="Explore Services"
            ctaLocation="home_services"
            eventName="request_quotation_click"
            className="font-semibold text-blue-700 underline"
          >
            View complete service capabilities
          </TrackedLink>
        </div>
      </section>

      <section className="bg-gray-100 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Industries We Serve</h2>
          <p className="mt-4 max-w-4xl text-lg text-gray-700">
            Our execution model is built for heavy industrial environments where schedule,
            structural integrity, and operational safety are non-negotiable.
          </p>

          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {industries.map((industry) => (
              <li key={industry} className="rounded-xl bg-black px-5 py-4 text-white">
                {industry}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold">Why Industrial Teams Choose A K ENGINEERING</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {trustPoints.map((point) => (
            <li key={point} className="rounded-xl border border-gray-200 px-5 py-4 text-gray-800">
              {point}
            </li>
          ))}
        </ul>
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

      <section className="bg-yellow-500 px-6 py-20 text-center text-black">
        <h2 className="text-3xl font-bold">Planning an Industrial Expansion or New Facility?</h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg">
          Discuss your scope with our engineering team and get a practical quotation aligned with
          your project timeline, compliance needs, and budget target.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <TrackedLink
            href="/contact"
            ctaName="Get Project Consultation"
            ctaLocation="home_bottom_cta"
            eventName="request_quotation_click"
            className="rounded-lg bg-black px-8 py-3 font-semibold text-white hover:bg-gray-800 transition"
          >
            Get Project Consultation
          </TrackedLink>
          <TrackedLink
            href="/about"
            ctaName="About Company"
            ctaLocation="home_bottom_cta"
            eventName="cta_click"
            className="rounded-lg border border-black px-8 py-3 font-semibold hover:bg-black hover:text-white transition"
          >
            About Company
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
