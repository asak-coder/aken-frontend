import TrackedAnchor from "@/components/TrackedAnchor";
import TrackedLink from "@/components/TrackedLink";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_PREFILL_URL,
} from "@/lib/contact";
import type { ServiceContent } from "@/lib/services/service-types";

type ServiceCtaProps = {
  service: ServiceContent;
};

/**
 * Closing conversion block. Routes through the existing enquiry system only —
 * no second enquiry mechanism is introduced.
 */
export default function ServiceCta({ service }: ServiceCtaProps) {
  const ctaLocation = `service_cta_${service.slug}`;

  return (
    <section className="bg-orange-500 text-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-14 text-center lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Discuss your {service.navLabel.toLowerCase()} requirement
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
          Share your drawings, BOQ, site location and schedule. Our engineering
          team will review the scope and respond with a practical quotation.
          Drawings are treated as confidential and used only for estimation and
          engineering discussion.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <TrackedLink
            href="/enquiry"
            ctaName={`${service.navLabel} - Discuss Your Project`}
            ctaLocation={ctaLocation}
            eventName="request_quotation_click"
            className="inline-flex items-center justify-center rounded-md bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Discuss Your Project
          </TrackedLink>

          <TrackedLink
            href="/contact"
            ctaName={`${service.navLabel} - Send Your Enquiry`}
            ctaLocation={ctaLocation}
            eventName="cta_click"
            className="inline-flex items-center justify-center rounded-md border border-slate-900 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Send Your Enquiry
          </TrackedLink>

          <TrackedAnchor
            href={`tel:${CONTACT_PHONE_E164}`}
            ctaName={`${service.navLabel} - Call`}
            ctaLocation={ctaLocation}
            eventName="phone_click"
            className="inline-flex items-center justify-center rounded-md border border-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Call {CONTACT_PHONE_DISPLAY}
          </TrackedAnchor>

          <TrackedAnchor
            href={CONTACT_WHATSAPP_PREFILL_URL}
            ctaName={`${service.navLabel} - WhatsApp`}
            ctaLocation={ctaLocation}
            eventName="whatsapp_click"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            WhatsApp
          </TrackedAnchor>
        </div>
      </div>
    </section>
  );
}
