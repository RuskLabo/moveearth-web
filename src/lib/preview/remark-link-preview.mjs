import { visit } from 'unist-util-visit';
import { relative } from 'node:path';
import { buildIndex, routeFor } from './routes.js';

/**
 * Gives every link that points at another page of the wiki the title and
 * summary of its destination, so the reader can see where it goes without
 * leaving the sentence they are in.
 *
 * The text is put on the anchor as data attributes and drawn by CSS. Doing it
 * at build time rather than fetching the page on hover means no request, no
 * script, and nothing to go wrong when a reader is offline or JavaScript is
 * off -- and a link to a page that no longer exists simply gets no card, which
 * is visible while writing.
 */
export default function remarkLinkPreview({ root } = {}) {
  let index;
  return (tree, file) => {
    index ??= buildIndex(root);
    const here = routeFor(relative(root, file.path ?? ''));
    visit(tree, 'link', (node) => {
      const url = String(node.url ?? '');
      if (/^[a-z]+:/i.test(url) || url.startsWith('#')) return;
      const [path] = url.split('#');
      let target;
      try {
        target = new URL(path, `https://x${here}`).pathname;
      } catch {
        return;
      }
      if (!target.endsWith('/')) target += '/';
      const entry = index.get(target);
      if (!entry) return;
      node.data ??= {};
      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        'data-preview-title': entry.title,
        ...(entry.description ? { 'data-preview-body': entry.description } : {}),
      };
    });
  };
}
