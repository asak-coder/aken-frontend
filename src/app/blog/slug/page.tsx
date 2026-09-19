import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog-data";
import TrackedLink from "@/components/TrackedLink";

/**
 * This route duplicates the /blog article listing. It is kept so that existing
 * links do not break, but it is deliberately excluded from search results and
 * declares /blog as its canonical so the duplicate is consolidated.
 */
export const metadata: Metadata = {
  title: "Blog Library | AKEN",
  description:
    "Browse published articles from AKEN, a brand of A K ENGINEERING, on PEB, steel fabrication and EPC execution.",
  alternates: {
    canonical: "/blog",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://aken.firm.in/blog",
    title: "Blog Library | AKEN",
    description:
      "Browse published articles from AKEN, a brand of A K ENGINEERING, on PEB, steel fabrication and EPC execution.",
    siteName: "AKEN",
    locale: "en_IN",
  },
};

export default function BlogLibraryPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="bg-black px-6 py-20 text-center text-white">
        <h1 className="text-4xl font-bold md:text-5xl">Article Library</h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-300">
          Choose an article below to read detailed industry insights.
        </p>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-6 py-14">
        {blogPosts.map((post) => (
          <article
            key={post.slug}
            className="rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <p className="mb-2 text-sm text-gray-500">Published on {post.date}</p>
            <h2 className="text-2xl font-semibold">{post.title}</h2>
            <p className="mt-3 text-gray-700">{post.description}</p>
            <TrackedLink
              href={`/blog/${post.slug}`}
              ctaName={post.title}
              ctaLocation="blog_library"
              eventName="blog_article_click"
              className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
            >
              Read article
            </TrackedLink>
          </article>
        ))}
      </section>
    </main>
  );
}
