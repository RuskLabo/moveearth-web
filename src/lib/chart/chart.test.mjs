import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRounds, shotsFor } from './parse.js';
import { renderRounds } from './render.js';

const SAMPLE = `
title: AP弾
damage: 96
丸石 = 32
鉄 = 128
ダイヤモンド = 320
caption: 説明
`;

test('見出しと行を読む', () => {
  const c = parseRounds(SAMPLE);
  assert.equal(c.title, 'AP弾');
  assert.equal(c.caption, '説明');
  assert.equal(c.damage, 96);
  assert.deepEqual(c.rows.map((r) => r.label), ['丸石', '鉄', 'ダイヤモンド']);
});

test('発数は切り上げ', () => {
  assert.equal(shotsFor(32, 96).shots, 1, '1発で足りる');
  assert.equal(shotsFor(96, 96).shots, 1, 'ちょうどなら1発');
  assert.equal(shotsFor(97, 96).shots, 2, '1でも超えたら2発');
  assert.equal(shotsFor(320, 96).shots, 4);
});

test('最後の1発で実際に使う量を返す', () => {
  assert.equal(shotsFor(96, 96).remainder, 96, 'ちょうどなら使い切る');
  assert.equal(shotsFor(320, 96).remainder, 320 - 96 * 3);
  assert.equal(shotsFor(32, 96).remainder, 32, '1発目で余る');
});

test('0や負の値で落ちない', () => {
  assert.deepEqual(shotsFor(0, 96), { shots: 0, remainder: 0 });
  assert.deepEqual(shotsFor(100, 0), { shots: 0, remainder: 0 });
});

test('区切りの数が発数と一致する', () => {
  const svg = renderRounds(parseRounds(SAMPLE));
  // 1 + 2 + 4 segments
  assert.equal((svg.match(/<rect/g) ?? []).length, 7);
});

test('使い切らない最後の1発に印が付く', () => {
  const svg = renderRounds(parseRounds(SAMPLE));
  // 32, 128 and 320 all leave 32 unused on their final shot
  assert.equal((svg.match(/is-partial/g) ?? []).length, 3);
});

test('ちょうど割り切れる行には印が付かない', () => {
  const svg = renderRounds(parseRounds('damage: 64\n銅 = 64\n鉄 = 128\n'));
  assert.equal((svg.match(/is-partial/g) ?? []).length, 0);
});

test('行が無ければ何も出さない', () => {
  assert.equal(renderRounds({ rows: [], damage: 96 }), '');
});
