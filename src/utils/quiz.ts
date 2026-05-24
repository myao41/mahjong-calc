import type { Tile, Mentsu, AgariCondition, Wind, QuizQuestion, Suit } from '../types';
import { sortTiles } from './tiles';
import { calculateScore } from './score';

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

function pickStrategy(): string {
  const r = Math.random();
  if (r < 0.15) return 'tanyao';
  if (r < 0.30) return 'pinfu';
  if (r < 0.40) return 'ittsu';
  if (r < 0.50) return 'sanshoku';
  if (r < 0.60) return 'honitsu';
  if (r < 0.70) return 'chiitoitsu';
  if (r < 0.78) return 'toitoi';
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
    default: return generateRandomHand();
  }
}

export function generateQuiz(): QuizQuestion {
  for (let retry = 0; retry < 100; retry++) {
    const strategy = pickStrategy();
    const hand = generateHandByStrategy(strategy);
    if (!hand) continue;

    const agariType = pick(['tsumo', 'ron'] as const);
    const seatWind = pick([1, 2, 3, 4] as Wind[]);
    const roundWind = pick([1, 2] as Wind[]);

    const condition: AgariCondition = {
      agariType,
      agariTile: hand.agariTile,
      seatWind,
      roundWind,
      isRiichi: false,
      isDoubleRiichi: false,
      isIppatsu: false,
      isRinshan: false,
      isChankan: false,
      isHaitei: false,
      isHoutei: false,
      isTenhou: false,
      isChihou: false,
      doraCount: 0,
      uraDoraCount: 0,
      redDoraCount: 0,
    };

    const isMenzen = hand.openMelds.length === 0;
    if (isMenzen) {
      condition.isRiichi = Math.random() < 0.5;
    }

    let answer = calculateScore(hand.closedTiles, hand.openMelds, condition);

    if (!answer && isMenzen) {
      condition.isRiichi = true;
      answer = calculateScore(hand.closedTiles, hand.openMelds, condition);
    }

    if (!answer) continue;
    if (answer.yaku.some(y => y.isYakuman)) continue;

    return {
      closedTiles: hand.closedTiles,
      openMelds: hand.openMelds,
      condition,
      answer,
    };
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
