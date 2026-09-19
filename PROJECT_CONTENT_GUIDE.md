# AKEN Project & Case-Study Content Guide

This guide explains how to publish a project or case study on aken.firm.in.
It exists to protect a single rule:

> **Build credibility through real evidence. Never publish an unverified
> project, photograph, quantity or result.**

---

## 1. The two categories

The website separates two things and never mixes them:

| Category | What it is | Where it appears |
| --- | --- | --- |
| **A. Verified AKEN project** | A real project documented and confirmed by A K ENGINEERING | `/projects` → `/projects/<slug>` case study |
| **B. Representative industrial imagery** | Imagery illustrating a discipline or work activity; **not** an AKEN project | Service pages, `/projects`, under a visible notice |

Neither category may borrow from the other:

- Representative imagery must **never** appear in a project gallery.
- Project photographs must **never** be labelled "representative".
- A representative image must never be renamed or recaptioned to imply it is an
  AKEN project.

---

## 2. Files involved

| File | Purpose |
| --- | --- |
| `src/lib/projects/project-types.ts` | The data model, publication guard, and image verification rule |
| `src/lib/projects/projects-data.ts` | The project records array and lookup helpers |
| `src/components/ProjectCaseStudy.tsx` | Renders the 12-section case study (skips absent fields) |
| `src/app/projects/[slug]/page.tsx` | The case-study route (only generated for verified projects) |
| `src/app/projects/page.tsx` | The projects index |

---

## 3. Publication is controlled by types, not by trust

A record only becomes public when **both** of these are true:

```ts
verification: {
  status: "verified",
  approvedForPublication: true,
  verifiedBy: "<name of the person who confirmed the facts>",
  verifiedOn: "YYYY-MM-DD",
}
```

Records with `status: "draft"` are kept in the codebase but are:

- excluded from `/projects`
- excluded from `/projects/<slug>` (the route is not generated)
- excluded from `sitemap.xml`

This is enforced in `getPublishedProjects()` / `isPublishedProject()`, so a
draft record cannot leak to the public site even by accident.

---

## 4. Adding a project (step by step)

1. **Collect the facts.** Scope actually performed, location, dates, and
   photographs supplied by A K ENGINEERING.
2. **Confirm what may be published.** Ask the client before naming them, and
   before publishing location, quantities or outcomes. Set
   `clientDisclosure: "authorised"` only with their agreement. For sensitive
   work, omit `client`, `location` and `outcome` entirely.
3. **Add a draft record** to `projectRecords` in
   `src/lib/projects/projects-data.ts`.
4. **Add only real photographs** to `gallery`, each with `verified: true`.
   Only set this flag for photographs supplied or confirmed by
   A K ENGINEERING.
5. **Review the rendered page** (`npm run dev`, then `/projects`).
6. **Flip to verified** once A K ENGINEERING has confirmed every published
   field, and set `verifiedBy` / `verifiedOn`.
7. **Rebuild** so the page and `sitemap.xml` include the project.

### Record shape

```ts
{
  slug: "industrial-warehouse-sambalpur",
  name: "Industrial Warehouse — Sambalpur",
  projectType: "PEB industrial warehouse",
  location: "Sambalpur, Odisha",          // only if approved
  industry: "Logistics",
  stage: "completed",
  completionDate: "2025-11-01",           // only if verified

  overview: "…",
  requirement: "…",                        // section 04
  scopeOfWork: ["…"],                      // 05 AKEN scope
  engineeringScope: ["…"],                 // 06
  executionScope: ["…"],                   // 07
  materialsSystems: ["…"],
  keyChallenges: ["…"],                    // 08 — genuine only
  solution: "…",                           // 09
  outcome: ["…"],                          // 10 — measurable, verified only

  gallery: [
    {
      src: "/projects/<file>.jpg",
      alt: "Descriptive alt text",
      caption: "Optional caption",
      kind: "erection",
      verified: true,
    },
  ],
  servicesDelivered: ["peb", "structural-steel-erection"],

  clientDisclosure: "withheld",
  verification: {
    status: "verified",
    approvedForPublication: true,
    verifiedBy: "A K ENGINEERING",
    verifiedOn: "2026-01-15",
  },
}
```

**Every field except `slug`, `name`, `stage` and `verification` is optional.**
A section with no field is simply not rendered — the template is never padded
out with invented content.

---

## 5. Photographs

Supported image roles (`kind`): `overview`, `site`, `structural-steel`,
`fabrication`, `erection`, `roofing-cladding`, `engineering-inspection`,
`completed`, `detail`.

Allowed processing: compression, resizing, WebP/AVIF conversion, metadata
handling, and cropping for responsive layouts.

**Not allowed:** AI-generating missing photographs, digitally fabricating site
conditions, inserting workers, altering structural elements, adding signage or
client logos, adding certifications, or constructing artificial completion
scenes.

Place files in `public/projects/`. Use descriptive filenames and write accurate
`alt` text describing what is actually visible.

---

## 6. Never publish

- Projects, clients or locations that cannot be evidenced
- Values, tonnages, quantities or completion dates that are not confirmed
- Certifications, awards, memberships or approvals
- Years of experience, workforce numbers or machinery ownership unless
  confirmed
- Testimonials, client logos or results that have not been authorised
- Marketing superlatives ("India's No.1", "world-class", "unmatched") unless
  objectively substantiated

If information is missing, **omit the field**. If a section needs to be
acknowledged without data, use "Information to be provided" or "Coming soon".

---

## 7. Internal linking

When a project is published it automatically links in both directions:

- its case study links the services it delivered (`servicesDelivered`)
- service pages surface genuine projects through
  `getProjectsForService(serviceSlug)`

Until a real project exists, the service pages show an honest empty state
rather than an example.
