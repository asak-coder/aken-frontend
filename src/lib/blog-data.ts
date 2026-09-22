import type { BlogPost } from "./blog-data/types";
import { pebCostPerSqFtIndia } from "./blog-data/posts/peb-cost-per-sq-ft-india";
import { benefitsOfPreEngineeredBuildings } from "./blog-data/posts/benefits-of-pre-engineered-buildings";
import { pebVsRccIndustrialConstruction } from "./blog-data/posts/peb-vs-rcc-industrial-construction";

export type { BlogPost } from "./blog-data/types";

/**
 * Editorial rule for this list: every article must be factually defensible and
 * free of unverified AKEN project claims. Published third-party figures are
 * attributed in the article body; AKEN-specific numbers are not stated as fact
 * unless a verified record exists.
 *
 * Ordered newest first. Adding an entry here publishes it at
 * /blog/<slug> and includes it in the sitemap automatically.
 */
export const blogPosts: BlogPost[] = [
  pebCostPerSqFtIndia,
  benefitsOfPreEngineeredBuildings,
  pebVsRccIndustrialConstruction,
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}
