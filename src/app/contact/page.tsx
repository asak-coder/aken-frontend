"use client";

import { useState } from "react";
import { trackEvent, trackLeadConversion, trackCtaClick } from "@/lib/analytics";
import { getLeadAttributionPayload } from "@/lib/utm";
import { getPublicApiBaseUrl } from "@/lib/env";
import TrackedAnchor from "@/components/TrackedAnchor";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_URL,
} from "@/lib/contact";

export default function ContactPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [didStartForm, setDidStartForm] = useState(false);
  const apiBaseUrl = getPublicApiBaseUrl();

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const attribution = getLeadAttributionPayload();
    const payload = {
      ...data,
      ...attribution,
    };

    try {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is missing or invalid.");
      }

      const res = await fetch(`${apiBaseUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const responseBody = await res.json().catch(() => null);
        const leadId = responseBody?.data?.leadId as string | undefined;

        trackLeadConversion({
          formName: "contact_page_enquiry_form",
          pagePath: "/contact",
          leadId,
        });

        setSuccess(true);

        e.currentTarget.reset();
        setDidStartForm(false);
      } else {
        trackEvent("lead_submit_failed", {
          form_name: "contact_page_enquiry_form",
          page_path: "/contact",
        });
      }
    } catch {
      trackEvent("lead_submit_failed", {
        form_name: "contact_page_enquiry_form",
        page_path: "/contact",
      });
      console.error("Submission error.");
    }

    setLoading(false);
  }

  return (
    <main className="bg-white text-gray-900">

      {/* HERO */}
      <section className="bg-black text-white py-20 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Contact A K ENGINEERING
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-300">
          Get in touch with our engineering team for Industrial EPC Projects,
          Pre-Engineered Buildings, Structural Steel Fabrication and Erection Services.
        </p>
      </section>

      {/* CONTACT SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12">

        {/* BUSINESS INFO */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Business Information
          </h2>

          <div className="space-y-4 text-lg">
            <p><strong>Company Name:</strong> A K ENGINEERING</p>
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
                href={CONTACT_WHATSAPP_URL}
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

            <p><strong>Office Location:</strong> Sambalpur, Odisha, India</p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Request Industrial Quotation
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <input
              name="contactPerson"
              placeholder="Your Name"
              required
              className="w-full p-3 border rounded-lg"
              onFocus={() => {
                if (!didStartForm) {
                  setDidStartForm(true);
                  trackEvent("form_start", {
                    form_name: "contact_page_enquiry_form",
                    page_path: "/contact",
                  });
                }
              }}
            />

            <input
              name="email"
              type="email"
              placeholder="Your Email"
              required
              className="w-full p-3 border rounded-lg"
            />

            <input
              name="companyName"
              placeholder="Company Name"
              required
              className="w-full p-3 border rounded-lg"
            />

            <input
              name="phone"
              placeholder="Phone Number"
              required
              className="w-full p-3 border rounded-lg"
            />

            <textarea
              name="message"
              placeholder="Project Requirement"
              required
              rows={4}
              className="w-full p-3 border rounded-lg"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
              onClick={() => {
                trackCtaClick({
                  ctaName: "Submit Enquiry",
                  ctaLocation: "contact_form",
                  destination: "/api/leads",
                  ctaType: "button",
                  eventName: "form_submit_click",
                });
              }}
            >
              {loading ? "Submitting..." : "Submit Enquiry"}
            </button>

            {success && (
              <p className="text-green-600 font-semibold mt-3">
                Enquiry submitted successfully!
              </p>
            )}
          </form>
        </div>

      </section>

      {/* GOOGLE MAP */}
      <section className="pb-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Our Location
        </h2>

        <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg">
          <iframe
            src="https://www.google.com/maps?q=Sambalpur,Odisha,India&output=embed"
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white py-10 text-center text-sm">
        <p>
          (c) {new Date().getFullYear()} A K ENGINEERING. All Rights Reserved.
        </p>
        <p className="mt-2 text-gray-400">
          Industrial EPC | PEB Structures | Steel Fabrication | Industrial Erection Services
        </p>
      </footer>

    </main>
  );
}

