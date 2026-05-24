import type { Tile } from '../types';

export function tileToString(tile: Tile): string {
  if (tile.suit === 'z') {
    const names = ['', '東', '南', '西', '北', '白', '發', '中'];
    return names[tile.num];
  }
  const suitNames: Record<string, string> = { m: '萬', p: '筒', s: '索' };
  const numNames = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return numNames[tile.num] + suitNames[tile.suit];
}

export function tileToShortString(tile: Tile): string {
  if (tile.suit === 'z') {
    const names = ['', '東', '南', '西', '北', '白', '發', '中'];
    return names[tile.num];
  }
  return `${tile.isRed ? 0 : tile.num}${tile.suit}`;
}

export function tileToId(tile: Tile): number {
  const suitBase: Record<string, number> = { m: 0, p: 10, s: 20, z: 30 };
  return suitBase[tile.suit] + tile.num;
}

export function sameTile(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.num === b.num;
}

export function isTerminal(tile: Tile): boolean {
  return tile.suit !== 'z' && (tile.num === 1 || tile.num === 9);
}

export function isHonor(tile: Tile): boolean {
  return tile.suit === 'z';
}

export function isTerminalOrHonor(tile: Tile): boolean {
  return isTerminal(tile) || isHonor(tile);
}

export function isSimple(tile: Tile): boolean {
  return tile.suit !== 'z' && tile.num >= 2 && tile.num <= 8;
}

export function isGreen(tile: Tile): boolean {
  if (tile.suit === 'z' && tile.num === 6) return true; // 發
  if (tile.suit === 's' && [2, 3, 4, 6, 8].includes(tile.num)) return true;
  return false;
}

export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => tileToId(a) - tileToId(b));
}

export function tilesEqual(a: Tile[], b: Tile[]): boolean {
  if (a.length !== b.length) return false;
  const sa = sortTiles(a);
  const sb = sortTiles(b);
  return sa.every((t, i) => sameTile(t, sb[i]));
}

export const ALL_TILE_TYPES: Tile[] = [
  ...([1, 2, 3, 4, 5, 6, 7, 8, 9] as number[]).flatMap(num =>
    (['m', 'p', 's'] as const).map(suit => ({ suit, num }))
  ),
  ...([1, 2, 3, 4, 5, 6, 7] as number[]).map(num => ({ suit: 'z' as const, num })),
];

export function tileDisplayNum(tile: Tile): string {
  if (tile.suit === 'z') {
    const names = ['', '東', '南', '西', '北', '白', '發', '中'];
    return names[tile.num];
  }
  if (tile.isRed) return '赤';
  return String(tile.num);
}

export function tileDisplaySuit(tile: Tile): string {
  const suitNames: Record<string, string> = { m: '萬', p: '筒', s: '索', z: '' };
  return suitNames[tile.suit];
}

export function windName(wind: number): string {
  const names = ['', '東', '南', '西', '北'];
  return names[wind] || '';
}
