type ServiceApplicationsMaterialsProps = {
  applicationsHeadline: string;
  applications: string[];
  materialsHeadline: string;
  materialsNote: string;
  materials: string[];
};

/**
 * Applications and materials/systems sections. Both lists are supplied by the
 * page from verified service content — nothing is invented here.
 */
export default function ServiceApplicationsMaterials({
  applicationsHeadline,
  applications,
  materialsHeadline,
  materialsNote,
  materials,
}: ServiceApplicationsMaterialsProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2 lg:py-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {applicationsHeadline}
          </h2>
          <ul className="mt-6 space-y-3">
            {applications.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-600"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {materialsHeadline}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{materialsNote}</p>
          <ul className="mt-6 space-y-3">
            {materials.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
