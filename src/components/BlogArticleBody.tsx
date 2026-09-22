import type { ReactNode } from "react";
import Link from "next/link";
import type { BlogBlock } from "@/lib/blog-data/types";
import { parseBlogBlocks } from "@/lib/blog-data/parse";

type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "link"; value: string; href: string };

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
const STRONG_PATTERN = /^\*\*([^*]+)\*\*$/;
const LINK_PATTERN = /^\[([^\]]+)\]\(([^)]+)\)$/;
const EXTERNAL_HREF_PATTERN = /^https?:\/\//;

function parseInline(text: string): InlineNode[] {
  return text
    .split(INLINE_PATTERN)
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const strongMatch = segment.match(STRONG_PATTERN);
      if (strongMatch) return { kind: "strong", value: strongMatch[1] };

      const linkMatch = segment.match(LINK_PATTERN);
      if (linkMatch) {
        return { kind: "link", value: linkMatch[1], href: linkMatch[2] };
      }

      return { kind: "text", value: segment };
    });
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return parseInline(text).map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.kind === "strong") {
      return (
        <strong key={key} className="font-semibold text-gray-900">
          {node.value}
        </strong>
      );
    }

    if (node.kind === "link") {
      const isExternal = EXTERNAL_HREF_PATTERN.test(node.href);
      const isSamePageAnchor = node.href.startsWith("#");

      if (isExternal || isSamePageAnchor) {
        return (
          <a
            key={key}
            href={node.href}
            className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-700"
            {...(isExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {node.value}
          </a>
        );
      }

      return (
        <Link
          key={key}
          href={node.href}
          className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-700"
        >
          {node.value}
        </Link>
      );
    }

    return <span key={key}>{node.value}</span>;
  });
}

function renderBlock(block: BlogBlock, index: number) {
  const key = `block-${index}`;

  switch (block.kind) {
    case "heading": {
      if (block.level === 3) {
        return (
          <h3
            key={key}
            id={block.id}
            className="scroll-mt-28 pt-3 text-xl font-semibold text-gray-900"
          >
            {renderInline(block.text, key)}
          </h3>
        );
      }

      return (
        <h2
          key={key}
          id={block.id}
          className="scroll-mt-28 border-t border-gray-200 pt-8 text-2xl font-bold text-gray-900 md:text-3xl"
        >
          {renderInline(block.text, key)}
        </h2>
      );
    }

    case "paragraph":
      return (
        <p key={key} className="leading-relaxed text-gray-700">
          {renderInline(block.text, key)}
        </p>
      );

    case "bulletList":
      return (
        <ul key={key} className="ml-5 list-disc space-y-2 leading-relaxed text-gray-700">
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>
              {renderInline(item, `${key}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );

    case "numberedList":
      return (
        <ol
          key={key}
          className="ml-5 list-decimal space-y-2 leading-relaxed text-gray-700"
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>
              {renderInline(item, `${key}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );

    case "table":
      return (
        <div key={key} className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                {block.header.map((cell, cellIndex) => (
                  <th
                    key={`${key}-h-${cellIndex}`}
                    scope="col"
                    className="px-3 py-3 align-top font-semibold text-gray-900"
                  >
                    {renderInline(cell, `${key}-h-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${key}-r-${rowIndex}`} className="border-b border-gray-200">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${key}-r-${rowIndex}-c-${cellIndex}`}
                      className="px-3 py-3 align-top text-gray-700"
                    >
                      {cell ? renderInline(cell, `${key}-r-${rowIndex}-c-${cellIndex}`) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "divider":
      return <hr key={key} className="border-gray-200" />;

    default:
      return null;
  }
}

type BlogArticleBodyProps = {
  content: string;
};

export default function BlogArticleBody({ content }: BlogArticleBodyProps) {
  const blocks = parseBlogBlocks(content);

  return (
    <div className="space-y-5 leading-relaxed text-gray-700">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
