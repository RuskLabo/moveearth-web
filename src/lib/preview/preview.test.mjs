import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readEntry, routeFor } from './routes.js';

test('frontmatter の title と description を読む', () => {
  const entry = readEntry('---\ntitle: 車両コア\ndescription: 持ち運べる資産。\n---\n\n本文');
  assert.deepEqual(entry, { title: '車両コア', description: '持ち運べる資産。' });
});

test('引用符は外す', () => {
  assert.equal(readEntry('---\ntitle: "戦争をする"\n---\n').title, '戦争をする');
  assert.equal(readEntry("---\ntitle: '拠点を作る'\n---\n").title, '拠点を作る');
});

test('description が無くても読める', () => {
  assert.equal(readEntry('---\ntitle: X\n---\n').description, '');
});

test('frontmatter が無ければ null', () => {
  assert.equal(readEntry('# 見出しだけ\n'), null);
});

test('ファイルパスをルートへ変換する', () => {
  assert.equal(routeFor('guide/base.md'), '/guide/base/');
  assert.equal(routeFor('reference/vehicle-core.md'), '/reference/vehicle-core/');
});

test('index.md はディレクトリのルートになる', () => {
  assert.equal(routeFor('reference/index.md'), '/reference/');
});
