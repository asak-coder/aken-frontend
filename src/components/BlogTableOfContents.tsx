import { parseBlogBlocks, extractHeadings } from "@/lib/blog-data/parse";

type BlogTableOfContentsProps = {
  content: string;
};

/**
 * Renders an "On this page" jump list from the article's H2 headings.
 * H3 headings are intentionally omitted so long articles stay scannable.
 */
export default function BlogTableOfContents({ content }: BlogTableOfContentsProps) {
  const sections = extractHeadings(parseBlogBlocks(content)).filter(
    (heading) => heading.level === 2,
  );

  if (sections.length < 3) return null;

  return (
    <nav
      aria-label="On this page"
      className="rounded-xl border border-gray-200 bg-gray-50 p-5 md:p-6"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        On this page
      </h2>
      <ol className="mt-3 space-y-2 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-700"
            >
              {section.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
