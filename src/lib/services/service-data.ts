import {
  SERVICE_SLUGS,
  type ServiceContent,
  type ServiceLandingSummary,
  type ServiceSlug,
} from "@/lib/services/service-types";

/**
 * Service landing page content.
 *
 * SOURCING RULE: every capability, scope item and process stage below is
 * reused from content already published by A K ENGINEERING on /services or
 * /about. Nothing here introduces a new machine, certification, client,
 * project, tonnage, date or performance statistic.
 */

const peb: ServiceContent = {
  slug: "peb",
  path: "/services/peb",
  navLabel: "Pre-Engineered Buildings (PEB)",
  title: "Pre-Engineered Buildings (PEB) in Sambalpur, Odisha | AKEN",
  metaDescription:
    "AKEN delivers pre-engineered buildings for warehouses, industrial sheds and plant buildings in Sambalpur, Odisha — design coordination, fabrication and erection with controlled quality checks.",
  openGraphTitle: "Pre-Engineered Buildings (PEB) | AKEN — A K ENGINEERING",
  openGraphDescription:
    "Turnkey PEB execution for industrial warehouses and factory sheds: structural fabrication, erection with alignment control, roofing, cladding and accessories.",
  h1: "Pre-Engineered Buildings (PEB)",
  heroStatement:
    "Engineered steel building systems for industrial sheds, warehouses and plant buildings.",
  heroIntro:
    "AKEN, a brand of A K ENGINEERING, coordinates design intent with fabrication and on-site erection so the structure meets the required span, height and loading — with a predictable assembly sequence and controlled quality checks. Our base is Hirakud, Sambalpur, and we execute across Odisha and pan-India.",
  overviewHeadline: "What PEB delivery involves at AKEN",
  overviewParagraphs: [
    "A pre-engineered building is a steel building system in which primary frames, secondary members, bracing and sheeting are coordinated as one engineered package. For industrial projects this supports faster site work, consistent fabrication quality and bay layouts that can be planned for future expansion.",
    "AKEN takes a single-responsibility approach across PEB structural fabrication and supply coordination, column and rafter erection, roofing and cladding installation, and the accessories that complete the envelope. Scope, drawing release and inspection checkpoints are agreed before fabrication begins so that site work stays predictable.",
    "Where a project needs it, PEB bays can be integrated with mezzanine or lean-to provisions. Applicability is confirmed during technical review against your drawings, BOQ and site conditions.",
  ],
  scopeHeadline: "Scope of work",
  scopeItems: [
    "PEB structural fabrication and supply coordination",
    "Column, rafter and bracing erection with alignment control",
    "Roofing, sheeting and cladding installation",
    "Gutters, down-take pipes, flashings and accessories",
    "Mezzanine and lean-to integration with expansion provisions",
    "Site quality checks for plumb, level, marking and bolt-up",
  ],
  processHeadline: "Engineering and execution approach",
  processNote:
    "Stages applied depend on the agreed scope, drawing release schedule and site conditions. No stage is offered that is not part of the confirmed scope.",
  processSteps: [
    {
      title: "Requirement and layout understanding",
      detail:
        "Clear span, eave height, bay spacing, crane or equipment needs and access constraints are established from your drawings, GA and BOQ.",
    },
    {
      title: "Design coordination and drawing freeze",
      detail:
        "Interface points and connection intent are coordinated and drawings are frozen before fabrication, so shop work is not released against a moving design.",
    },
    {
      title: "Fabrication and quality checks",
      detail:
        "Members are fabricated with fit-up and dimensional checks, controlled welding parameters and dispatch marking to support smooth site assembly.",
    },
    {
      title: "Transport planning and site readiness",
      detail:
        "Delivery sequence, member stacking and access requirements are planned against site readiness to avoid double handling.",
    },
    {
      title: "Erection, alignment and bolting",
      detail:
        "Columns, rafters and bracing are erected in sequence with alignment and stability checks, followed by controlled bolting.",
    },
    {
      title: "Roofing, cladding and accessories",
      detail:
        "Sheeting and cladding are installed with correct overlaps, fastening patterns and flashing detailing, along with gutters and down-takes.",
    },
    {
      title: "Final checks and handover",
      detail:
        "Completion checks and punch-list closure support handover, with as-built information as per project requirement.",
    },
  ],
  applicationsHeadline: "Where PEB is used",
  applications: [
    "Warehouses and logistics sheds",
    "Manufacturing units and factory sheds",
    "Workshops and maintenance bays",
    "Industrial storage and utility buildings",
    "Ancillary sheds for power, cement and mining plants",
  ],
  materialsHeadline: "Materials and systems",
  materialsNote:
    "Systems are selected against your drawings and BOQ. The items below describe the categories AKEN works with, not a fixed specification.",
  materials: [
    "Primary framing members and built-up sections",
    "Secondary members including purlins and girts",
    "Bracing and connection elements",
    "Roofing and wall sheeting or cladding systems",
    "Gutters, down-take pipes, flashings and accessories",
  ],
  whyAkenHeadline: "Why industrial clients involve AKEN in PEB work",
  whyAken: [
    {
      title: "Fabrication and erection under one team",
      text: "The same organisation coordinates shop fabrication and site erection, which reduces interface risk between two separate vendors.",
    },
    {
      title: "Alignment and stability discipline",
      text: "Erection is planned with sequencing, alignment checks and bolting discipline so intermediate stability is controlled.",
    },
    {
      title: "Quality checks before dispatch",
      text: "Fit-up, dimensional verification and marking are done before members leave the fabrication stage, which supports faster site fit.",
    },
    {
      title: "Local base, wider reach",
      text: "Planning is coordinated from our Hirakud, Sambalpur base with execution experience across Odisha and other Indian states.",
    },
  ],
  faqs: [
    {
      question: "What information does AKEN need to quote a PEB project?",
      answer:
        "Share the location, approximate area, span, eave height, intended usage (warehouse, factory shed, storage), any crane or load requirements, and drawings or BOQ if available. Site readiness and access constraints also help us plan erection.",
    },
    {
      question: "Can an existing PEB shed be extended later?",
      answer:
        "Expansion provisions can be planned during the initial scope so that future bays or mezzanine additions integrate more cleanly. Whether a specific existing shed can be extended depends on its design and condition, which we review before advising.",
    },
    {
      question: "Does AKEN handle roofing and cladding with the PEB structure?",
      answer:
        "Yes. Roofing, sheeting and cladding installation, along with gutters, down-takes, flashings and accessories, can be included in the same scope as the structural work.",
    },
    {
      question: "How is quality controlled during PEB execution?",
      answer:
        "Fabrication includes fit-up and dimensional checks, controlled welding parameters and dispatch marking. On site we follow sequence planning, alignment checks, bolting discipline and documented inspection support as per project requirement.",
    },
    {
      question: "Do you work outside Odisha?",
      answer:
        "Our base is Hirakud, Sambalpur, Odisha, and we execute projects pan-India. Logistics and site access are reviewed during estimation.",
    },
  ],
  representativeImages: [
    {
      src: "/projects/peb-primary-frame-erection-crane.jpg",
      alt: "Tapered built-up PEB rafters being erected by a mobile crane, with roof purlins, wall girts and cross bracing installed at an Indian industrial project site",
      caption:
        "PEB primary frame erection — tapered rafters, purlins and girts — representative industrial imagery",
    },
    {
      src: "/projects/peb-warehouse-construction.jpg",
      alt: "Pre-engineered steel building frame under construction at an industrial site",
      caption: "PEB warehouse frame — representative industrial imagery",
    },
    {
      src: "/projects/peb-shed-erection.jpg",
      alt: "Pre-engineered steel shed frame being erected at an industrial construction site",
      caption: "PEB shed erection — representative industrial imagery",
    },
  ],
  relatedServiceSlugs: [
    "structural-steel-erection",
    "roofing-wall-cladding",
    "structural-steel-fabrication",
  ],
};

const fabrication: ServiceContent = {
  slug: "structural-steel-fabrication",
  path: "/services/structural-steel-fabrication",
  navLabel: "Structural Steel Fabrication",
  title: "Structural Steel Fabrication in Sambalpur, Odisha | AKEN",
  metaDescription:
    "Structural steel fabrication for industrial projects in Sambalpur and across Odisha — beams, columns, trusses, bracings, platforms and built-up sections, with fit-up and inspection discipline.",
  openGraphTitle: "Structural Steel Fabrication | AKEN — A K ENGINEERING",
  openGraphDescription:
    "Industrial steel fabrication: built-up sections, platforms, supports and conveyor structures, executed with dimensional control and dispatch marking.",
  h1: "Structural Steel Fabrication",
  heroStatement:
    "Shop-controlled fabrication that assembles accurately on site.",
  heroIntro:
    "AKEN, a brand of A K ENGINEERING, fabricates structural steel for industrial structures — built-up sections, platforms, support frames, trusses and plate work as per drawings and BOQ. Fabrication is planned from our Hirakud, Sambalpur base with fit-up, dimensional and dispatch discipline to support predictable assembly on site.",
  overviewHeadline: "How AKEN approaches steel fabrication",
  overviewParagraphs: [
    "Most rework at site traces back to fabrication and fit-up decisions made in the shop. AKEN structures its fabrication process around dimensional control, correct member marking and controlled welding parameters, so that components arrive in a condition that supports fast, accurate erection.",
    "Fabrication scope is taken from your drawings and BOQ. Where a project requires it, trial assembly and dispatch marking are used to confirm interfaces on complex or multi-member assemblies before transport.",
    "For retrofit and expansion work, small and mid-sized fabrication packages are produced to suit site constraints, including support structures and access items required during execution.",
  ],
  scopeHeadline: "Fabrication scope",
  scopeItems: [
    "Beams, columns, trusses, bracings and built-up sections",
    "Platforms, walkways, ladders and handrails",
    "Conveyor galleries and industrial equipment structures",
    "Fit-up, welding, grinding, trial assembly and dispatch marking",
    "Fabrication support for retrofits and plant expansions",
    "Material identification and traceability as per project requirement",
  ],
  processHeadline: "Workshop process, stage by stage",
  processNote:
    "The stages below apply as per drawing and project requirement. Inspection scope and hold points are agreed with the client's QA requirements.",
  processSteps: [
    {
      title: "Material identification and traceability",
      detail:
        "Material is identified against the approved drawings and BOQ, with traceability maintained where the project requires documented records.",
    },
    {
      title: "Cutting and edge preparation",
      detail:
        "Members are cut and prepared with correct edge condition to suit the connection detail and subsequent welding.",
    },
    {
      title: "Fit-up control and dimensional checks",
      detail:
        "Assemblies are fitted up and checked dimensionally — the stage that most determines whether site erection stays on schedule.",
    },
    {
      title: "Welding with controlled parameters",
      detail:
        "Welding is executed with controlled parameters and discipline appropriate to the joint and the project specification.",
    },
    {
      title: "Grinding and finishing",
      detail:
        "Grinding and finishing are carried out as required to achieve the surface condition needed for coating or acceptance.",
    },
    {
      title: "Surface preparation and coating coordination",
      detail:
        "Surface preparation and coating are coordinated as per project requirement before dispatch.",
    },
    {
      title: "Dispatch marking and loading",
      detail:
        "Members are marked and loaded to match the erection sequence, with safe material handling during loading.",
    },
  ],
  applicationsHeadline: "Typical applications",
  applications: [
    "Power plants and aluminium plants",
    "Cement plants and mining installations",
    "Warehousing and manufacturing units",
    "Process lines, conveyors and material handling systems",
    "Plant expansion and modification packages",
  ],
  materialsHeadline: "Materials and work categories",
  materialsNote:
    "Fabrication is executed to your drawings and BOQ. The categories below describe work AKEN undertakes rather than a fixed specification.",
  materials: [
    "Rolled structural sections and built-up members",
    "Plate work, gussets and connection elements",
    "Platform, walkway, ladder and handrail steelwork",
    "Support frames for conveyors and process equipment",
    "Coating and surface preparation coordination",
  ],
  whyAkenHeadline: "Why fabrication quality matters here",
  whyAken: [
    {
      title: "Fewer site surprises",
      text: "Controlled fit-up and dimensional checks in the shop reduce the chance of expensive rework during site erection.",
    },
    {
      title: "Skilled fabrication team",
      text: "Work is executed by welders, fitters and fabricators with supervision for assembly planning and dimensional checks.",
    },
    {
      title: "Marking matched to erection sequence",
      text: "Members are marked and dispatched to suit the planned erection order, which reduces handling and searching on site.",
    },
    {
      title: "Practical for retrofit work",
      text: "Fabrication packages can be sized and sequenced to suit live-plant constraints where large deliveries are impractical.",
    },
  ],
  faqs: [
    {
      question: "What should I share for a fabrication quotation?",
      answer:
        "Approved drawings or GA drawings, the BOQ or tonnage basis, the material and coating specification, inspection or documentation requirements, and the delivery location and timeline.",
    },
    {
      question: "Does AKEN support inspection and documentation requirements?",
      answer:
        "Yes. Fit-up checks, dimensional verification and weld inspection support are provided as per client requirement, along with documentation support aligned to project needs.",
    },
    {
      question: "Can you fabricate for an existing plant that is in operation?",
      answer:
        "For brownfield or operating plants, fabrication is planned around site access, permit constraints and available laydown area. Scope and sequencing are agreed during technical review.",
    },
    {
      question: "Is trial assembly part of your fabrication scope?",
      answer:
        "Trial assembly is used where the project or assembly complexity calls for it, particularly on high-interface or multi-member structures. It is confirmed during scope finalisation.",
    },
    {
      question: "How is coating handled?",
      answer:
        "Surface preparation and coating are coordinated as per the project specification before dispatch. The exact system is taken from your drawings and specification.",
    },
  ],
  representativeImages: [
    {
      src: "/projects/steel-fabrication-workshop-cutting-welding.jpg",
      alt: "Structural steel cutting and welding work in an industrial fabrication workshop",
      caption: "Workshop fabrication — representative industrial imagery",
    },
    {
      src: "/projects/steel-beam-column-fabrication.jpg",
      alt: "Fabricated steel beams and columns prepared in an industrial fabrication workshop",
      caption: "Beam and column fabrication — representative industrial imagery",
    },
  ],
  relatedServiceSlugs: [
    "structural-steel-erection",
    "heavy-fabrication",
    "peb",
  ],
};
const erection: ServiceContent = {
  slug: "structural-steel-erection",
  path: "/services/structural-steel-erection",
  navLabel: "Structural Steel Erection",
  title: "Structural Steel Erection in Sambalpur & Odisha | AKEN",
  metaDescription:
    "Structural steel erection for industrial sheds and plant structures in Sambalpur and across Odisha — sequence planning, crane and lifting plans, alignment checks and safe site execution.",
  openGraphTitle: "Structural Steel Erection | AKEN — A K ENGINEERING",
  openGraphDescription:
    "Controlled structural steel erection: erection sequencing, lifting plans, alignment and bolting discipline, executed under site safety procedures.",
  h1: "Structural Steel Erection",
  heroStatement:
    "Erection planned as controlled execution — sequence, lifting and alignment.",
  heroIntro:
    "AKEN, a brand of A K ENGINEERING, executes steel erection for industrial sheds, process buildings, conveyors and equipment support structures. Erection is planned with sequencing, crane selection, lifting methods and alignment procedures so structural stability is maintained at every intermediate stage. Base: Hirakud, Sambalpur, Odisha.",
  overviewHeadline: "Erection is controlled execution, not guesswork",
  overviewParagraphs: [
    "Steel structures are most vulnerable while they are partly erected. AKEN treats erection as a planned sequence: which members go up first, where the crane stands, how temporary stability is maintained, and how bolting and alignment are verified before the next bay is released.",
    "This planning matters most during shutdown windows and in live plants, where access is restricted, work fronts are time-bound and hot work is controlled. Our site teams work to agreed method statements, lifting plans and permit conditions.",
    "Erection scope is taken from your drawings and site conditions. Where anchor or base plate conditions need attention, that is identified during the site readiness review before lifting begins.",
  ],
  scopeHeadline: "Erection scope",
  scopeItems: [
    "Sequence planning for columns, rafters, bracings and trusses",
    "Rigging, lifting, bolting, levelling and alignment checks",
    "Anchor bolt coordination and base plate levelling support",
    "Assembly of platforms, galleries and access systems",
    "As-built support and punch list closure",
    "Shutdown-window erection planning where required",
  ],
  processHeadline: "Typical erection steps",
  processNote:
    "The steps below describe the erection method for structural steel scope. The applied sequence is confirmed against your drawings, site access and permitting conditions.",
  processSteps: [
    {
      title: "Site readiness review and material stacking",
      detail:
        "Access routes, laydown and stacking are agreed so that members are available in erection order rather than being searched for on site.",
    },
    {
      title: "Crane selection and lifting plan",
      detail:
        "Crane capacity, position and lifting points are planned for each member group with rigging checks before lifts commence.",
    },
    {
      title: "Base plate and anchor verification",
      detail:
        "Foundation and anchor conditions are verified against the drawings where applicable, before columns are placed.",
    },
    {
      title: "Column and beam erection with alignment checks",
      detail:
        "Members are erected in sequence with plumb and alignment checks as each unit is released.",
    },
    {
      title: "Bolting and stability checks",
      detail:
        "Controlled bolting is carried out, with torque discipline where specified, and intermediate stability confirmed before progressive release.",
    },
    {
      title: "Final plumbing, bracing and finishing",
      detail:
        "Final plumbing, bracing installation and finishing complete the structural frame before handover.",
    },
    {
      title: "Handover and punch list closure",
      detail:
        "Punch list items are closed out and documentation support is provided as per project requirement.",
    },
  ],
  applicationsHeadline: "Where erection capability is applied",
  applications: [
    "Industrial sheds and process buildings",
    "Power plants and aluminium plants",
    "Cement plants and mining installations",
    "Warehousing and manufacturing units",
    "Plant expansion and brownfield structural works",
  ],
  materialsHeadline: "Systems and site practices",
  materialsNote:
    "Erection follows your approved drawings and method requirements. The items below describe the systems and site practices involved.",
  materials: [
    "Columns, rafters, beams and bracing members",
    "Trusses, platforms, galleries and access steelwork",
    "Bolted connections with torque discipline where specified",
    "Anchor and base plate interface coordination",
    "Working-at-height and lifting equipment practices",
  ],
  whyAkenHeadline: "Why erection planning matters on industrial sites",
  whyAken: [
    {
      title: "Reduced site risk",
      text: "Rigging, lifting and access are planned ahead, with supervision at the critical lifts rather than improvised on the day.",
    },
    {
      title: "Schedule control",
      text: "Sequence planning and member marking mean the crew is not waiting for members or re-deciding the order of work.",
    },
    {
      title: "Accuracy at first fit",
      text: "Marked and trial-fitted components support faster bolt-up and better alignment for multi-bay structures.",
    },
    {
      title: "Shutdown-ready planning",
      text: "Work fronts can be planned against outage windows with defined sequence, so time in the window is used effectively.",
    },
  ],
  faqs: [
    {
      question: "What do you need before an erection quotation?",
      answer:
        "Structural drawings, the scope split between supply and erection, site access and crane movement constraints, the planned shutdown window if any, and the site readiness status of foundations and laydown area.",
    },
    {
      question: "How do you handle safety during steel erection?",
      answer:
        "Lifting is supervised with rigging checks, working-at-height controls and fall protection are applied, work areas are barricaded, and toolbox talks are held. Site-specific safety requirements and permit systems are followed where applicable.",
    },
    {
      question: "Can erection be executed inside a running plant?",
      answer:
        "Yes, where access and permits allow. Brownfield erection is planned around live utilities, restricted laydown and permit conditions, and the sequencing is agreed with plant operations before mobilisation.",
    },
    {
      question: "Do you handle roofing and cladding after erection?",
      answer:
        "Roofing, sheeting, cladding and accessories can be included in the same scope so the structure is enclosed by the same team that erected it.",
    },
    {
      question: "How is alignment verified?",
      answer:
        "Columns and members are checked for plumb and alignment during erection and before bolting is finalised. Verification is carried out as per the project's QA requirements.",
    },
  ],
  representativeImages: [
    {
      src: "/projects/structure-erection-crane-lifting.jpg",
      alt: "Crane lifting a steel structural member during erection at an industrial site",
      caption: "Structure erection by crane — representative industrial imagery",
    },
    {
      src: "/projects/peb-shed-erection.jpg",
      alt: "Steel shed frame being erected at an industrial construction site",
      caption: "Shed frame erection — representative industrial imagery",
    },
  ],
  relatedServiceSlugs: [
    "structural-steel-fabrication",
    "peb",
    "industrial-maintenance-shutdown",
  ],
};

const roofingCladding: ServiceContent = {
  slug: "roofing-wall-cladding",
  path: "/services/roofing-wall-cladding",
  navLabel: "Industrial Roofing & Wall Cladding",
  title: "Industrial Roofing & Wall Cladding in Odisha | AKEN",
  metaDescription:
    "Industrial roofing and wall cladding installation in Odisha — sheet and insulated panel systems, flashing and accessory detailing, and leak rectification for existing sheds.",
  openGraphTitle: "Industrial Roofing & Wall Cladding | AKEN — A K ENGINEERING",
  openGraphDescription:
    "Industrial roofing, sheeting and wall cladding with correct overlaps, fastening patterns, flashing and rainwater detailing.",
  h1: "Industrial Roofing & Wall Cladding",
  heroStatement:
    "Envelope work where detailing decides long-term performance.",
  heroIntro:
    "AKEN, a brand of A K ENGINEERING, installs industrial roofing sheets, wall cladding and insulated panel systems with correct overlaps, sealants and flashing details. Detailing quality determines whether a shed stays leak-free and serviceable, so installation is supervised rather than left to fastening speed alone.",
  overviewHeadline: "Why roofing and cladding quality shows up later",
  overviewParagraphs: [
    "A structure can be fabricated and erected correctly and still perform poorly if the envelope is detailed badly. Water ingress, premature corrosion at cut edges and air leakage usually trace back to overlaps, fastening patterns, flashing junctions and penetrations.",
    "AKEN installs roofing, sheeting and wall cladding for PEB and conventional steel sheds, along with the accessories that complete the envelope — gutters, ridge caps, flashings, louvers and ventilators. Insulated panel systems are installed where the requirement calls for thermal performance.",
    "For existing sheds, leak rectification and sheet replacement work is carried out after assessing the actual source of ingress rather than re-sheeting blindly.",
  ],
  scopeHeadline: "Scope of work",
  scopeItems: [
    "Roof sheets and side cladding for PEB and conventional steel sheds",
    "Gutters, ridge caps, flashings, louvers and ventilators",
    "Insulated panel installation where required",
    "Leak rectification and sheet replacement in existing sheds",
    "Skylight and natural ventilation integration",
    "Cladding for warehouses and process buildings",
  ],
  processHeadline: "Installation approach",
  processNote:
    "The stages below describe how envelope work is sequenced. The applied scope is confirmed against your drawings and specification.",
  processSteps: [
    {
      title: "Envelope requirement review",
      detail:
        "Roof and wall systems, insulation needs, slope, penetrations and access are reviewed against the drawings before material release.",
    },
    {
      title: "Access and safety planning",
      detail:
        "Roof access, fall protection and material lifting are planned before installation begins on elevation work.",
    },
    {
      title: "Sheet setting out and alignment",
      detail:
        "Start lines and sheet alignment are set out so laps and fastening patterns run consistently across the roof and walls.",
    },
    {
      title: "Installation with correct overlaps and fastening",
      detail:
        "Sheets and panels are installed with correct overlap, fastener placement and fastening discipline suited to the system.",
    },
    {
      title: "Flashing, ridge and rainwater detailing",
      detail:
        "Ridge caps, flashings, gutters, down-takes and penetration details are completed to control water movement off the roof.",
    },
    {
      title: "Leak checks and completion review",
      detail:
        "Junctions and penetrations are reviewed, and any identified item is corrected before handover.",
    },
  ],
  applicationsHeadline: "Where the work applies",
  applications: [
    "Warehouses and manufacturing units",
    "Power plants and aluminium plants",
    "Cement plants and mining service sheds",
    "Process buildings and utility structures",
    "Temperature-controlled and insulated enclosures",
  ],
  materialsHeadline: "Materials and systems",
  materialsNote:
    "Systems are selected from your specification and drawings. The items below list the categories AKEN installs, not a fixed specification.",
  materials: [
    "Metal roofing sheets and wall cladding sheets",
    "Insulated panel systems where thermal performance is required",
    "Ridge caps, flashings, corners and trims",
    "Gutters, down-take pipes and rainwater accessories",
    "Louvers, ventilators and skylights",
  ],
  whyAkenHeadline: "What AKEN focuses on in envelope work",
  whyAken: [
    {
      title: "Detailing over speed",
      text: "Flashing junctions, penetrations and end laps get attention because that is where most leaks and corrosion begin.",
    },
    {
      title: "Supervised installation",
      text: "Installation is supervised for overlap discipline and fastening pattern consistency rather than piece-rate coverage.",
    },
    {
      title: "Safe at height",
      text: "Roof access, fall protection and material handling are planned before work starts, with PPE compliance enforced.",
    },
    {
      title: "Diagnosis before re-work",
      text: "For existing sheds, the source of leakage is identified before recommending rectification or replacement.",
    },
  ],
  faqs: [
    {
      question: "Can you install cladding on a shed built by another contractor?",
      answer:
        "Yes, where the structure and purlin layout are suitable for the specified system. The existing frame and purlin spacing are reviewed before confirming scope.",
    },
    {
      question: "Do you install insulated panels?",
      answer:
        "Yes. Insulated panel installation is carried out with correct joint sealing and accessory detailing, including repair or replacement of damaged panels.",
    },
    {
      question: "Our shed leaks in the monsoon. Can you fix it?",
      answer:
        "Leak rectification is carried out after identifying the actual source, which may be overlaps, flashings, penetration details or damaged sheets. The recommended rectification is shared before work begins.",
    },
    {
      question: "What information helps for a cladding quotation?",
      answer:
        "Roof and wall area, the sheet or panel system and specification, purlin spacing, the building height and access conditions, and whether the work is new installation or replacement on an existing shed.",
    },
    {
      question: "Is this done with the structural scope?",
      answer:
        "Roofing and cladding can be executed together with structural fabrication and erection as one scope, or as a standalone envelope package, depending on the project.",
    },
  ],
  representativeImages: [
    {
      src: "/projects/roofing-cladding-industrial-shed.jpg",
      alt: "Roofing and cladding installation on an industrial steel shed",
      caption: "Roofing and cladding — representative industrial imagery",
    },
    {
      src: "/projects/puf-panel-roofing-installation.jpg",
      alt: "Insulated panel roofing installation on an industrial shed",
      caption: "Insulated panel roofing — representative industrial imagery",
    },
  ],
  relatedServiceSlugs: [
    "peb",
    "structural-steel-erection",
    "heavy-fabrication",
  ],
};
const maintenance: ServiceContent = {
  slug: "industrial-maintenance-shutdown",
  path: "/services/industrial-maintenance-shutdown",
  navLabel: "Industrial Maintenance & Shutdown",
  title: "Industrial Maintenance & Shutdown Services in Odisha | AKEN",
  metaDescription:
    "Industrial maintenance and shutdown support for operating plants in Odisha — structural modification, replacement and repair works executed within planned outage windows.",
  openGraphTitle: "Industrial Maintenance & Shutdown Services | AKEN — A K ENGINEERING",
  openGraphDescription:
    "Shutdown-ready manpower, structural repairs, rapid fabrication and installation support for live industrial plant environments.",
  h1: "Industrial Maintenance & Shutdown Services",
  heroStatement:
    "Shutdown-ready execution inside operating plants, against the clock.",
  heroIntro:
    "AKEN, a brand of A K ENGINEERING, supports plant operations with shutdown-ready manpower, structural repairs and quick-turn fabrication and installation. Work fronts are planned against the outage window and coordinated with the plant's safety and operations requirements, so the available time is used on execution rather than mobilisation.",
  overviewHeadline: "Supporting plants during planned outages",
  overviewParagraphs: [
    "In a shutdown, the constraint is rarely the work itself — it is the window. Everything that can be prepared before the outage should be prepared: materials, fabrication, access, permits and the sequence of work fronts.",
    "AKEN mobilises shutdown teams for structural modifications, replacement works and repair items inside plant areas. Hot work and cold work are executed as per site permits, and rapid fabrication is carried out for items that change during the outage.",
    "The scope also covers dismantling of redundant structures and equipment supports, and post-shutdown punch list closure so the plant returns to a clean, documented state.",
  ],
  scopeHeadline: "Scope of work",
  scopeItems: [
    "Shutdown structural modifications and replacement works",
    "Hot work and cold work support as per site permits",
    "Rapid fabrication and installation inside plant areas",
    "Access platforms, supports and safety-related additions",
    "Controlled dismantling and scrap handling",
    "Post-shutdown punch list closure support",
  ],
  processHeadline: "How shutdown work is planned",
  processNote:
    "The sequence below reflects how outage work is prepared and executed. Actual steps depend on the plant's permit system and the agreed scope.",
  processSteps: [
    {
      title: "Scope freeze before the outage",
      detail:
        "Work fronts, item lists and priorities are frozen in advance so the shutdown team starts on execution rather than discovery.",
    },
    {
      title: "Pre-outage fabrication and material staging",
      detail:
        "Fabrication that can be completed before the outage is produced and staged, leaving only installation for the window.",
    },
    {
      title: "Permits, access and safety briefing",
      detail:
        "Permit requirements, isolation status, access routes and safety briefings are completed with plant operations and safety.",
    },
    {
      title: "Shutdown execution",
      detail:
        "Modification, replacement, repair and installation work is executed across agreed fronts with supervision and progress tracking.",
    },
    {
      title: "Dismantling and site clean-up",
      detail:
        "Redundant structures and supports are dismantled safely, sorted and removed to keep work zones clear.",
    },
    {
      title: "Punch list and handover",
      detail:
        "Open items are closed out and documentation support is provided for the completed scope.",
    },
  ],
  applicationsHeadline: "Typical shutdown environments",
  applications: [
    "Power plants and aluminium plants",
    "Cement plants and mining installations",
    "Material handling and process plants",
    "Manufacturing units with planned shutdowns",
    "Warehouse and utility retrofits during outage",
  ],
  materialsHeadline: "Work categories and practices",
  materialsNote:
    "Work follows the plant's permit, isolation and safety systems. The items below describe the categories of work involved.",
  materials: [
    "Structural steel modification and replacement items",
    "Access platforms, supports and safety steelwork",
    "Custom fabrication for site-driven changes",
    "Dismantling, sorting and scrap handling",
    "Hot work and cold work under permit controls",
  ],
  whyAkenHeadline: "Why AKEN is used for outage work",
  whyAken: [
    {
      title: "Outage-window discipline",
      text: "Work is front-loaded into pre-outage fabrication and staging so the window itself is spent on installation.",
    },
    {
      title: "Single execution partner",
      text: "Structural repair, fabrication and installation sit with one team, which reduces coordination losses during a short outage.",
    },
    {
      title: "Live-plant awareness",
      text: "Teams work within permit, isolation and restricted-access conditions typical of operating plants.",
    },
    {
      title: "Rapid response capability",
      text: "Urgent fabrication and site fixes can be turned around for items identified only once the plant is opened up.",
    },
  ],
  faqs: [
    {
      question: "How early should we involve AKEN before a shutdown?",
      answer:
        "Involving us well before the outage allows scope freeze, pre-outage fabrication and material staging, which are what make a short window realistic. The earlier the item list is fixed, the more work can be completed off the critical path.",
    },
    {
      question: "Can you handle work inside a live plant?",
      answer:
        "Yes, where permits and isolation allow. Work is executed as per plant permit systems, with hot work and cold work controls, restricted access management and supervision.",
    },
    {
      question: "Do you also dismantle old structures?",
      answer:
        "Yes. Redundant industrial structures and equipment supports are dismantled with safe lifting, sorting and scrap handling to keep the work zone organised.",
    },
    {
      question: "What if additional work is found after opening up?",
      answer:
        "Rapid fabrication and installation capability is available for items that only become visible once the plant is opened. Priority is agreed with the plant team so the critical path is protected.",
    },
    {
      question: "What should be shared for a shutdown quotation?",
      answer:
        "The item list or scope note, drawings or sketches where available, the anticipated outage window, permit and access constraints, and the site's safety requirements.",
    },
  ],
  representativeImages: [
    {
      src: "/projects/steel-fabrication-workshop-cutting-welding.jpg",
      alt: "Fabrication work prepared for an industrial maintenance scope",
      caption: "Maintenance fabrication — representative industrial imagery",
    },
    {
      src: "/projects/structure-erection-crane-lifting.jpg",
      alt: "Steel structure work at an industrial plant during maintenance scope",
      caption: "Plant structural work — representative industrial imagery",
    },
  ],
  relatedServiceSlugs: [
    "structural-steel-erection",
    "heavy-fabrication",
    "mechanical-equipment-erection",
  ],
};

const mechanicalErection: ServiceContent = {
  slug: "mechanical-equipment-erection",
  path: "/services/mechanical-equipment-erection",
  navLabel: "Mechanical Equipment Erection",
  title: "Mechanical Equipment Erection & Installation in Odisha | AKEN",
  metaDescription:
    "Mechanical equipment erection and installation support for industrial plants in Odisha — equipment support structures, alignment and interface coordination with existing structures.",
  openGraphTitle: "Mechanical Equipment Erection & Installation | AKEN — A K ENGINEERING",
  openGraphDescription:
    "Fabrication and erection of supports for ducts, pipelines, conveyors, tanks and process equipment, with alignment and interface coordination.",
  h1: "Mechanical Equipment Erection & Installation",
  heroStatement:
    "Support structures and equipment installation, coordinated with the structures around them.",
  heroIntro:
    "AKEN, a brand of A K ENGINEERING, fabricates and erects supports for ducts, pipelines, conveyors, tanks and process equipment as part of EPC works. The work sits at the interface between structural steel and mechanical systems, so fit-up, alignment and coordination with existing structures determine whether installation proceeds without rework.",
  overviewHeadline: "Where structural work meets mechanical installation",
  overviewParagraphs: [
    "Equipment installation rarely fails because of the equipment — it fails at the interfaces. Pedestals, base plates, support frames and pipe or duct supports must line up with the equipment they carry and with the structures already standing around them.",
    "AKEN fabricates and erects equipment support structures and access arrangements, and coordinates alignment during installation so that the mechanical interface is achieved without fabricating on the fly.",
    "Scope is taken from your drawings and the equipment requirements. Where interface information is still developing, work is sequenced to avoid locking in dimensions too early.",
  ],
  scopeHeadline: "Scope of work",
  scopeItems: [
    "Fabrication and erection of equipment support structures",
    "Supports for ducts, pipelines, conveyors and tanks",
    "Support frames for process equipment as part of EPC works",
    "Access platforms, walkways and ladders for equipment areas",
    "Alignment and interface coordination during installation",
    "Structural additions for plant expansion and new lines",
  ],
  processHeadline: "Installation approach",
  processNote:
    "The steps below describe how equipment support and installation work is sequenced. Applied steps depend on the equipment and the interfaces involved.",
  processSteps: [
    {
      title: "Interface and requirement review",
      detail:
        "Equipment loads, connection points, access needs and interfaces with existing structures are reviewed from drawings and site data.",
    },
    {
      title: "Support structure fabrication",
      detail:
        "Supports, pedestals and frames are fabricated to suit the equipment connection and the surrounding structure.",
    },
    {
      title: "Site preparation and setting out",
      detail:
        "Setting out is carried out against the approved dimensions before supporting steel is placed.",
    },
    {
      title: "Erection and placement",
      detail:
        "Support structures and equipment are erected and placed with alignment checks against the required position.",
    },
    {
      title: "Access and safety steelwork",
      detail:
        "Platforms, walkways, ladders and handrails are installed so the equipment can be operated and maintained safely.",
    },
    {
      title: "Completion checks and handover",
      detail:
        "Installed work is reviewed and open items are closed with documentation support as per project requirement.",
    },
  ],
  applicationsHeadline: "Where the work applies",
  applications: [
    "Cement plants and material handling systems",
    "Power plants and utility installations",
    "Process plants and production lines",
    "Manufacturing units and plant expansions",
    "Conveyor and bulk handling structures",
  ],
  materialsHeadline: "Systems and work categories",
  materialsNote:
    "Work follows your drawings and equipment requirements. The items below describe the categories involved rather than a fixed specification.",
  materials: [
    "Equipment support frames and pedestals",
    "Duct, pipeline and conveyor supports",
    "Tank and vessel support steelwork",
    "Access platforms, stairs and ladders",
    "Base plate and anchor interface coordination",
  ],
  whyAkenHeadline: "Why interface discipline matters here",
  whyAken: [
    {
      title: "Fit at the interface",
      text: "Support structures are fabricated against actual connection requirements so equipment placement is not blocked by misfit.",
    },
    {
      title: "Alignment during installation",
      text: "Alignment is checked as installation proceeds rather than corrected after the fact.",
    },
    {
      title: "Access included",
      text: "Maintenance access — platforms, walkways and ladders — can be delivered with the support structures as one scope.",
    },
    {
      title: "Works with brownfield constraints",
      text: "Support structures can be sized and sequenced to suit restricted access in existing plant areas.",
    },
  ],
  faqs: [
    {
      question: "Do you install the equipment or only the supports?",
      answer:
        "The scope is agreed per project. AKEN fabricates and erects equipment support structures and access steelwork, and supports alignment and placement during installation. The exact split with the equipment vendor is defined before work begins.",
    },
    {
      question: "What information is needed to quote?",
      answer:
        "Equipment layout and general arrangement drawings, support structure drawings or load information, interface details with existing structures, site access conditions and the installation sequence.",
    },
    {
      question: "Can this be done during a plant shutdown?",
      answer:
        "Yes. Equipment support and installation work is commonly planned against a shutdown window, with pre-outage fabrication to reduce the work required inside the window.",
    },
    {
      question: "Do you provide access platforms for equipment?",
      answer:
        "Yes. Platforms, walkways, ladders and handrails are fabricated and erected so equipment can be operated, inspected and maintained safely.",
    },
    {
      question: "How is alignment handled?",
      answer:
        "Alignment is verified against the approved dimensions as installation proceeds, with the method agreed according to the equipment and the project's QA requirements.",
    },
  ],
  representativeImages: [
    {
      src: "/projects/structure-erection-crane-lifting.jpg",
      alt: "Steel support structure being erected for industrial equipment",
      caption: "Equipment support erection — representative industrial imagery",
    },
    {
      src: "/projects/steel-beam-column-fabrication.jpg",
      alt: "Fabricated steel supports prepared for industrial equipment installation",
      caption: "Support fabrication — representative industrial imagery",
    },
  ],
  relatedServiceSlugs: [
    "structural-steel-fabrication",
    "heavy-fabrication",
    "industrial-maintenance-shutdown",
  ],
};
const heavyFabrication: ServiceContent = {
  slug: "heavy-fabrication",
  path: "/services/heavy-fabrication",
  navLabel: "Heavy & Custom Steel Fabrication",
  title: "Heavy Fabrication & Custom Steel Solutions | AKEN, Sambalpur",
  metaDescription:
    "Heavy and custom steel fabrication in Sambalpur, Odisha — supports, brackets, housings, access structures and site-driven fabrication packages for industrial modifications and expansions.",
  openGraphTitle: "Heavy Fabrication & Custom Steel Solutions | AKEN — A K ENGINEERING",
  openGraphDescription:
    "Custom fabrication and on-site installation for industrial modifications: supports, brackets, housings, access structures and small-to-mid fabrication packages.",
  h1: "Heavy Fabrication & Custom Engineered Steel Solutions",
  heroStatement:
    "Custom steelwork and fabrication packages sized for real site constraints.",
  heroIntro:
    "AKEN, a brand of A K ENGINEERING, produces custom steel fabrication and on-site installation for industrial modifications — supports, brackets, housings, access structures and small-to-mid fabrication packages required during execution. This is the work that keeps a project moving when the requirement is defined on site rather than in the original drawing set.",
  overviewHeadline: "Fabrication that fits the actual requirement",
  overviewParagraphs: [
    "Not every requirement arrives as a complete drawing set. Site changes, interface gaps and expansion works often need steelwork defined quickly and fabricated to suit an existing structure — accurately enough that it can be installed without another round of modification.",
    "AKEN fabricates and installs custom steelwork including supports, brackets, housings and access structures, along with heavier fabrication packages such as mezzanine floors, platforms, walkways and ladders.",
    "Fabrication and installation sit with the same team, so the item that is fabricated is the item that is installed. That removes one interface from the process and reduces the chance of a mismatch between shop output and site condition.",
  ],
  scopeHeadline: "Scope of work",
  scopeItems: [
    "Custom steel fabrication for industrial modifications",
    "Supports, brackets and housings for equipment and structures",
    "Mezzanine floor fabrication for storage and process use",
    "Steel platforms, walkways, ladders and handrails",
    "Industrial equipment support structures",
    "On-site installation of fabricated items",
  ],
  processHeadline: "How custom fabrication is handled",
  processNote:
    "Custom items are defined by the actual site requirement. The steps below describe how those requirements are converted into installed steelwork.",
  processSteps: [
    {
      title: "Requirement capture on site",
      detail:
        "The actual interface, available space, loading expectation and access conditions are established before fabrication is released.",
    },
    {
      title: "Fabrication drawing or sketch confirmation",
      detail:
        "The item is confirmed in a form the fabrication team can build to, with critical dimensions agreed against the existing structure.",
    },
    {
      title: "Fabrication of the custom item",
      detail:
        "The item is fabricated with fit-up and dimensional checks against those confirmed dimensions.",
    },
    {
      title: "On-site installation",
      detail:
        "The fabricated item is installed by the same team, with alignment adjusted to the actual condition found on site.",
    },
    {
      title: "Finishing and completion review",
      detail:
        "Finishing, connections and access details are completed and reviewed before release.",
    },
  ],
  applicationsHeadline: "Where custom fabrication is used",
  applications: [
    "Plant modifications and site-driven changes",
    "Manufacturing units and process areas",
    "Cement plants and power plants",
    "Mining installations and material handling",
    "Warehouse mezzanine and storage structures",
  ],
  materialsHeadline: "Typical work categories",
  materialsNote:
    "Scope follows the site requirement and your specification. The items below describe the categories of work involved rather than a fixed specification.",
  materials: [
    "Custom supports, brackets and housings",
    "Structural steelwork for modifications and additions",
    "Mezzanine floor steelwork and decking support",
    "Platforms, walkways, ladders and handrails",
    "On-site installation and connection work",
  ],
  whyAkenHeadline: "Why AKEN for custom and heavy fabrication",
  whyAken: [
    {
      title: "Fabrication and installation together",
      text: "One team fabricates and installs, so the item delivered is the item that fits the site condition.",
    },
    {
      title: "Suited to site reality",
      text: "Work is defined against actual interfaces and available space rather than an idealised drawing condition.",
    },
    {
      title: "Small packages are welcome",
      text: "Short, urgent fabrication items that keep a project or shutdown moving are part of the normal scope.",
    },
    {
      title: "One point of responsibility",
      text: "Fabrication changes during execution are handled with the same team that is on site, reducing closure time.",
    },
  ],
  faqs: [
    {
      question: "Do you take on small fabrication jobs?",
      answer:
        "Yes. Supports, brackets, housings and other short fabrication items are part of the scope, including items required quickly during an ongoing project or shutdown.",
    },
    {
      question: "Can you fabricate directly from a site measurement?",
      answer:
        "Yes, where the requirement is confirmed in a form that can be built to. Critical dimensions are agreed against the existing structure before fabrication is released.",
    },
    {
      question: "Do you install what you fabricate?",
      answer:
        "Yes. On-site installation of the fabricated items is carried out by the same team, with alignment adjusted to the actual site condition.",
    },
    {
      question: "Can you fabricate mezzanine floors?",
      answer:
        "Mezzanine floor fabrication for storage and process use is part of the scope, along with the platforms and access steelwork that support it.",
    },
    {
      question: "What should be shared for a custom fabrication quote?",
      answer:
        "Sketches, site photographs or measurements, the intended use and loading expectation, the material and finish requirement, and the installation location and access conditions.",
    },
  ],
  representativeImages: [
    {
      src: "/projects/steel-beam-column-fabrication.jpg",
      alt: "Custom fabricated steel members prepared in a fabrication workshop",
      caption: "Custom fabrication — representative industrial imagery",
    },
    {
      src: "/projects/steel-fabrication-workshop-cutting-welding.jpg",
      alt: "Cutting and welding of custom structural steel in a workshop",
      caption: "Cutting and welding — representative industrial imagery",
    },
  ],
  relatedServiceSlugs: [
    "structural-steel-fabrication",
    "industrial-maintenance-shutdown",
    "mechanical-equipment-erection",
  ],
};

const SERVICE_CATALOG: Record<ServiceSlug, ServiceContent> = {
  peb,
  "structural-steel-fabrication": fabrication,
  "structural-steel-erection": erection,
  "roofing-wall-cladding": roofingCladding,
  "industrial-maintenance-shutdown": maintenance,
  "mechanical-equipment-erection": mechanicalErection,
  "heavy-fabrication": heavyFabrication,
};

export function getServiceContent(slug: ServiceSlug): ServiceContent {
  return SERVICE_CATALOG[slug];
}

export function getServiceSummaries(): ServiceLandingSummary[] {
  return SERVICE_SLUGS.map((slug) => {
    const service = SERVICE_CATALOG[slug];
    return {
      slug: service.slug,
      path: service.path,
      navLabel: service.navLabel,
      h1: service.h1,
    };
  });
}

export function getRelatedServices(slug: ServiceSlug): ServiceContent[] {
  return SERVICE_CATALOG[slug].relatedServiceSlugs.map(
    (relatedSlug) => SERVICE_CATALOG[relatedSlug],
  );
}
