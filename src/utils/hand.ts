import type { Tile, Mentsu, Jantai, HandDecomposition } from '../types';
import { tileToId, sortTiles } from './tiles';

type TileCount = Map<number, number>;

function tilesToCount(tiles: Tile[]): TileCount {
  const count = new Map<number, number>();
  for (const t of tiles) {
    const id = tileToId(t);
    count.set(id, (count.get(id) || 0) + 1);
  }
  return count;
}

function removeTiles(count: TileCount, ids: number[]): TileCount | null {
  const next = new Map(count);
  for (const id of ids) {
    const c = next.get(id) || 0;
    if (c <= 0) return null;
    if (c === 1) next.delete(id);
    else next.set(id, c - 1);
  }
  return next;
}

function findFirstId(count: TileCount): number | undefined {
  let minId: number | undefined;
  for (const id of count.keys()) {
    if (minId === undefined || id < minId) minId = id;
  }
  return minId;
}

function canFormShuntsu(id: number): boolean {
  const suit = Math.floor(id / 10);
  return suit < 3; // m=0, p=1, s=2, z=3 (z can't form sequences)
}

function idToTile(id: number): Tile {
  const suitMap: Record<number, 'm' | 'p' | 's' | 'z'> = { 0: 'm', 1: 'p', 2: 's', 3: 'z' };
  return { suit: suitMap[Math.floor(id / 10)], num: id % 10 };
}

function decomposeMentsu(
  count: TileCount,
  numNeeded: number
): Mentsu[][] {
  if (numNeeded === 0) {
    const total = Array.from(count.values()).reduce((a, b) => a + b, 0);
    return total === 0 ? [[]] : [];
  }

  const firstId = findFirstId(count);
  if (firstId === undefined) return [];

  const results: Mentsu[][] = [];

  // Try koutsu
  if ((count.get(firstId) || 0) >= 3) {
    const next = removeTiles(count, [firstId, firstId, firstId]);
    if (next) {
      const t = idToTile(firstId);
      for (const rest of decomposeMentsu(next, numNeeded - 1)) {
        results.push([
          { type: 'koutsu', tiles: [t, t, t], isOpen: false },
          ...rest,
        ]);
      }
    }
  }

  // Try shuntsu
  if (canFormShuntsu(firstId) && (firstId % 10) <= 7) {
    const next = removeTiles(count, [firstId, firstId + 1, firstId + 2]);
    if (next) {
      const t1 = idToTile(firstId);
      const t2 = idToTile(firstId + 1);
      const t3 = idToTile(firstId + 2);
      for (const rest of decomposeMentsu(next, numNeeded - 1)) {
        results.push([
          { type: 'shuntsu', tiles: [t1, t2, t3], isOpen: false },
          ...rest,
        ]);
      }
    }
  }

  return results;
}

export function decomposeHand(closedTiles: Tile[]): HandDecomposition[] {
  const sorted = sortTiles(closedTiles);
  const count = tilesToCount(sorted);
  const results: HandDecomposition[] = [];
  const seen = new Set<string>();

  const numMentsu = Math.floor((sorted.length - 2) / 3);

  // Try each possible jantai
  const triedPairs = new Set<number>();
  for (const tile of sorted) {
    const id = tileToId(tile);
    if (triedPairs.has(id)) continue;
    triedPairs.add(id);

    if ((count.get(id) || 0) < 2) continue;

    const afterPair = removeTiles(count, [id, id]);
    if (!afterPair) continue;

    const jantai: Jantai = { tiles: [tile, tile] };

    for (const mentsu of decomposeMentsu(afterPair, numMentsu)) {
      const key = mentsu
        .map(m => `${m.type}:${m.tiles.map(t => tileToId(t)).join(',')}`)
        .sort()
        .join('|') + `|j:${id}`;

      if (!seen.has(key)) {
        seen.add(key);
        results.push({ mentsu, jantai });
      }
    }
  }

  return results;
}

export function isChiitoitsu(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;
  const count = tilesToCount(tiles);
  if (count.size !== 7) return false;
  for (const c of count.values()) {
    if (c !== 2) return false;
  }
  return true;
}

export function isKokushi(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;
  const required = [
    { suit: 'm' as const, num: 1 }, { suit: 'm' as const, num: 9 },
    { suit: 'p' as const, num: 1 }, { suit: 'p' as const, num: 9 },
    { suit: 's' as const, num: 1 }, { suit: 's' as const, num: 9 },
    { suit: 'z' as const, num: 1 }, { suit: 'z' as const, num: 2 },
    { suit: 'z' as const, num: 3 }, { suit: 'z' as const, num: 4 },
    { suit: 'z' as const, num: 5 }, { suit: 'z' as const, num: 6 },
    { suit: 'z' as const, num: 7 },
  ];
  const count = tilesToCount(tiles);
  for (const r of required) {
    const id = tileToId(r);
    if (!count.has(id)) return false;
  }
  let hasPair = false;
  for (const r of required) {
    const id = tileToId(r);
    if ((count.get(id) || 0) >= 2) hasPair = true;
  }
  return hasPair;
}
