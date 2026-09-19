type ServiceScopeProps = {
  headline: string;
  items: string[];
};

/**
 * Structured "scope of work" list for a service landing page.
 * Only genuine scope items are passed in by the page.
 */
export default function ServiceScope({ headline, items }: ServiceScopeProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {headline}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          Scope is confirmed against your drawings, BOQ and site conditions
          before work is released.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-orange-600"
              >
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
