import ProjectGallery, { ProjectGalleryItem } from "@/components/ProjectGallery";

type RepresentativeGalleryProps = {
  headline: string;
  items: ProjectGalleryItem[];
};

/**
 * Representative industrial imagery block.
 *
 * The images in this block are NOT AKEN project photographs. The notice is
 * rendered with the gallery so representative imagery can never be presented
 * as an AKEN project.
 */
export default function RepresentativeGallery({
  headline,
  items,
}: RepresentativeGalleryProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900">{headline}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
        Representative industrial imagery illustrating this discipline. These
        are not photographs of an AKEN project. Only photographs supplied or
        verified by A K ENGINEERING are published as AKEN project photographs.
      </p>
      <div className="mt-6">
        <ProjectGallery items={items} />
      </div>
    </div>
  );
}
