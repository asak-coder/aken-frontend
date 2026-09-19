import type { Metadata } from "next";
import SmartEnquiryWizard from "@/components/SmartEnquiryWizard";
import LazyMapEmbed from "@/components/LazyMapEmbed";
import TrackedAnchor from "@/components/TrackedAnchor";
import TrackedLink from "@/components/TrackedLink";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_PREFILL_URL,
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact AKEN | A K ENGINEERING",
  description:
    "Contact AKEN, a brand of A K ENGINEERING, to discuss structural steel fabrication, erection, PEB or industrial maintenance requirements. Share your drawings and BOQ for a technical review and quotation.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    url: "https://aken.firm.in/contact",
    title: "Contact AKEN | A K ENGINEERING",
    description:
      "Discuss structural steel fabrication, erection, PEB or industrial maintenance requirements with A K ENGINEERING. Share your drawings and BOQ for a technical review.",
    siteName: "AKEN",
    locale: "en_IN",
  },
};

export default function ContactPage() {
  return (
    <main className="bg-white text-gray-900">
      <section className="relative isolate overflow-hidden bg-black text-white py-20 text-center px-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/hero-steel.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />
        <div className="relative">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          LET&rsquo;S BUILD SOMETHING STRONGER
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-300">
          Have an industrial project in mind? Tell us what you are planning. Our
          team can discuss your structural, fabrication, erection or industrial
          engineering requirements and identify the right execution approach.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <TrackedLink
            href="/enquiry"
            ctaName="Send Your Enquiry"
            ctaLocation="contact_hero"
            eventName="request_quotation_click"
            className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
          >
            Send Your Enquiry
          </TrackedLink>
          <TrackedAnchor
            href={CONTACT_WHATSAPP_PREFILL_URL}
            ctaName="WhatsApp Contact Page"
            ctaLocation="contact_hero"
            className="bg-green-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-green-400 transition"
            eventName="whatsapp_click"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp Us
          </TrackedAnchor>
        </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Business Information</h2>

          <div className="space-y-4 text-lg">
            <p>
              <strong>Company Name:</strong> A K ENGINEERING
            </p>
            <p className="text-sm text-gray-600">
              AKEN is a brand of A K ENGINEERING.
            </p>
            <p><strong>Business Type:</strong> Industrial EPC Contractor</p>
            <p><strong>Specialization:</strong> PEB Structures, Steel Fabrication, Industrial Shed Construction & Erection</p>
            <p><strong>Service Area:</strong> Pan India</p>

            <p>
              <strong>Email:</strong>{" "}
              <TrackedAnchor
                href={`mailto:${CONTACT_EMAIL}`}
                ctaName="Send Email"
                ctaLocation="contact_business_info"
                className="text-blue-600 underline"
                eventName="email_click"
              >
                {CONTACT_EMAIL}
              </TrackedAnchor>
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              <TrackedAnchor
                href={`tel:${CONTACT_PHONE_E164}`}
                ctaName="Call Contact Page"
                ctaLocation="contact_business_info"
                className="text-blue-600 underline"
                eventName="phone_click"
              >
                {CONTACT_PHONE_DISPLAY}
              </TrackedAnchor>
            </p>

            <p>
              <strong>WhatsApp:</strong>{" "}
              <TrackedAnchor
                href={CONTACT_WHATSAPP_PREFILL_URL}
                ctaName="WhatsApp Contact Page"
                ctaLocation="contact_business_info"
                className="text-green-700 underline"
                eventName="whatsapp_click"
                target="_blank"
                rel="noopener noreferrer"
              >
                Start Chat
              </TrackedAnchor>
            </p>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Branch Office:</strong> Bhubaneswar, Odisha
              </p>
              <p>
                <strong>Registered Address:</strong> Hirakud, Sambalpur,
                Odisha
              </p>
            </div>

          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Smart Project Enquiry</h2>
          <SmartEnquiryWizard />
        </div>
      </section>

      <section className="pb-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-center">Our Locations</h2>
        <p className="mx-auto mb-6 max-w-3xl text-center text-sm text-gray-600">
          A K ENGINEERING operates its branch office at Bhubaneswar. Hirakud,
          Sambalpur, Odisha is the registered address of A K ENGINEERING.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="p-5">
              <h3 className="text-lg font-semibold">
                AKEN (A K ENGINEERING) – Bhubaneswar Branch Office
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Branch Office · A K ENGINEERING
              </p>
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <LazyMapEmbed
                  title="AKEN – Bhubaneswar Branch Office"
                  lat={20.273165901094252}
                  lng={85.8028445394262}
                />
              </div>

              <div className="mt-4">
                <TrackedAnchor
                  href="https://maps.google.com/?q=20.273165901094252,85.8028445394262"
                  ctaName="Open in Google Maps - Bhubaneswar"
                  ctaLocation="contact_map_bhubaneswar"
                  className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white text-sm font-medium hover:bg-gray-800 transition"
                  eventName="maps_click"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </TrackedAnchor>
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="p-5">
              <h3 className="text-lg font-semibold">
                AKEN (A K ENGINEERING) – Hirakud Registered Address
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Registered Address · A K ENGINEERING
              </p>
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <LazyMapEmbed
                  title="AKEN – Hirakud Registered Address"
                  lat={21.5367316772452}
                  lng={83.89499883022955}
                />
              </div>

              <div className="mt-4">
                <TrackedAnchor
                  href="https://maps.google.com/?q=21.5367316772452,83.89499883022955"
                  ctaName="Open in Google Maps - Hirakud"
                  ctaLocation="contact_map_hirakud"
                  className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-white text-sm font-medium hover:bg-gray-800 transition"
                  eventName="maps_click"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </TrackedAnchor>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
