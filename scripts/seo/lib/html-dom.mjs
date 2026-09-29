/**
 * Tolerant DOM construction on top of the tokenizer.
 *
 * The auditor needs one thing from a tree that flat token scanning cannot
 * give it: the *ancestors* of a heading, so headings inside the site
 * header, navigation or footer can be distinguished from headings in the
 * page's own content. Everything else (meta, links, images, JSON-LD) is a
 * flat lookup and would work on the token stream alone.
 *
 * Malformed markup never throws. Unclosed elements are closed implicitly
 * using the standard sibling-close rules, and a close tag for an element
 * that is not open is ignored rather than truncating the tree.
 */

import { textContent } from "./html-decode.mjs";
import {
  isSiblingCloseTrigger,
  tokenize,
  VOID_ELEMENTS,
} from "./html-tokenizer.mjs";

const MAX_STACK_DEPTH = 512;

export function createNode(name, attrs = {}) {
  return { name, attrs, children: [], text: "", parent: null };
}

export function parseDocument(html) {
  const tokens = tokenize(html);
  return buildTree(tokens);
}

export function buildTree(tokens) {
  const root = createNode("#document");
  const stack = [root];

  for (const token of tokens) {
    if (token.type === "text") {
      stack[stack.length - 1].text += token.text;
      continue;
    }

    if (token.type === "open") {
      applyImplicitCloses(stack, token.name);
      const node = createNode(token.name, token.attrs);
      node.parent = stack[stack.length - 1];
      node.parent.children.push(node);
      if (
        !token.selfClosing &&
        !VOID_ELEMENTS.has(token.name) &&
        stack.length < MAX_STACK_DEPTH
      ) {
        stack.push(node);
      }
      continue;
    }

    if (token.type === "close") {
      const matchIndex = findOpenIndex(stack, token.name);
      if (matchIndex > 0) {
        stack.length = matchIndex;
      }
      continue;
    }

    // comments and doctypes carry no audit-relevant information
  }

  return root;
}

function applyImplicitCloses(stack, incomingName) {
  let guard = 0;
  while (stack.length > 1 && guard < MAX_STACK_DEPTH) {
    guard += 1;
    const top = stack[stack.length - 1];
    if (!isSiblingCloseTrigger(top.name, incomingName)) return;
    stack.pop();
  }
}

function findOpenIndex(stack, name) {
  for (let index = stack.length - 1; index >= 1; index -= 1) {
    if (stack[index].name === name) return index;
  }
  return -1;
}

/** Depth-first, document-order traversal. */
export function walk(node, visit) {
  visit(node);
  for (const child of node.children) {
    walk(child, visit);
  }
}

export function findAll(node, predicate) {
  const results = [];
  walk(node, (candidate) => {
    if (candidate !== node && predicate(candidate)) results.push(candidate);
  });
  return results;
}

export function findByTag(node, tagName) {
  return findAll(node, (candidate) => candidate.name === tagName);
}

export function findFirstByTag(node, tagName) {
  let found = null;
  walk(node, (candidate) => {
    if (found || candidate === node) return;
    if (candidate.name === tagName) found = candidate;
  });
  return found;
}

/** All text beneath a node, decoded and whitespace-collapsed. */
export function elementText(node) {
  if (!node) return "";
  const parts = [node.text];
  for (const child of node.children) {
    parts.push(elementText(child));
  }
  return textContent(parts.join(" "));
}

/** Ancestor element names, nearest parent first. */
export function ancestorNames(node) {
  const names = [];
  let current = node ? node.parent : null;
  while (current) {
    names.push(current.name);
    current = current.parent;
  }
  return names;
}

export function hasAncestor(node, names) {
  let current = node ? node.parent : null;
  while (current) {
    if (names.includes(current.name)) return true;
    current = current.parent;
  }
  return false;
}

/** Attributes as a plain object, lower-cased keys, empty string for bare attributes. */
export function attr(node, name) {
  if (!node || !node.attrs) return undefined;
  return node.attrs[String(name).toLowerCase()];
}

export function hasAttr(node, name) {
  return attr(node, name) !== undefined;
}
