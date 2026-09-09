import type { Metadata } from "next";
import ProjectGallery, { ProjectGalleryItem } from "@/components/ProjectGallery";

export const metadata: Metadata = {
  title: "Industrial Steel Capability Showcase | AKEN – A K ENGINEERING",
  description:
    "A representative showcase of AKEN's industrial steel fabrication, PEB construction, structural erection, roofing and cladding capability imagery. AKEN is a brand of A K ENGINEERING.",
};

const galleryItems: ProjectGalleryItem[] = [
  {
    src: "/projects/peb-shed-erection.jpg",
    alt: "PEB steel shed frame erected at an Indian industrial construction site",
    title: "PEB Shed Erection",
  },
  {
    src: "/projects/steel-fabrication-workshop-cutting-welding.jpg",
    alt: "Structural steel cutting and welding work in an Indian fabrication workshop",
    title: "Steel Fabrication",
  },
  {
    src: "/projects/structure-erection-crane-lifting.jpg",
    alt: "Crane-lifting and steel structure erection at an Indian industrial site",
    title: "Structure Erection",
  },
  {
    src: "/projects/roofing-cladding-industrial-shed.jpg",
    alt: "Roofing and cladding installation on an industrial steel shed in India",
    title: "Roofing & Cladding",
  },
  {
    src: "/projects/puf-panel-installation-insulated-shed.jpg",
    alt: "Insulated panel installation on an industrial shed at an Indian site",
    title: "Insulated Panel Installation",
  },
];

export default function ProjectsPage() {
  return (
    <main className="bg-white text-gray-900">
      <section className="bg-black text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold">
            CAPABILITY SHOWCASE
          </h1>
          <p className="mt-4 max-w-3xl text-gray-300">
            Representative industrial imagery illustrating the fabrication,
            PEB construction, structural erection, roofing and cladding
            disciplines that underpin the AKEN brand. AKEN is a brand of
            A K ENGINEERING.
          </p>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <ProjectGallery title="Capability Imagery" items={galleryItems} />
        </div>
      </section>
    </main>
  );
}
