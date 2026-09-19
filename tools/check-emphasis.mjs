/**
 * Fails when a page ships literal ** in its text.
 *
 * Japanese prose hits this repeatedly: a closing ** whose left neighbour is
 * punctuation -- most often a percent sign -- and whose right neighbour is a
 * Japanese character is not a valid closing delimiter in CommonMark, so the
 * emphasis silently never closes. It builds, it renders, and the stars are
 * simply there on the page.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.html')) files.push(path);
  }
};
walk('dist');

let bad = 0;
for (const path of files) {
  const body = readFileSync(path, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const m of body.matchAll(/[^<>]{0,30}\*\*[^<>]{0,30}/g)) {
    bad++;
    console.error(`${path}: ${m[0].trim()}`);
  }
}
console.log(`${files.length} page(s) checked, ${bad} with unclosed emphasis`);
process.exit(bad ? 1 : 0);
