import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/blog-data";

type BlogPostRouteParams = {
  slug: string;
};

type BlogPostPageProps = {
  params: Promise<BlogPostRouteParams>;
};

function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function generateStaticParams(): BlogPostRouteParams[] {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Post Not Found | A K ENGINEERING",
      description: "The requested article is not available.",
    };
  }

  return {
    title: `${post.title} | A K ENGINEERING`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const contentLines = post.content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="bg-black px-6 py-20 text-center text-white">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-gray-300">Published on {post.date}</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14">
        <article className="space-y-5 leading-relaxed text-gray-700">
          {contentLines.map((line, index) => (
            <p key={`${post.slug}-${index}`}>{line}</p>
          ))}
        </article>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <Link href="/blog" className="font-semibold text-blue-600 hover:underline">
            Back to all articles
          </Link>
        </div>
      </section>
    </main>
  );
}
