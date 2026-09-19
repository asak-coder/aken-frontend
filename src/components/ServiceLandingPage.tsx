import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedServices from "@/components/RelatedServices";
import ServiceApplicationsMaterials from "@/components/ServiceApplicationsMaterials";
import ServiceCta from "@/components/ServiceCta";
import ServiceFaq from "@/components/ServiceFaq";
import ServiceHero from "@/components/ServiceHero";
import ServiceOverview from "@/components/ServiceOverview";
import ServiceProcess from "@/components/ServiceProcess";
import ServiceProof from "@/components/ServiceProof";
import ServiceScope from "@/components/ServiceScope";
import { getRelatedServices } from "@/lib/services/service-data";
import type { ServiceContent } from "@/lib/services/service-types";

type ServiceLandingPageProps = {
  service: ServiceContent;
};

/**
 * Shared layout for all AKEN service landing pages. Section order follows the
 * agreed service page structure. All content comes from the service data layer;
 * nothing is generated or inferred here.
 */
export default function ServiceLandingPage({ service }: ServiceLandingPageProps) {
  const relatedServices = getRelatedServices(service.slug);

  return (
    <main className="bg-white text-slate-900">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: service.navLabel },
        ]}
      />

      <ServiceHero service={service} />

      <ServiceOverview
        headline={service.overviewHeadline}
        paragraphs={service.overviewParagraphs}
        whyAkenHeadline={service.whyAkenHeadline}
        whyAken={service.whyAken}
      />

      <ServiceScope headline={service.scopeHeadline} items={service.scopeItems} />

      <ServiceProcess
        headline={service.processHeadline}
        note={service.processNote}
        steps={service.processSteps}
      />

      <ServiceApplicationsMaterials
        applicationsHeadline={service.applicationsHeadline}
        applications={service.applications}
        materialsHeadline={service.materialsHeadline}
        materialsNote={service.materialsNote}
        materials={service.materials}
      />

      <ServiceProof images={service.representativeImages} />

      <ServiceFaq faqs={service.faqs} />

      <RelatedServices services={relatedServices} />

      <ServiceCta service={service} />
    </main>
  );
}
