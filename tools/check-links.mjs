// Walks every built page and resolves each internal link and #anchor.
// Removing or renaming a heading silently breaks inbound anchors, which has
// happened repeatedly; this turns that into a build failure.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

const DIST = 'dist';
const BASE = '/moveearth-web';
const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p);
  }
})(DIST);

const ids = new Map();   // route -> Set of anchor ids
const routes = new Set();
for (const f of files) {
  const route = '/' + f.slice(DIST.length + 1).replace(/index\.html$/, '').replace(/\.html$/, '/');
  routes.add(route);
  const html = readFileSync(f, 'utf8');
  const set = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) set.add(decodeURIComponent(m[1]));
  ids.set(route, set);
}

let bad = 0;
for (const f of files) {
  const route = '/' + f.slice(DIST.length + 1).replace(/index\.html$/, '').replace(/\.html$/, '/');
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    let href = m[1];
    if (/^(https?:|mailto:|#$)/.test(href) || href === '') continue;
    let [path, hash] = href.split('#');
    if (!path) path = route;
    else {
      if (path.startsWith(BASE)) path = path.slice(BASE.length) || '/';
      path = path.startsWith('/') ? path : posix.normalize(posix.join(route, path));
      if (!path.endsWith('/') && !path.includes('.')) path += '/';
    }
    if (!routes.has(path)) { console.log(`MISSING PAGE  ${route} -> ${href}`); bad++; continue; }
    if (hash && !ids.get(path).has(decodeURIComponent(hash))) { console.log(`MISSING ANCHOR ${route} -> ${href}`); bad++; }
  }
}
console.log(`${routes.size} pages crawled, ${bad} broken link(s)/anchor(s)`);
process.exit(bad ? 1 : 0);
