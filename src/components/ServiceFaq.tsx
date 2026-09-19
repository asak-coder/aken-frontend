import type { FaqItem } from "@/lib/services/service-types";

type ServiceFaqProps = {
  faqs: FaqItem[];
};

/**
 * Customer / procurement FAQ. Implemented with native details/summary so it
 * works without JavaScript and stays keyboard accessible.
 */
export default function ServiceFaq({ faqs }: ServiceFaqProps) {
  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-14 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Practical questions from procurement, plant and project teams. If your
          question is not answered here, our engineering team can review your
          scope directly.
        </p>

        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 open:bg-white open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                <span>{faq.question}</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
