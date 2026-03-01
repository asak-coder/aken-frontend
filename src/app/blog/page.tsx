import Link from "next/link";
import { blogPosts } from "@/lib/blog-data";
import { trackEvent } from "@/lib/analytics";

export const metadata = {
  title: "Industrial Engineering Blog | A K ENGINEERING",
  description:
    "Read expert articles on Pre-Engineered Buildings, Industrial Steel Fabrication and EPC project execution.",
};
<><a
    href="https://wa.me/919999999999"
    onClick={() => trackEvent("whatsapp_click", {
        event_category: "engagement",
        event_label: "WhatsApp Button",
    })}
>
    WhatsApp
</a><a
    href="tel:+919999999999"
    onClick={() => trackEvent("phone_click", {
        event_category: "engagement",
        event_label: "Phone Call Button",
    })}
>
        Call Now
    </a></>
export default function BlogPage() {
  return (
    <main className="bg-white text-gray-900 min-h-screen">

      <section className="bg-black text-white py-20 text-center">
        <h1 className="text-4xl font-bold">
          Industrial Engineering Blog
        </h1>
        <p className="mt-4 text-gray-300">
          Insights on PEB, Steel Fabrication & Industrial EPC Projects
        </p>
      </section>

      <section className="max-w-5xl mx-auto py-16 px-6">
        <div className="space-y-10">
          {blogPosts.map((post) => (
            <div key={post.slug} className="border-b pb-8">
              <h2 className="text-2xl font-semibold mb-2">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="text-gray-600 mb-2">
                {post.description}
              </p>

              <p className="text-sm text-gray-400">
                Published on {post.date}
              </p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}