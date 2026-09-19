import Link from "next/link";
import type { ServiceContent } from "@/lib/services/service-types";

type RelatedServicesProps = {
  services: ServiceContent[];
};

/**
 * Internal linking block. Relationships are defined per service in
 * service-data.ts so only genuinely related services are linked.
 */
export default function RelatedServices({ services }: RelatedServicesProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Related services
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          These services are commonly delivered together with the scope on this
          page, or as a standalone package.
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                href={service.path}
                className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <span className="text-sm font-semibold text-slate-950">
                  {service.navLabel}
                </span>
                <span className="mt-3 text-xs font-medium text-slate-600">
                  View service
                  <span aria-hidden="true"> →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-slate-600">
          Looking for the full capability list?{" "}
          <Link
            href="/services"
            className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
          >
            View all AKEN services
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
