"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function ContactPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (res.ok) {
        setSuccess(true);

        // GA4 Conversion Event
        trackEvent("generate_lead", {
          event_category: "conversion",
          event_label: "Contact Form Submission",
          value: 1,
        });

        e.currentTarget.reset();
      }
    } catch (error) {
      console.error("Submission error:", error);
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
              <a
                href="mailto:web.akengg@gmail.com"
                className="text-blue-600 underline"
              >
                web.akengg@gmail.com
              </a>
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              <a
                href="tel:+919999999999"
                className="text-blue-600 underline"
                onClick={() =>
                  trackEvent("phone_click", {
                    event_category: "engagement",
                    event_label: "Phone Click Contact Page",
                  })
                }
              >
                +91 99999 99999
              </a>
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
          © {new Date().getFullYear()} A K ENGINEERING. All Rights Reserved.
        </p>
        <p className="mt-2 text-gray-400">
          Industrial EPC | PEB Structures | Steel Fabrication | Industrial Erection Services
        </p>
      </footer>

    </main>
  );
}