import TrackedAnchor from "@/components/TrackedAnchor";
import TrackedLink from "@/components/TrackedLink";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_WHATSAPP_PREFILL_URL,
} from "@/lib/contact";
import type { ServiceContent } from "@/lib/services/service-types";

type ServiceHeroProps = {
  service: ServiceContent;
};

const PRIMARY_CTA_CLASS =
  "inline-flex items-center justify-center rounded-md bg-orange-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm shadow-orange-500/20 ring-1 ring-orange-300/30 transition hover:bg-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300";

const SECONDARY_CTA_CLASS =
  "inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const CONTACT_CTA_CLASS =
  "inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35";

export default function ServiceHero({ service }: ServiceHeroProps) {
  const ctaLocation = `service_hero_${service.slug}`;

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute -top-32 left-1/3 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-32 right-[-8%] h-72 w-[38rem] rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/80">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          Industrial services · AKEN
        </p>

        <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {service.h1}
        </h1>

        <p className="mt-4 max-w-3xl text-lg font-medium text-orange-200">
          {service.heroStatement}
        </p>

        <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
          {service.heroIntro}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <TrackedLink
            href="/enquiry"
            ctaName={`${service.navLabel} - Discuss Your Project`}
            ctaLocation={ctaLocation}
            eventName="request_quotation_click"
            className={PRIMARY_CTA_CLASS}
          >
            Discuss Your Project
          </TrackedLink>

          <TrackedLink
            href="/contact"
            ctaName={`${service.navLabel} - Send Your Enquiry`}
            ctaLocation={ctaLocation}
            eventName="cta_click"
            className={SECONDARY_CTA_CLASS}
          >
            Send Your Enquiry
          </TrackedLink>

          <TrackedAnchor
            href={`tel:${CONTACT_PHONE_E164}`}
            ctaName={`${service.navLabel} - Call`}
            ctaLocation={ctaLocation}
            eventName="phone_click"
            className={CONTACT_CTA_CLASS}
          >
            {CONTACT_PHONE_DISPLAY}
          </TrackedAnchor>

          <TrackedAnchor
            href={CONTACT_WHATSAPP_PREFILL_URL}
            ctaName={`${service.navLabel} - WhatsApp`}
            ctaLocation={ctaLocation}
            eventName="whatsapp_click"
            target="_blank"
            rel="noopener noreferrer"
            className={CONTACT_CTA_CLASS}
          >
            WhatsApp
          </TrackedAnchor>
        </div>

        <p className="mt-6 text-xs text-white/60">
          AKEN is a brand of A K ENGINEERING · Base: Hirakud, Sambalpur, Odisha ·
          Execution across Odisha and pan-India
        </p>
      </div>
    </section>
  );
}
