import type { Metadata } from "next";
import Link from "next/link";
import SmartEnquiryWizard from "@/components/SmartEnquiryWizard";
import TrackedAnchor from "@/components/TrackedAnchor";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_PREFILL_URL,
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Industrial Project Enquiry | AKEN – A K ENGINEERING",
  description:
    "Send an industrial project enquiry to AKEN, a brand of A K ENGINEERING, for PEB sheds, structural steel fabrication, erection, roofing and cladding, industrial maintenance and structural repair.",
  alternates: {
    canonical: "/enquiry",
  },
  openGraph: {
    type: "website",
    url: "https://aken.firm.in/enquiry",
    title: "Industrial Project Enquiry | AKEN – A K ENGINEERING",
    description:
      "Share your project details — scope, location, tonnage and timeline — and A K ENGINEERING will respond with a practical quotation.",
    siteName: "AKEN",
    locale: "en_IN",
  },
};

export default function EnquiryPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Industrial Project Enquiry
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            Share your scope, location, estimated tonnage and timeline. Our
            engineering team reviews every enquiry and responds with a
            practical quotation for the work involved.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
          <div className="order-2 lg:order-1">
            <SmartEnquiryWizard />

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Need urgent assistance?
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900">Call our engineering team.</h2>
              <p className="mt-2 text-sm text-gray-600">
                Phone:{" "}
                <TrackedAnchor
                  href={`tel:${CONTACT_PHONE_E164}`}
                  ctaName="Call Enquiry"
                  ctaLocation="enquiry_urgent_assistance"
                  eventName="phone_click"
                  className="font-semibold text-gray-900 underline"
                >
                  {CONTACT_PHONE_DISPLAY}
                </TrackedAnchor>
              </p>

              <p className="mt-2 text-sm text-gray-600">
                WhatsApp:{" "}
                <TrackedAnchor
                  href={CONTACT_WHATSAPP_PREFILL_URL}
                  ctaName="WhatsApp Enquiry"
                  ctaLocation="enquiry_urgent_assistance"
                  eventName="whatsapp_click"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-900 underline"
                >
                  Chat now
                </TrackedAnchor>
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/enquiry"
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black transition"
                >
                  Request Project Quote
                </Link>
                <p className="text-xs text-gray-500">
                  For fastest response, submit this enquiry and we’ll call you back.
                </p>
              </div>
            </section>
          </div>

          <aside className="order-1 lg:order-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Industrial EPC & Steel Works</h2>
              <p className="mt-2 text-sm text-gray-600">
                Use this wizard to share key project details. It helps our team understand scope, tonnage,
                timeline, and location for faster quotation.
              </p>

              <dl className="mt-5 grid gap-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <dt className="text-xs font-semibold text-gray-500">Services</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    PEB • Fabrication • Cladding • Maintenance • Retrofitting
                  </dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <dt className="text-xs font-semibold text-gray-500">What you’ll need</dt>
                  <dd className="mt-1 text-sm text-gray-700">
                    Location, approximate tonnage, project type and timeline. Drawings/BOQ are optional.
                  </dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <dt className="text-xs font-semibold text-gray-500">Response</dt>
                  <dd className="mt-1 text-sm text-gray-700">
                    Our engineering team typically contacts you within 24 working hours.
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
