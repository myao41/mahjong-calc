import type { Tile, Mentsu, AgariCondition, Wind, QuizQuestion, Suit, Difficulty } from '../types';
import { sortTiles } from './tiles';
import { calculateScore } from './score';
import type { CategoryCount, ErrorCategory } from './learningLog';

function rand(max: number): number {
  return Math.floor(Math.random() * max);
}

function pick<T>(arr: T[]): T {
  return arr[rand(arr.length)];
}

type TileCount = Map<string, number>;
type HandResult = { closedTiles: Tile[]; openMelds: Mentsu[]; agariTile: Tile };

function tileKey(t: Tile): string {
  return `${t.suit}${t.num}`;
}

function canUse(pool: TileCount, tile: Tile, count: number): boolean {
  return (pool.get(tileKey(tile)) || 0) + count <= 4;
}

function useTile(pool: TileCount, tile: Tile, count: number) {
  const k = tileKey(tile);
  pool.set(k, (pool.get(k) || 0) + count);
}

function randomNumberSuit(): Suit {
  return pick(['m', 'p', 's'] as Suit[]);
}

function randomSuit(): Suit {
  return pick(['m', 'p', 's', 'z'] as Suit[]);
}

function tryMakeShuntsu(pool: TileCount, suit?: Suit, numRange?: [number, number]): Mentsu | null {
  for (let attempt = 0; attempt < 15; attempt++) {
    const s = suit || randomNumberSuit();
    const lo = numRange ? numRange[0] : 1;
    const hi = numRange ? numRange[1] : 7;
    const num = rand(hi - lo + 1) + lo;
    const tiles: Tile[] = [
      { suit: s, num }, { suit: s, num: num + 1 }, { suit: s, num: num + 2 },
    ];
    if (tiles.every(t => canUse(pool, t, 1))) {
      tiles.forEach(t => useTile(pool, t, 1));
      return { type: 'shuntsu', tiles, isOpen: false };
    }
  }
  return null;
}

function tryMakeKoutsu(pool: TileCount, allowHonors: boolean, suit?: Suit): Mentsu | null {
  for (let attempt = 0; attempt < 15; attempt++) {
    const s = suit || (allowHonors ? randomSuit() : randomNumberSuit());
    const maxNum = s === 'z' ? 7 : 9;
    const num = rand(maxNum) + 1;
    const tile: Tile = { suit: s, num };
    if (canUse(pool, tile, 3)) {
      useTile(pool, tile, 3);
      return { type: 'koutsu', tiles: [tile, tile, tile], isOpen: false };
    }
  }
  return null;
}

function tryMakeKantsu(pool: TileCount, allowHonors: boolean, suit?: Suit): Mentsu | null {
  for (let attempt = 0; attempt < 15; attempt++) {
    const s = suit || (allowHonors ? randomSuit() : randomNumberSuit());
    const maxNum = s === 'z' ? 7 : 9;
    const num = rand(maxNum) + 1;
    const tile: Tile = { suit: s, num };
    if (canUse(pool, tile, 4)) {
      useTile(pool, tile, 4);
      return { type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: false };
    }
  }
  return null;
}

function tryMakeYaochuKoutsu(pool: TileCount): Mentsu | null {
  for (let attempt = 0; attempt < 15; attempt++) {
    const suit = randomSuit();
    const num = suit === 'z' ? rand(7) + 1 : pick([1, 9]);
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 3)) {
      useTile(pool, tile, 3);
      return { type: 'koutsu', tiles: [tile, tile, tile], isOpen: false };
    }
  }
  return null;
}

function tryMakeYaochuKantsu(pool: TileCount): Mentsu | null {
  for (let attempt = 0; attempt < 15; attempt++) {
    const suit = randomSuit();
    const num = suit === 'z' ? rand(7) + 1 : pick([1, 9]);
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 4)) {
      useTile(pool, tile, 4);
      return { type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: false };
    }
  }
  return null;
}

function tryMakeJantai(pool: TileCount, suitFilter?: Suit[]): Tile | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const suit = suitFilter ? pick(suitFilter) : randomSuit();
    const maxNum = suit === 'z' ? 7 : 9;
    const num = rand(maxNum) + 1;
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      return tile;
    }
  }
  return null;
}

function pickAgariTile(closedMentsu: Mentsu[], jantaiTile: Tile): Tile {
  const choices: Tile[] = [];
  for (const m of closedMentsu) {
    if (m.type === 'shuntsu') {
      choices.push(...m.tiles);
    } else if (m.type === 'koutsu') {
      choices.push(m.tiles[0]);
    }
  }
  choices.push(jantaiTile);
  return pick(choices);
}

function finishHand(allMentsu: Mentsu[], jantaiTile: Tile, numOpen: number): HandResult {
  const closedMentsu = allMentsu.slice(0, 4 - numOpen);
  const openMelds = allMentsu.slice(4 - numOpen).map(m => ({ ...m, isOpen: true }));
  const closedTiles: Tile[] = [];
  for (const m of closedMentsu) closedTiles.push(...m.tiles);
  closedTiles.push(jantaiTile, jantaiTile);
  const agariTile = pickAgariTile(closedMentsu, jantaiTile);
  return { closedTiles: sortTiles(closedTiles), openMelds, agariTile };
}

function finishHandAdvanced(
  allMentsu: Mentsu[],
  jantaiTile: Tile,
  openIndices: number[],
): HandResult {
  const openSet = new Set(openIndices);
  const closedTiles: Tile[] = [];
  const openMelds: Mentsu[] = [];
  const closedMentsuForAgari: Mentsu[] = [];

  for (let i = 0; i < allMentsu.length; i++) {
    const m = allMentsu[i];
    const isOpen = openSet.has(i);
    if (m.type === 'kantsu') {
      openMelds.push({ ...m, isOpen });
    } else if (isOpen) {
      openMelds.push({ ...m, isOpen: true });
    } else {
      closedTiles.push(...m.tiles);
      closedMentsuForAgari.push(m);
    }
  }

  closedTiles.push(jantaiTile, jantaiTile);
  const agariTile = pickAgariTile(closedMentsuForAgari, jantaiTile);
  return { closedTiles: sortTiles(closedTiles), openMelds, agariTile };
}

// --- Strategy generators ---

function generateRandomHand(): HandResult | null {
  const pool: TileCount = new Map();
  const numOpen = pick([0, 0, 0, 0, 1, 1, 2]);
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    const makeKoutsu = Math.random() < 0.3;
    let m: Mentsu | null = null;
    if (makeKoutsu) {
      m = tryMakeKoutsu(pool, true);
      if (!m) m = tryMakeShuntsu(pool);
    } else {
      m = tryMakeShuntsu(pool);
      if (!m) m = tryMakeKoutsu(pool, true);
    }
    if (!m) return null;
    allMentsu.push(m);
  }

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;
  return finishHand(allMentsu, jantaiTile, numOpen);
}

function generateTanyaoHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    let m: Mentsu | null = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      const suit = randomNumberSuit();
      if (Math.random() < 0.75) {
        const num = rand(5) + 2;
        const tiles: Tile[] = [{ suit, num }, { suit, num: num + 1 }, { suit, num: num + 2 }];
        if (tiles.every(t => canUse(pool, t, 1))) {
          tiles.forEach(t => useTile(pool, t, 1));
          m = { type: 'shuntsu', tiles, isOpen: false };
          break;
        }
      } else {
        const num = rand(7) + 2;
        const tile: Tile = { suit, num };
        if (canUse(pool, tile, 3)) {
          useTile(pool, tile, 3);
          m = { type: 'koutsu', tiles: [tile, tile, tile], isOpen: false };
          break;
        }
      }
    }
    if (!m) return null;
    allMentsu.push(m);
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const suit = randomNumberSuit();
    const num = rand(7) + 2;
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      return finishHand(allMentsu, tile, pick([0, 0, 0, 1, 1]));
    }
  }
  return null;
}

function generatePinfuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    const m = tryMakeShuntsu(pool);
    if (!m) return null;
    allMentsu.push(m);
  }

  // Jantai: number tile only (no yakuhai)
  let jantaiTile: Tile | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const suit = randomNumberSuit();
    const num = rand(9) + 1;
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      jantaiTile = tile;
      break;
    }
  }
  if (!jantaiTile) return null;

  // Pick ryanmen agari (not matching jantai)
  const ryanmenChoices: Tile[] = [];
  for (const m of allMentsu) {
    const sorted = [...m.tiles].sort((a, b) => a.num - b.num);
    if (sorted[0].num > 1 && !(sorted[0].suit === jantaiTile.suit && sorted[0].num === jantaiTile.num)) {
      ryanmenChoices.push(sorted[0]);
    }
    if (sorted[2].num < 9 && !(sorted[2].suit === jantaiTile.suit && sorted[2].num === jantaiTile.num)) {
      ryanmenChoices.push(sorted[2]);
    }
  }
  if (ryanmenChoices.length === 0) return null;

  const closedTiles: Tile[] = [];
  for (const m of allMentsu) closedTiles.push(...m.tiles);
  closedTiles.push(jantaiTile, jantaiTile);
  return { closedTiles: sortTiles(closedTiles), openMelds: [], agariTile: pick(ryanmenChoices) };
}

function generateIttsuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const suit = randomNumberSuit();

  const m1: Mentsu = { type: 'shuntsu', tiles: [{ suit, num: 1 }, { suit, num: 2 }, { suit, num: 3 }], isOpen: false };
  const m2: Mentsu = { type: 'shuntsu', tiles: [{ suit, num: 4 }, { suit, num: 5 }, { suit, num: 6 }], isOpen: false };
  const m3: Mentsu = { type: 'shuntsu', tiles: [{ suit, num: 7 }, { suit, num: 8 }, { suit, num: 9 }], isOpen: false };

  for (const m of [m1, m2, m3]) m.tiles.forEach(t => useTile(pool, t, 1));

  const m4 = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
  if (!m4) return null;

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  return finishHand([m1, m2, m3, m4], jantaiTile, pick([0, 0, 1]));
}

function generateSanshokuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const num = rand(7) + 1;

  const suits: Suit[] = ['m', 'p', 's'];
  const mentsu: Mentsu[] = suits.map(s => ({
    type: 'shuntsu' as const,
    tiles: [{ suit: s, num }, { suit: s, num: num + 1 }, { suit: s, num: num + 2 }],
    isOpen: false,
  }));

  for (const m of mentsu) m.tiles.forEach(t => useTile(pool, t, 1));

  const m4 = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
  if (!m4) return null;

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  return finishHand([...mentsu, m4], jantaiTile, pick([0, 0, 1]));
}

function generateHonitsuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const suit = randomNumberSuit();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    let m: Mentsu | null = null;
    const useHonor = Math.random() < 0.35 && i > 0;

    for (let attempt = 0; attempt < 15; attempt++) {
      if (useHonor) {
        const num = rand(7) + 1;
        const tile: Tile = { suit: 'z', num };
        if (canUse(pool, tile, 3)) {
          useTile(pool, tile, 3);
          m = { type: 'koutsu', tiles: [tile, tile, tile], isOpen: false };
          break;
        }
      } else if (Math.random() < 0.6) {
        m = tryMakeShuntsu(pool, suit);
        if (m) break;
      } else {
        const num = rand(9) + 1;
        const tile: Tile = { suit, num };
        if (canUse(pool, tile, 3)) {
          useTile(pool, tile, 3);
          m = { type: 'koutsu', tiles: [tile, tile, tile], isOpen: false };
          break;
        }
      }
    }
    if (!m) return null;
    allMentsu.push(m);
  }

  const jantaiTile = tryMakeJantai(pool, [suit, 'z']);
  if (!jantaiTile) return null;

  return finishHand(allMentsu, jantaiTile, pick([0, 0, 1, 1, 2]));
}

function generateChiitoitsuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const pairs: Tile[] = [];

  for (let i = 0; i < 7; i++) {
    let found = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const suit = randomSuit();
      const maxNum = suit === 'z' ? 7 : 9;
      const num = rand(maxNum) + 1;
      const tile: Tile = { suit, num };
      if (canUse(pool, tile, 2) && !pairs.some(p => p.suit === tile.suit && p.num === tile.num)) {
        useTile(pool, tile, 2);
        pairs.push(tile);
        found = true;
        break;
      }
    }
    if (!found) return null;
  }

  const closedTiles: Tile[] = [];
  for (const p of pairs) closedTiles.push(p, p);
  return { closedTiles: sortTiles(closedTiles), openMelds: [], agariTile: pick(pairs) };
}

function generateToitoiHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    const m = tryMakeKoutsu(pool, true);
    if (!m) return null;
    allMentsu.push(m);
  }

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  return finishHand(allMentsu, jantaiTile, pick([1, 1, 2, 2]));
}

function generateChinitsuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const suit = randomNumberSuit();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    let m: Mentsu | null = null;
    if (Math.random() < 0.6) {
      m = tryMakeShuntsu(pool, suit);
      if (!m) m = tryMakeKoutsu(pool, false, suit);
    } else {
      m = tryMakeKoutsu(pool, false, suit);
      if (!m) m = tryMakeShuntsu(pool, suit);
    }
    if (!m) return null;
    allMentsu.push(m);
  }

  const jantaiTile = tryMakeJantai(pool, [suit]);
  if (!jantaiTile) return null;
  return finishHand(allMentsu, jantaiTile, pick([0, 0, 1]));
}

function generateChantaHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];
  let hasHonor = false;
  let hasShuntsu = false;

  for (let i = 0; i < 4; i++) {
    const wantShuntsu = Math.random() < 0.5 || (!hasShuntsu && i === 3);

    if (wantShuntsu) {
      const suit = randomNumberSuit();
      const startNum = pick([1, 7]);
      const tiles: Tile[] = [
        { suit, num: startNum },
        { suit, num: startNum + 1 },
        { suit, num: startNum + 2 },
      ];
      if (tiles.every(t => canUse(pool, t, 1))) {
        tiles.forEach(t => useTile(pool, t, 1));
        allMentsu.push({ type: 'shuntsu', tiles, isOpen: false });
        hasShuntsu = true;
        continue;
      }
    }

    const needHonor = !hasHonor && i >= 2;
    let made = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const s: Suit = needHonor ? 'z' : (Math.random() < 0.4 ? 'z' : randomNumberSuit());
      const num = s === 'z' ? rand(7) + 1 : pick([1, 9]);
      const tile: Tile = { suit: s, num };
      if (canUse(pool, tile, 3)) {
        useTile(pool, tile, 3);
        if (s === 'z') hasHonor = true;
        allMentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
        made = true;
        break;
      }
    }
    if (!made) return null;
  }

  if (!hasShuntsu) return null;

  for (let attempt = 0; attempt < 20; attempt++) {
    const s: Suit = (!hasHonor && Math.random() < 0.5) ? 'z' : (Math.random() < 0.3 ? 'z' : randomNumberSuit());
    const num = s === 'z' ? rand(7) + 1 : pick([1, 9]);
    const tile: Tile = { suit: s, num };
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      if (s === 'z') hasHonor = true;
      if (!hasHonor) continue;
      return finishHand(allMentsu, tile, pick([0, 0, 1]));
    }
  }
  return null;
}

function generateJunchanHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];
  let hasShuntsu = false;

  for (let i = 0; i < 4; i++) {
    const wantShuntsu = Math.random() < 0.6 || (!hasShuntsu && i === 3);

    if (wantShuntsu) {
      const suit = randomNumberSuit();
      const startNum = pick([1, 7]);
      const tiles: Tile[] = [
        { suit, num: startNum },
        { suit, num: startNum + 1 },
        { suit, num: startNum + 2 },
      ];
      if (tiles.every(t => canUse(pool, t, 1))) {
        tiles.forEach(t => useTile(pool, t, 1));
        allMentsu.push({ type: 'shuntsu', tiles, isOpen: false });
        hasShuntsu = true;
        continue;
      }
    }

    let made = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const suit = randomNumberSuit();
      const num = pick([1, 9]);
      const tile: Tile = { suit, num };
      if (canUse(pool, tile, 3)) {
        useTile(pool, tile, 3);
        allMentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
        made = true;
        break;
      }
    }
    if (!made) return null;
  }

  if (!hasShuntsu) return null;

  for (let attempt = 0; attempt < 20; attempt++) {
    const suit = randomNumberSuit();
    const num = pick([1, 9]);
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      return finishHand(allMentsu, tile, pick([0, 0, 1]));
    }
  }
  return null;
}

function generateSanshokuDokoHand(): HandResult | null {
  const pool: TileCount = new Map();
  const num = rand(9) + 1;
  const suits: Suit[] = ['m', 'p', 's'];

  const mentsu: Mentsu[] = [];
  for (const s of suits) {
    const tile: Tile = { suit: s, num };
    if (!canUse(pool, tile, 3)) return null;
    useTile(pool, tile, 3);
    mentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
  }

  const m4 = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
  if (!m4) return null;
  mentsu.push(m4);

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  return finishHand(mentsu, jantaiTile, pick([0, 1, 1, 2]));
}

function generateShosangenHand(): HandResult | null {
  const pool: TileCount = new Map();
  const mentsu: Mentsu[] = [];

  const sangenpai = [5, 6, 7];
  const picked = [...sangenpai];
  for (let i = picked.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  for (let i = 0; i < 2; i++) {
    const tile: Tile = { suit: 'z', num: picked[i] };
    useTile(pool, tile, 3);
    mentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
  }

  const jantaiTile: Tile = { suit: 'z', num: picked[2] };
  useTile(pool, jantaiTile, 2);

  for (let i = 0; i < 2; i++) {
    let m: Mentsu | null = null;
    if (Math.random() < 0.5) {
      m = tryMakeShuntsu(pool);
      if (!m) m = tryMakeKoutsu(pool, true);
    } else {
      m = tryMakeKoutsu(pool, true);
      if (!m) m = tryMakeShuntsu(pool);
    }
    if (!m) return null;
    mentsu.push(m);
  }

  return finishHand(mentsu, jantaiTile, pick([0, 1, 1, 2]));
}

function generateSanankoHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 3; i++) {
    const m = tryMakeKoutsu(pool, true);
    if (!m) return null;
    allMentsu.push(m);
  }

  const m4 = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
  if (!m4) return null;
  allMentsu.push(m4);

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  if (m4.type === 'koutsu') {
    return finishHand(allMentsu, jantaiTile, pick([1, 1, 2]));
  }
  return finishHand(allMentsu, jantaiTile, pick([0, 0, 1]));
}

function generateKantsuMixHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];
  const numKantsu = pick([1, 1, 2]);

  for (let i = 0; i < numKantsu; i++) {
    const m = tryMakeKantsu(pool, true);
    if (!m) return null;
    allMentsu.push(m);
  }

  for (let i = numKantsu; i < 4; i++) {
    const makeKoutsu = Math.random() < 0.25;
    let m: Mentsu | null = null;
    if (makeKoutsu) {
      m = tryMakeKoutsu(pool, true);
      if (!m) m = tryMakeShuntsu(pool);
    } else {
      m = tryMakeShuntsu(pool);
      if (!m) m = tryMakeKoutsu(pool, true);
    }
    if (!m) return null;
    allMentsu.push(m);
  }

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  const openIndices: number[] = [];

  const allTriplets = allMentsu.every(m => m.type === 'koutsu' || m.type === 'kantsu');
  if (allTriplets) {
    const nonKantsuIdx = allMentsu.findIndex(m => m.type !== 'kantsu');
    if (nonKantsuIdx >= 0) {
      openIndices.push(nonKantsuIdx);
    } else {
      openIndices.push(0);
    }
  }

  for (let i = 0; i < allMentsu.length; i++) {
    if (openIndices.includes(i)) continue;
    if (allMentsu[i].type === 'kantsu' && Math.random() < 0.4) {
      openIndices.push(i);
    } else if (allMentsu[i].type !== 'kantsu' && Math.random() < 0.25) {
      openIndices.push(i);
    }
  }

  return finishHandAdvanced(allMentsu, jantaiTile, openIndices);
}

function generateHighFuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];
  const r = Math.random();

  if (r < 0.4) {
    const kan = tryMakeYaochuKantsu(pool);
    if (!kan) return null;
    allMentsu.push(kan);

    for (let i = 1; i < 4; i++) {
      let m: Mentsu | null = null;
      if (Math.random() < 0.4) {
        m = tryMakeYaochuKoutsu(pool);
      }
      if (!m) {
        m = Math.random() < 0.5
          ? tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true)
          : tryMakeKoutsu(pool, true) || tryMakeShuntsu(pool);
      }
      if (!m) return null;
      allMentsu.push(m);
    }
  } else if (r < 0.7) {
    const numYaochu = pick([2, 2, 3]);
    for (let i = 0; i < numYaochu; i++) {
      const k = tryMakeYaochuKoutsu(pool);
      if (!k) {
        if (allMentsu.length < 2) return null;
        break;
      }
      allMentsu.push(k);
    }
    while (allMentsu.length < 4) {
      const m = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
      if (!m) return null;
      allMentsu.push(m);
    }
  } else {
    const kan = tryMakeKantsu(pool, true);
    if (!kan) return null;
    allMentsu.push(kan);

    const kou = Math.random() < 0.6
      ? tryMakeYaochuKoutsu(pool) || tryMakeKoutsu(pool, true)
      : tryMakeKoutsu(pool, true);
    if (!kou) return null;
    allMentsu.push(kou);

    while (allMentsu.length < 4) {
      const m = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
      if (!m) return null;
      allMentsu.push(m);
    }
  }

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  const openIndices: number[] = [];
  for (let i = 0; i < allMentsu.length; i++) {
    if (allMentsu[i].type === 'kantsu') {
      if (Math.random() < 0.5) openIndices.push(i);
    } else if (allMentsu[i].type === 'koutsu') {
      if (Math.random() < 0.35) openIndices.push(i);
    }
  }

  return finishHandAdvanced(allMentsu, jantaiTile, openIndices);
}

function generateSuuankoHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    const m = tryMakeKoutsu(pool, true);
    if (!m) return null;
    allMentsu.push(m);
  }

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  const closedTiles: Tile[] = [];
  for (const m of allMentsu) closedTiles.push(...m.tiles);
  closedTiles.push(jantaiTile, jantaiTile);

  // 50% shanpon wait (tsumo from koutsu), 50% tanki wait (tsumo/ron from jantai)
  const agariTile = Math.random() < 0.5
    ? allMentsu[rand(4)].tiles[0]
    : jantaiTile;
  return { closedTiles: sortTiles(closedTiles), openMelds: [], agariTile };
}

function generateDaisangenHand(): HandResult | null {
  const pool: TileCount = new Map();
  const mentsu: Mentsu[] = [];

  for (const num of [5, 6, 7]) {
    const tile: Tile = { suit: 'z', num };
    useTile(pool, tile, 3);
    mentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
  }

  const m4 = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
  if (!m4) return null;
  mentsu.push(m4);

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  return finishHand(mentsu, jantaiTile, pick([0, 1, 1, 2]));
}

function generateTsuuiisoHand(): HandResult | null {
  const pool: TileCount = new Map();
  const mentsu: Mentsu[] = [];
  const honors = [1, 2, 3, 4, 5, 6, 7];
  for (let i = honors.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [honors[i], honors[j]] = [honors[j], honors[i]];
  }

  for (let i = 0; i < 4; i++) {
    const tile: Tile = { suit: 'z', num: honors[i] };
    useTile(pool, tile, 3);
    mentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
  }

  const jantaiTile: Tile = { suit: 'z', num: honors[4] };
  useTile(pool, jantaiTile, 2);

  return finishHand(mentsu, jantaiTile, pick([0, 1, 1, 2]));
}

function generateHonroutouHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    const m = tryMakeYaochuKoutsu(pool);
    if (!m) return null;
    allMentsu.push(m);
  }

  // Jantai must be terminal or honor
  let jantaiTile: Tile | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const suit = randomSuit();
    const num = suit === 'z' ? rand(7) + 1 : pick([1, 9]);
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      jantaiTile = tile;
      break;
    }
  }
  if (!jantaiTile) return null;

  return finishHand(allMentsu, jantaiTile, pick([1, 1, 2]));
}

function generateRyanpeikouHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  // Two pairs of identical shuntsu
  for (let pair = 0; pair < 2; pair++) {
    let made = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const suit = randomNumberSuit();
      const num = rand(7) + 1;
      const tiles: Tile[] = [
        { suit, num }, { suit, num: num + 1 }, { suit, num: num + 2 },
      ];
      // Need 2 copies of this shuntsu
      if (tiles.every(t => canUse(pool, t, 2))) {
        tiles.forEach(t => useTile(pool, t, 2));
        const m1: Mentsu = { type: 'shuntsu', tiles: [...tiles], isOpen: false };
        const m2: Mentsu = { type: 'shuntsu', tiles: [...tiles], isOpen: false };
        allMentsu.push(m1, m2);
        made = true;
        break;
      }
    }
    if (!made) return null;
  }

  // Jantai: number tile only (avoid yakuhai for cleaner hand)
  let jantaiTile: Tile | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const suit = randomNumberSuit();
    const num = rand(9) + 1;
    const tile: Tile = { suit, num };
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      jantaiTile = tile;
      break;
    }
  }
  if (!jantaiTile) return null;

  // Menzen only
  const closedTiles: Tile[] = [];
  for (const m of allMentsu) closedTiles.push(...m.tiles);
  closedTiles.push(jantaiTile, jantaiTile);
  const agariTile = pickAgariTile(allMentsu, jantaiTile);
  return { closedTiles: sortTiles(closedTiles), openMelds: [], agariTile };
}

function generateKokushiHand(): HandResult | null {
  const terminals: Tile[] = [
    { suit: 'm', num: 1 }, { suit: 'm', num: 9 },
    { suit: 'p', num: 1 }, { suit: 'p', num: 9 },
    { suit: 's', num: 1 }, { suit: 's', num: 9 },
    { suit: 'z', num: 1 }, { suit: 'z', num: 2 },
    { suit: 'z', num: 3 }, { suit: 'z', num: 4 },
    { suit: 'z', num: 5 }, { suit: 'z', num: 6 },
    { suit: 'z', num: 7 },
  ];

  const closedTiles: Tile[] = [...terminals];
  // Add one duplicate
  const dupTile = pick(terminals);
  closedTiles.push(dupTile);

  return { closedTiles: sortTiles(closedTiles), openMelds: [], agariTile: pick(terminals) };
}

function generateRyuuiisoHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];
  // Green tiles: 2s, 3s, 4s, 6s, 8s, hatsu (z6)
  const greenKoutsuTiles: Tile[] = [
    { suit: 's', num: 2 }, { suit: 's', num: 3 }, { suit: 's', num: 4 },
    { suit: 's', num: 6 }, { suit: 's', num: 8 }, { suit: 'z', num: 6 },
  ];

  for (let i = 0; i < 4; i++) {
    let m: Mentsu | null = null;

    if (Math.random() < 0.4) {
      // Try shuntsu 2-3-4s
      const tiles: Tile[] = [{ suit: 's', num: 2 }, { suit: 's', num: 3 }, { suit: 's', num: 4 }];
      if (tiles.every(t => canUse(pool, t, 1))) {
        tiles.forEach(t => useTile(pool, t, 1));
        m = { type: 'shuntsu', tiles, isOpen: false };
      }
    }

    if (!m) {
      // Try koutsu of a green tile
      for (let attempt = 0; attempt < 15; attempt++) {
        const tile = pick(greenKoutsuTiles);
        if (canUse(pool, tile, 3)) {
          useTile(pool, tile, 3);
          m = { type: 'koutsu', tiles: [tile, tile, tile], isOpen: false };
          break;
        }
      }
    }

    if (!m) {
      // Fallback: try shuntsu 2-3-4s again
      const tiles: Tile[] = [{ suit: 's', num: 2 }, { suit: 's', num: 3 }, { suit: 's', num: 4 }];
      if (tiles.every(t => canUse(pool, t, 1))) {
        tiles.forEach(t => useTile(pool, t, 1));
        m = { type: 'shuntsu', tiles, isOpen: false };
      }
    }

    if (!m) return null;
    allMentsu.push(m);
  }

  // Jantai must be a green tile
  const greenJantaiTiles: Tile[] = [
    { suit: 's', num: 2 }, { suit: 's', num: 3 }, { suit: 's', num: 4 },
    { suit: 's', num: 6 }, { suit: 's', num: 8 }, { suit: 'z', num: 6 },
  ];
  let jantaiTile: Tile | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const tile = pick(greenJantaiTiles);
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      jantaiTile = tile;
      break;
    }
  }
  if (!jantaiTile) return null;

  return finishHand(allMentsu, jantaiTile, pick([0, 0, 1, 1, 2]));
}

function generateChinroutouHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];
  // Terminal tiles only: 1m,9m,1p,9p,1s,9s
  const terminalTiles: Tile[] = [
    { suit: 'm', num: 1 }, { suit: 'm', num: 9 },
    { suit: 'p', num: 1 }, { suit: 'p', num: 9 },
    { suit: 's', num: 1 }, { suit: 's', num: 9 },
  ];

  for (let i = 0; i < 4; i++) {
    let m: Mentsu | null = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      const tile = pick(terminalTiles);
      if (canUse(pool, tile, 3)) {
        useTile(pool, tile, 3);
        m = { type: 'koutsu', tiles: [tile, tile, tile], isOpen: false };
        break;
      }
    }
    if (!m) return null;
    allMentsu.push(m);
  }

  let jantaiTile: Tile | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const tile = pick(terminalTiles);
    if (canUse(pool, tile, 2)) {
      useTile(pool, tile, 2);
      jantaiTile = tile;
      break;
    }
  }
  if (!jantaiTile) return null;

  return finishHand(allMentsu, jantaiTile, pick([0, 0, 1, 1, 2]));
}

function generateDaisuushiiHand(): HandResult | null {
  const pool: TileCount = new Map();
  const mentsu: Mentsu[] = [];

  // Koutsu of all 4 winds
  for (const num of [1, 2, 3, 4]) {
    const tile: Tile = { suit: 'z', num };
    useTile(pool, tile, 3);
    mentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
  }

  // Jantai is any tile
  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  return finishHand(mentsu, jantaiTile, pick([0, 1, 1, 2]));
}

function generateShousuushiiHand(): HandResult | null {
  const pool: TileCount = new Map();
  const mentsu: Mentsu[] = [];

  // Shuffle winds to pick which 3 become koutsu and which 1 becomes jantai
  const winds = [1, 2, 3, 4];
  for (let i = winds.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [winds[i], winds[j]] = [winds[j], winds[i]];
  }

  // 3 wind koutsu
  for (let i = 0; i < 3; i++) {
    const tile: Tile = { suit: 'z', num: winds[i] };
    useTile(pool, tile, 3);
    mentsu.push({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: false });
  }

  // Jantai is the 4th wind
  const jantaiTile: Tile = { suit: 'z', num: winds[3] };
  useTile(pool, jantaiTile, 2);

  // One more mentsu of anything
  const m4 = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
  if (!m4) return null;
  mentsu.push(m4);

  return finishHand(mentsu, jantaiTile, pick([0, 1, 1, 2]));
}

function generateChuurenpoutouHand(): HandResult | null {
  const suit = randomNumberSuit();
  // Pattern: 1112345678999 + one extra tile of the same suit
  const baseTiles: Tile[] = [
    { suit, num: 1 }, { suit, num: 1 }, { suit, num: 1 },
    { suit, num: 2 }, { suit, num: 3 }, { suit, num: 4 },
    { suit, num: 5 }, { suit, num: 6 }, { suit, num: 7 },
    { suit, num: 8 }, { suit, num: 9 }, { suit, num: 9 }, { suit, num: 9 },
  ];

  // Extra tile is any tile of the same suit (1-9)
  const extraNum = rand(9) + 1;
  const extraTile: Tile = { suit, num: extraNum };
  const closedTiles = sortTiles([...baseTiles, extraTile]);

  // agariTile is the extra tile
  return { closedTiles, openMelds: [], agariTile: extraTile };
}

function generateSuukantsuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  for (let i = 0; i < 4; i++) {
    const m = tryMakeKantsu(pool, true);
    if (!m) return null;
    allMentsu.push(m);
  }

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  // Mix of open/closed kantsu
  const openIndices: number[] = [];
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.5) openIndices.push(i);
  }

  return finishHandAdvanced(allMentsu, jantaiTile, openIndices);
}

function generateSankantsuHand(): HandResult | null {
  const pool: TileCount = new Map();
  const allMentsu: Mentsu[] = [];

  // 3 kantsu
  for (let i = 0; i < 3; i++) {
    const m = tryMakeKantsu(pool, true);
    if (!m) return null;
    allMentsu.push(m);
  }

  // 1 other mentsu
  const m4 = tryMakeShuntsu(pool) || tryMakeKoutsu(pool, true);
  if (!m4) return null;
  allMentsu.push(m4);

  const jantaiTile = tryMakeJantai(pool);
  if (!jantaiTile) return null;

  // Mix of open/closed kantsu
  const openIndices: number[] = [];
  for (let i = 0; i < 3; i++) {
    if (Math.random() < 0.4) openIndices.push(i);
  }
  // Maybe open the 4th mentsu too
  if (m4.type !== 'kantsu' && Math.random() < 0.3) {
    openIndices.push(3);
  }

  return finishHandAdvanced(allMentsu, jantaiTile, openIndices);
}

function generateYakumanHand(): HandResult | null {
  const generators = [
    generateSuuankoHand,
    generateDaisangenHand,
    generateTsuuiisoHand,
    generateKokushiHand,
    generateRyuuiisoHand,
    generateChinroutouHand,
    generateDaisuushiiHand,
    generateShousuushiiHand,
    generateChuurenpoutouHand,
    generateSuukantsuHand,
  ];
  return pick(generators)();
}

function pickStrategy(difficulty: Difficulty): string {
  const r = Math.random();
  if (difficulty === 'easy') {
    if (r < 0.45) return 'pinfu';
    if (r < 0.85) return 'tanyao';
    return 'random';
  }
  if (difficulty === 'hard') {
    if (r < 0.25) return 'high_fu';
    if (r < 0.38) return 'kantsu_mix';
    if (r < 0.48) return 'honitsu';
    if (r < 0.55) return 'chanta';
    if (r < 0.62) return 'junchan';
    if (r < 0.68) return 'sananko';
    if (r < 0.74) return 'sanshoku_doko';
    if (r < 0.80) return 'shosangen';
    if (r < 0.85) return 'toitoi';
    if (r < 0.90) return 'chinitsu';
    if (r < 0.93) return 'honroutou';
    if (r < 0.96) return 'ryanpeikou';
    if (r < 0.99) return 'sankantsu';
    return 'random';
  }
  // normal
  if (r < 0.05) return 'yakuman';
  if (r < 0.16) return 'tanyao';
  if (r < 0.27) return 'pinfu';
  if (r < 0.38) return 'ittsu';
  if (r < 0.49) return 'sanshoku';
  if (r < 0.59) return 'honitsu';
  if (r < 0.68) return 'chiitoitsu';
  if (r < 0.77) return 'toitoi';
  if (r < 0.80) return 'honroutou';
  if (r < 0.83) return 'ryanpeikou';
  if (r < 0.86) return 'sankantsu';
  return 'random';
}

function generateHandByStrategy(strategy: string): HandResult | null {
  switch (strategy) {
    case 'tanyao': return generateTanyaoHand();
    case 'pinfu': return generatePinfuHand();
    case 'ittsu': return generateIttsuHand();
    case 'sanshoku': return generateSanshokuHand();
    case 'honitsu': return generateHonitsuHand();
    case 'chiitoitsu': return generateChiitoitsuHand();
    case 'toitoi': return generateToitoiHand();
    case 'chinitsu': return generateChinitsuHand();
    case 'chanta': return generateChantaHand();
    case 'junchan': return generateJunchanHand();
    case 'sanshoku_doko': return generateSanshokuDokoHand();
    case 'shosangen': return generateShosangenHand();
    case 'sananko': return generateSanankoHand();
    case 'kantsu_mix': return generateKantsuMixHand();
    case 'high_fu': return generateHighFuHand();
    case 'honroutou': return generateHonroutouHand();
    case 'ryanpeikou': return generateRyanpeikouHand();
    case 'sankantsu': return generateSankantsuHand();
    case 'yakuman': return generateYakumanHand();
    case 'kokushi': return generateKokushiHand();
    case 'suuanko': return generateSuuankoHand();
    case 'daisangen': return generateDaisangenHand();
    case 'tsuuiiso': return generateTsuuiisoHand();
    case 'ryuuiiso': return generateRyuuiisoHand();
    case 'chinroutou': return generateChinroutouHand();
    case 'daisuushii': return generateDaisuushiiHand();
    case 'shousuushii': return generateShousuushiiHand();
    case 'chuurenpoutou': return generateChuurenpoutouHand();
    case 'suukantsu': return generateSuukantsuHand();
    default: return generateRandomHand();
  }
}

function makeBaseCondition(hand: HandResult): AgariCondition {
  const agariType = pick(['tsumo', 'ron'] as const);
  const condition: AgariCondition = {
    agariType,
    agariTile: hand.agariTile,
    seatWind: pick([1, 2, 3, 4] as Wind[]),
    roundWind: pick([1, 2] as Wind[]),
    isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
    isRinshan: false, isChankan: false, isHaitei: false,
    isHoutei: false, isTenhou: false, isChihou: false,
    doraCount: 0, uraDoraCount: 0, redDoraCount: 0,
  };

  // ~5% chance of haitei (tsumo) or houtei (ron)
  if (agariType === 'tsumo' && Math.random() < 0.05) {
    condition.isHaitei = true;
  } else if (agariType === 'ron' && Math.random() < 0.05) {
    condition.isHoutei = true;
  }

  return condition;
}

function applyDifficultyConditions(condition: AgariCondition, hand: HandResult, difficulty: Difficulty): boolean {
  const isMenzen = hand.openMelds.every(m => !m.isOpen);

  if (difficulty === 'easy') {
    if (hand.openMelds.some(m => m.isOpen)) return false;
    condition.isRiichi = Math.random() < 0.3;
  } else if (difficulty === 'hard') {
    if (isMenzen) {
      condition.isRiichi = Math.random() < 0.1;
    }
    condition.seatWind = Math.random() < 0.5 ? 1 : pick([2, 3, 4] as Wind[]);
  } else {
    // normal
    if (isMenzen) condition.isRiichi = Math.random() < 0.5;
  }

  if (!condition.isRiichi && isMenzen && difficulty === 'normal') {
    condition.isRiichi = Math.random() < 0.3;
  }

  // ~5% chance to upgrade riichi to double riichi on normal/hard
  if (condition.isRiichi && (difficulty === 'normal' || difficulty === 'hard') && Math.random() < 0.05) {
    condition.isDoubleRiichi = true;
    condition.isRiichi = false;
  }

  return true;
}

function tryBuildQuiz(hand: HandResult, difficulty: Difficulty): QuizQuestion | null {
  const condition = makeBaseCondition(hand);
  if (!applyDifficultyConditions(condition, hand, difficulty)) return null;

  const isMenzen = hand.openMelds.every(m => !m.isOpen);
  let answer = calculateScore(hand.closedTiles, hand.openMelds, condition);
  if (!answer && isMenzen) {
    condition.isRiichi = true;
    answer = calculateScore(hand.closedTiles, hand.openMelds, condition);
  }
  if (!answer) return null;
  if (answer.yaku.some(y => y.isYakuman) && difficulty !== 'normal') return null;
  return { closedTiles: hand.closedTiles, openMelds: hand.openMelds, condition, answer };
}

export function generateQuiz(difficulty: Difficulty = 'normal'): QuizQuestion {
  for (let retry = 0; retry < 100; retry++) {
    const strategy = pickStrategy(difficulty);
    const hand = generateHandByStrategy(strategy);
    if (!hand) continue;
    const q = tryBuildQuiz(hand, difficulty);
    if (q) return q;
  }

  const closedTiles = sortTiles([
    { suit: 'm', num: 2 }, { suit: 'm', num: 3 }, { suit: 'm', num: 4 },
    { suit: 'p', num: 5 }, { suit: 'p', num: 6 }, { suit: 'p', num: 7 },
    { suit: 's', num: 2 }, { suit: 's', num: 3 }, { suit: 's', num: 4 },
    { suit: 's', num: 6 }, { suit: 's', num: 7 }, { suit: 's', num: 8 },
    { suit: 'm', num: 5 }, { suit: 'm', num: 5 },
  ]);
  const condition: AgariCondition = {
    agariType: 'tsumo',
    agariTile: { suit: 's', num: 8 },
    seatWind: 2,
    roundWind: 1,
    isRiichi: false, isDoubleRiichi: false, isIppatsu: false,
    isRinshan: false, isChankan: false, isHaitei: false,
    isHoutei: false, isTenhou: false, isChihou: false,
    doraCount: 0, uraDoraCount: 0, redDoraCount: 0,
  };
  const answer = calculateScore(closedTiles, [], condition)!;
  return { closedTiles, openMelds: [], condition, answer };
}

// === 役から自動生成 ===

export function generateFromYaku(strategy: string): QuizQuestion | null {
  for (let retry = 0; retry < 100; retry++) {
    const hand = generateHandByStrategy(strategy);
    if (!hand) continue;
    const condition = makeBaseCondition(hand);
    const isMenzen = hand.openMelds.every(m => !m.isOpen);
    if (isMenzen) condition.isRiichi = Math.random() < 0.3;

    let answer = calculateScore(hand.closedTiles, hand.openMelds, condition);
    if (!answer && isMenzen) {
      condition.isRiichi = true;
      answer = calculateScore(hand.closedTiles, hand.openMelds, condition);
    }
    if (!answer) continue;
    return { closedTiles: hand.closedTiles, openMelds: hand.openMelds, condition, answer };
  }
  return null;
}

// === 苦手特化出題 ===

const CATEGORY_STRATEGY_MAP: Record<ErrorCategory, string[]> = {
  missed_yaku: ['random', 'honitsu', 'ittsu', 'sanshoku'],
  extra_yaku: ['random', 'honitsu', 'ittsu'],
  pinfu_tsumo_fu: ['pinfu'],
  pinfu_ron_fu: ['pinfu'],
  chiitoitsu_fu: ['chiitoitsu'],
  wait_fu: ['pinfu', 'random'],
  yakuhai_koutsu_fu: ['honitsu', 'random'],
  renfu_jantai_fu: ['honitsu', 'random'],
  open_min30_fu: ['tanyao', 'honitsu', 'toitoi'],
  kantsu_fu: ['kantsu_mix', 'high_fu'],
  open_yaku: ['honitsu', 'toitoi', 'tanyao'],
  kazoe_yakuman: ['random'],
  kiriage_mangan: ['random'],
  score_lookup: ['random'],
  other_fu: ['random', 'high_fu'],
  other: ['random'],
};

export function generateWeaknessQuiz(categories: CategoryCount[], difficulty: Difficulty = 'normal'): QuizQuestion {
  const top = categories.slice(0, 3);
  const totalWeight = top.reduce((s, c) => s + c.count, 0);

  let strategy = 'random';
  if (totalWeight > 0 && Math.random() < 0.7) {
    let r = Math.random() * totalWeight;
    for (const cat of top) {
      r -= cat.count;
      if (r <= 0) {
        const strategies = CATEGORY_STRATEGY_MAP[cat.category] ?? ['random'];
        strategy = pick(strategies);
        break;
      }
    }
  }

  for (let retry = 0; retry < 100; retry++) {
    const s = retry < 70 ? strategy : pickStrategy(difficulty);
    const hand = generateHandByStrategy(s);
    if (!hand) continue;
    const q = tryBuildQuiz(hand, difficulty);
    if (q) return q;
  }

  return generateQuiz(difficulty);
}
