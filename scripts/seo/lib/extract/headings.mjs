/**
 * Heading extraction.
 *
 * Headings are classified into "content" and "chrome" using their
 * ancestors. The AKEN footer contains three <h3> column labels
 * (Company / Services / Contact) and the header contains none, so without
 * this split every page would report a heading-structure anomaly that has
 * nothing to do with its content.
 *
 * `main` and `article` are treated as content containers. `header`, `nav`,
 * `footer` and `aside` are treated as chrome.
 */

import { ancestorNames, elementText, findAll } from "../html-dom.mjs";
import { isHeading } from "../html-tokenizer.mjs";

const CHROME_ANCESTORS = new Set(["header", "nav", "footer", "aside"]);

export function extractHeadings(doc) {
  const nodes = findAll(doc, (node) => isHeading(node.name));

  return nodes.map((node) => {
    const ancestors = ancestorNames(node);
    const landmark = ancestors.find((name) => CHROME_ANCESTORS.has(name)) || null;
    return {
      level: Number(node.name.slice(1)),
      text: elementText(node),
      inChrome: Boolean(landmark),
      landmark,
      ancestorChain: ancestors.slice(0, 6).reverse(),
    };
  });
}

export function contentHeadings(headings) {
  return headings.filter((heading) => !heading.inChrome);
}

export function chromeHeadings(headings) {
  return headings.filter((heading) => heading.inChrome);
}

/**
 * Structure problems for one page's content headings.
 *
 * Deliberately advisory. A single skipped level (H2 -> H4) is reported as
 * INFO, not as a defect: heading level choices are an authoring decision
 * and Google does not require a gapless outline.
 */
export function analyseHeadingStructure(headings) {
  const issues = {
    missingH1: false,
    multipleH1: false,
    h1Count: 0,
    firstHeadingLevel: null,
    jumps: [],
    emptyHeadings: [],
    duplicateHeadings: [],
    h2BeforeH1: false,
  };

  const h1s = headings.filter((heading) => heading.level === 1);
  issues.h1Count = h1s.length;
  issues.missingH1 = h1s.length === 0;
  issues.multipleH1 = h1s.length > 1;
  issues.firstHeadingLevel = headings.length > 0 ? headings[0].level : null;

  if (headings.length > 0 && h1s.length > 0) {
    const firstH1Index = headings.findIndex((heading) => heading.level === 1);
    issues.h2BeforeH1 = headings
      .slice(0, firstH1Index)
      .some((heading) => heading.level === 2);
  }

  issues.emptyHeadings = headings
    .map((heading, index) => ({ index, level: heading.level }))
    .filter(({ index }) => headings[index].text.length === 0);

  let previousLevel = null;
  for (const heading of headings) {
    if (previousLevel !== null && heading.level - previousLevel > 1) {
      issues.jumps.push({ from: previousLevel, to: heading.level, text: heading.text });
    }
    previousLevel = heading.level;
  }

  const seen = new Map();
  for (const heading of headings) {
    const key = heading.text.toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      issues.duplicateHeadings.push({ text: heading.text, level: heading.level });
    } else {
      seen.set(key, heading.level);
    }
  }

  return issues;
}
