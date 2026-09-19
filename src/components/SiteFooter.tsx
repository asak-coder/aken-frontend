import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_URL,
} from "@/lib/contact";

const companyLinks = [
  { href: "/about", label: "About AKEN" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Insights" },
  { href: "/careers", label: "Careers" },
];

/**
 * Footer service links point at the dedicated service pages. "All Services"
 * links back to the /services index so the parent page keeps its internal
 * links.
 */
const serviceLinks = [
  { href: "/services/peb", label: "Pre-Engineered Buildings" },
  {
    href: "/services/structural-steel-fabrication",
    label: "Structural Steel Fabrication",
  },
  {
    href: "/services/structural-steel-erection",
    label: "Structural Steel Erection",
  },
  {
    href: "/services/roofing-wall-cladding",
    label: "Roofing & Wall Cladding",
  },
  {
    href: "/services/industrial-maintenance-shutdown",
    label: "Industrial Maintenance & Shutdown",
  },
  {
    href: "/services/mechanical-equipment-erection",
    label: "Mechanical Equipment Erection",
  },
  {
    href: "/services/heavy-fabrication",
    label: "Heavy & Custom Steel Fabrication",
  },
  { href: "/services", label: "All Services" },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          {/* Brand block */}
          <div>
            <div className="flex flex-col items-start gap-1">
              <BrandLogo sizeClassName="h-9" />
              <div className="text-sm text-slate-400">
                A Brand of A K ENGINEERING
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Industrial Engineering • Steel Fabrication • PEB • Erection •
              Industrial Maintenance
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              AKEN is the customer-facing brand of A K ENGINEERING, an
              engineering and steel construction company focused on dependable
              execution for industrial and infrastructure projects.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Services
            </h3>
            <ul className="mt-4 space-y-3">
              {serviceLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_PHONE_E164}`}
                  className="hover:text-white"
                >
                  +91 {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
              <li>Registered Address: Hirakud, Sambalpur, Odisha, India</li>
              <li>Branch Office: Bhubaneswar, Odisha, India</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            © 2026 A K ENGINEERING. All Rights Reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          AKEN is a brand of A K ENGINEERING.
        </p>
      </div>
    </footer>
  );
}
