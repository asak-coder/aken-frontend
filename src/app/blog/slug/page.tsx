import Link from "next/link";
import { blogPosts } from "@/lib/blog-data";

export const metadata = {
  title: "Blog Library | A K ENGINEERING",
  description:
    "Browse published articles from A K ENGINEERING on PEB, steel fabrication and EPC execution.",
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
            <Link
              href={`/blog/${post.slug}`}
              className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
            >
              Read article
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
