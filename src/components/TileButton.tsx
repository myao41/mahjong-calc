import type { Tile } from '../types';
import tilesSprite from '../assets/tiles_v2.jpg';
import { useViewport } from '../utils/useViewport';

interface Props {
  tile: Tile;
  onClick?: (tile: Tile) => void;
  selected?: boolean;
  size?: 'small' | 'normal';
  disabled?: boolean;
}

// 新スプライト: 640x480, 9列 x 5行
// Row 0: 萬子 1-9 (col 0-8)
// Row 1: 筒子 1-9
// Row 2: 索子 1-9
// Row 3: 字牌 (col 0-3: 東南西北, col 4: 空, col 5: 白, col 6: 發, col 7: 中, col 8: 空)
// Row 4: 花牌 (使用しない)
const SPRITE_COLS = 9;
const SPRITE_ROWS = 5;
const NATIVE_TILE_W = 640 / SPRITE_COLS; // ≈ 71.11
const NATIVE_TILE_H = 480 / SPRITE_ROWS; // = 96
// 各行の絵柄下端は本来同じになるべきだが、新スプライトでは行ごとに最大8pxずれている。
// 行0(萬)を基準に、他の行を下方向にシフトして絵柄下端を揃える。
// 測定値: row底=[84,82,79,76] → 差分=[0,2,5,8]
const ROW_BOTTOM_ALIGN = [0, 2, 5, 8, 0]; // 行4は花牌(未使用)なので0

function spriteCoord(tile: Tile): { col: number; row: number } {
  if (tile.suit === 'z') {
    // 字牌: z1-z4 → col 0-3, z5(白) → col 5, z6(發) → col 6, z7(中) → col 7
    const colMap = [0, 0, 1, 2, 3, 5, 6, 7]; // index by tile.num (1-7)
    return { row: 3, col: colMap[tile.num] };
  }
  const rowMap: Record<string, number> = { m: 0, p: 1, s: 2 };
  const row = rowMap[tile.suit];
  // 数牌: col = num - 1 (1-9 → 0-8)。赤ドラも同じセル（視覚的に区別は別途）
  return { row, col: tile.num - 1 };
}

export function TileButton({ tile, onClick, selected, size = 'normal', disabled }: Props) {
  const { isMobile } = useViewport();
  const isSmall = size === 'small';
  // 新スプライトのアスペクト比 71.11:96 ≈ 0.74:1
  // 縦長気味なので幅基準で算出
  // 新スプライトのアスペクト比 (71.11:96 ≈ 3:4) に合わせて再計算
  const width = isSmall ? (isMobile ? 18 : 26) : (isMobile ? 24 : 38);
  const height = Math.round(width * NATIVE_TILE_H / NATIVE_TILE_W);

  const { col, row } = spriteCoord(tile);
  const scale = width / NATIVE_TILE_W;
  const bgW = 640 * scale;
  const bgH = 480 * scale;
  const bgX = -col * NATIVE_TILE_W * scale;
  const bgY = (-row * NATIVE_TILE_H + ROW_BOTTOM_ALIGN[row]) * scale;

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
    >
      {/* 赤ドラインジケータ */}
      {tile.isRed && (
        <span style={{
          position: 'absolute',
          top: 1,
          right: 1,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#e74c3c',
          boxShadow: '0 0 2px rgba(0,0,0,0.3)',
        }} />
      )}
    </div>
  );
}
