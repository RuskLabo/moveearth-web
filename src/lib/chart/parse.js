/**
 * Reads a `rounds` block: how many shots each material takes.
 *
 *     title: AP弾で抜くのに必要な発数
 *     damage: 96
 *     丸石 = 32
 *     ダイヤモンド = 320
 *
 * A table of the same numbers hides the one thing worth seeing, which is that
 * the count is a division rounded up: 320 against 96 is three full shots and a
 * quarter, and that quarter still costs a whole shot.
 */
const HEAD = /^\s*(title|damage|caption)\s*:\s*(.*)$/;
const ROW = /^\s*(.+?)\s*=\s*(\d+)\s*$/;

export function parseRounds(source) {
  let title = '';
  let caption = '';
  let damage = 0;
  const rows = [];
  for (const raw of String(source).split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const head = HEAD.exec(line);
    if (head) {
      if (head[1] === 'title') title = head[2].trim();
      else if (head[1] === 'caption') caption = head[2].trim();
      else damage = Number(head[2]);
      continue;
    }
    const row = ROW.exec(line);
    if (row) rows.push({ label: row[1], health: Number(row[2]) });
  }
  return { title, caption, damage, rows };
}

/** Shots needed, and how much of the last one is actually used. */
export function shotsFor(health, damage) {
  if (!(damage > 0) || !(health > 0)) return { shots: 0, remainder: 0 };
  const shots = Math.ceil(health / damage);
  const remainder = health - (shots - 1) * damage;
  return { shots, remainder };
}
