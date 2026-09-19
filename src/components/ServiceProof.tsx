import Image from "next/image";
import Link from "next/link";
import type { RepresentativeImage } from "@/lib/services/service-types";

type ServiceProofProps = {
  images: RepresentativeImage[];
};

/**
 * Project experience + representative imagery for a service landing page.
 *
 * There are no verified AKEN case studies published yet, so the experience
 * block shows an honest empty state rather than a fabricated project. All
 * images shown here are representative industrial imagery and are labelled as
 * such — they are never presented as AKEN project photographs.
 */
export default function ServiceProof({ images }: ServiceProofProps) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Project experience
        </h2>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-700">
            Verified AKEN project case studies for this service are being
            prepared. Project photographs, verified scope and verified outcomes
            will be published here as projects are completed and documentation
            is approved for release.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Until then, we publish nothing about a project that has not been
            verified. You are welcome to{" "}
            <Link
              href="/contact"
              className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
            >
              request references relevant to your scope
            </Link>{" "}
            during technical discussion.
          </p>
        </div>

        {images.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Representative imagery
            </h2>

            <p
              role="note"
              className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
            >
              <strong className="font-semibold">Please note:</strong> the images
              below are representative industrial imagery illustrating the
              discipline described on this page. They are not photographs of an
              AKEN project. Only photographs supplied or verified by
              A K ENGINEERING are ever published as AKEN project photographs.
            </p>

            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {images.map((image) => (
                <li
                  key={image.src}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="px-4 py-3 text-xs text-slate-600">{image.caption}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
