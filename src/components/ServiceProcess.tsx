import type { ProcessStep } from "@/lib/services/service-types";

type ServiceProcessProps = {
  headline: string;
  note: string;
  steps: ProcessStep[];
};

/**
 * Engineering / execution approach. Only stages actually offered are passed in
 * by the page — this component does not add stages of its own.
 */
export default function ServiceProcess({ headline, note, steps }: ServiceProcessProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {headline}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{note}</p>

        <ol className="mt-8 grid gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
