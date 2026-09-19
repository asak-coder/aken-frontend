import { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-data";
import { getProjectPath, getPublishedProjects } from "@/lib/projects/projects-data";
import { getServiceSummaries } from "@/lib/services/service-data";

const BASE_URL = "https://aken.firm.in";

type StaticRoute = {
  path: string;
  priority: number;
};

const STATIC_ROUTES: StaticRoute[] = [
  { path: "", priority: 1 },
  { path: "/services", priority: 0.9 },
  { path: "/projects", priority: 0.8 },
  { path: "/about", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/blog", priority: 0.7 },
  { path: "/careers", priority: 0.6 },
  { path: "/enquiry", priority: 0.6 },
  { path: "/capabilities-estimation", priority: 0.6 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/terms-and-conditions", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticUrls = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: route.priority,
  }));

  const serviceUrls = getServiceSummaries().map((service) => ({
    url: `${BASE_URL}${service.path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const blogUrls = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  /**
   * Only verified, publication-approved project case studies are listed.
   * Unverified records never reach the sitemap.
   */
  const projectUrls = getPublishedProjects().map((project) => ({
    url: `${BASE_URL}${getProjectPath(project.slug)}`,
    lastModified: new Date(project.verification.verifiedOn),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...serviceUrls, ...blogUrls, ...projectUrls];
}
