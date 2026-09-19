import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

/**
 * Accessible breadcrumb trail. The final item is the current page and is
 * rendered as plain text with aria-current.
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-3">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const key = `${item.label}-${index}`;

            return (
              <li key={key} className="flex items-center gap-2">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="rounded transition hover:text-slate-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "font-semibold text-slate-900" : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast ? (
                  <span aria-hidden="true" className="text-slate-400">
                    /
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
