import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost } from "@/lib/blog-data";
import { countWords } from "@/lib/blog-data/parse";
import BlogArticleBody from "@/components/BlogArticleBody";
import BlogTableOfContents from "@/components/BlogTableOfContents";
import TrackedLink from "@/components/TrackedLink";

type BlogPostRouteParams = {
  slug: string;
};

type BlogPostPageProps = {
  params: Promise<BlogPostRouteParams>;
};

const SITE_URL = "https://aken.firm.in";
const BLOG_BASE_URL = `${SITE_URL}/blog`;
const ORG_NAME = "A K ENGINEERING";
const SITE_BRAND = "AKEN";
const READING_WORDS_PER_MINUTE = 200;

function getPostUrl(slug: string) {
  return `${BLOG_BASE_URL}/${slug}`;
}

function estimateReadingTimeMinutes(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / READING_WORDS_PER_MINUTE));
}

function formatDisplayDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Blog Post Not Found | AKEN",
      description: "The requested article is not available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = getPostUrl(post.slug);
  const publishedTime = new Date(post.date).toISOString();
  const modifiedTime = new Date(post.updatedAt || post.date).toISOString();

  return {
    title: `${post.title} | AKEN`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: post.title,
      description: post.description,
      siteName: SITE_BRAND,
      publishedTime,
      modifiedTime,
      authors: [ORG_NAME],
      tags: post.keywords,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = getPostUrl(post.slug);
  const publishedIso = new Date(post.date).toISOString();
  const modifiedIso = new Date(post.updatedAt || post.date).toISOString();
  const wordCount = countWords(post.content);
  const readingMinutes = estimateReadingTimeMinutes(wordCount);
  const isRevised = Boolean(post.updatedAt && post.updatedAt !== post.date);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
    },
    articleSection: "Industrial Engineering",
    keywords: post.keywords.join(", "),
    wordCount,
    timeRequired: `PT${readingMinutes}M`,
    inLanguage: "en-IN",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: BLOG_BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="bg-black px-6 py-16 text-center text-white md:py-20">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto mb-6 flex max-w-4xl justify-center gap-2 text-sm text-gray-400"
        >
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog" className="hover:text-white">
            Blog
          </Link>
        </nav>
        <h1 className="mx-auto max-w-4xl text-3xl font-bold md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-gray-300">
          Published {formatDisplayDate(post.date)}
          {isRevised ? ` · Updated ${formatDisplayDate(post.updatedAt as string)}` : ""}
          {` · ${readingMinutes} min read`}
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 md:py-14">
        <BlogTableOfContents content={post.content} />

        <div className="mt-10">
          <BlogArticleBody content={post.content} />
        </div>

        <aside className="mt-14 rounded-xl border border-gray-200 bg-gray-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Planning a shed, warehouse or plant structure?
          </h2>
          <p className="mt-3 leading-relaxed text-gray-700">
            Share your drawings, GA or BOQ for a scope review. Figures provided at
            enquiry stage are preliminary and budgetary; firm pricing follows drawing
            freeze and confirmation of site conditions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedLink
              href="/enquiry"
              ctaName="Submit Project Requirement"
              ctaLocation="blog_post_cta"
              eventName="blog_cta_click"
              className="rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Submit Project Requirement
            </TrackedLink>
            <TrackedLink
              href="/contact"
              ctaName="Contact Engineering Team"
              ctaLocation="blog_post_cta"
              eventName="blog_cta_click"
              className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-900 transition hover:border-gray-900"
            >
              Contact Our Engineering Team
            </TrackedLink>
          </div>
        </aside>

        <div className="mt-10 border-t border-gray-200 pt-6">
          <TrackedLink
            href="/blog"
            ctaName="Back to all articles"
            ctaLocation="blog_post_footer"
            eventName="blog_back_click"
            className="font-semibold text-blue-600 hover:underline"
          >
            Back to all articles
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
