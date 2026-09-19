import type { WhyAkenItem } from "@/lib/services/service-types";

type ServiceOverviewProps = {
  headline: string;
  paragraphs: string[];
  whyAkenHeadline: string;
  whyAken: WhyAkenItem[];
};

/**
 * Service overview followed by the "why AKEN" points. Both are supplied by the
 * page — no capability or statistic is added here.
 */
export default function ServiceOverview({
  headline,
  paragraphs,
  whyAkenHeadline,
  whyAken,
}: ServiceOverviewProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {headline}
        </h2>

        <div className="mt-5 max-w-3xl space-y-4">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-base leading-relaxed text-slate-700"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <h2 className="mt-14 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {whyAkenHeadline}
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {whyAken.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
            >
              <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
