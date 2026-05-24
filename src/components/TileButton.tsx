import type { Tile } from '../types';
import tilesSprite from '../assets/tiles.png';
import { useViewport } from '../utils/useViewport';

interface Props {
  tile: Tile;
  onClick?: (tile: Tile) => void;
  selected?: boolean;
  size?: 'small' | 'normal';
  disabled?: boolean;
}

const SPRITE_COLS = 10;
const SPRITE_ROWS = 4;
const NATIVE_TILE_W = 76;
const NATIVE_TILE_H = 114;
// Vertical content offset within each row's cell (native pixels).
// The sprite art is drawn with progressively lower baselines per row,
// so we shift the background up to align the tile content.
const ROW_OFFSET_PX = [0, 8, 12, 16];

function spriteCoord(tile: Tile): { col: number; row: number } {
  if (tile.suit === 'z') {
    return { row: 0, col: tile.num - 1 };
  }
  const rowMap: Record<string, number> = { m: 1, s: 2, p: 3 };
  const row = rowMap[tile.suit];
  if (tile.isRed && tile.num === 5) return { row, col: 5 };
  const col = tile.num <= 5 ? tile.num - 1 : tile.num;
  return { row, col };
}

export function TileButton({ tile, onClick, selected, size = 'normal', disabled }: Props) {
  const { isMobile } = useViewport();
  const isSmall = size === 'small';
  const width = isSmall ? (isMobile ? 20 : 28) : (isMobile ? 22 : 34);
  const height = isSmall ? (isMobile ? 30 : 42) : (isMobile ? 33 : 51);

  const { col, row } = spriteCoord(tile);
  const scale = width / NATIVE_TILE_W;
  const bgW = NATIVE_TILE_W * SPRITE_COLS * scale;
  const bgH = NATIVE_TILE_H * SPRITE_ROWS * scale;
  const bgX = -col * width;
  const bgY = -(row * NATIVE_TILE_H + ROW_OFFSET_PX[row]) * scale;

  return (
    <div
      onClick={() => !disabled && onClick?.(tile)}
      style={{
        width,
        height,
        backgroundImage: `url(${tilesSprite})`,
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative',
        outline: selected ? '2px solid #e67e22' : 'none',
        outlineOffset: 2,
        borderRadius: 3,
        boxShadow: selected ? '0 0 4px rgba(230,126,34,0.5)' : 'none',
      }}
    />
  );
}
