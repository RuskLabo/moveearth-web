/**
 * Maps a docs route to the title and description in that page's frontmatter.
 *
 * Read from disk once rather than through the content collection API, because
 * a remark plugin runs per file and has no way to ask about the others. The
 * site is static, so the set of pages is fixed before the build starts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const FIELD = (name) => new RegExp(`^${name}\\s*:\\s*(.*)$`, 'm');

const unquote = (value) => {
  const text = value.trim();
  if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"'))) {
    return text.slice(1, -1);
  }
  return text;
};

/** `guide/base.md` and `guide/base/index.md` both live at `/guide/base/`. */
export function routeFor(relativePath) {
  const withoutExtension = relativePath.replace(/\.mdx?$/, '');
  const parts = withoutExtension.split(sep).filter(Boolean);
  if (parts[parts.length - 1] === 'index') parts.pop();
  return `/${parts.join('/')}${parts.length ? '/' : ''}`;
}

export function readEntry(source) {
  const match = FRONTMATTER.exec(source);
  if (!match) return null;
  const block = match[1];
  const title = FIELD('title').exec(block);
  const description = FIELD('description').exec(block);
  if (!title) return null;
  return {
    title: unquote(title[1]),
    description: description ? unquote(description[1]) : '',
  };
}

export function buildIndex(root) {
  const index = new Map();
  const walk = (directory) => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (/\.mdx?$/.test(name)) {
        const entry = readEntry(readFileSync(path, 'utf8'));
        if (entry) index.set(routeFor(relative(root, path)), entry);
      }
    }
  };
  walk(root);
  return index;
}
