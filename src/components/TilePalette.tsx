import type { Tile, Suit } from '../types';
import { TileButton } from './TileButton';

interface Props {
  onSelect: (tile: Tile) => void;
  tileCounts: Map<string, number>;
  size?: 'small' | 'normal';
  /** 無効化する条件をカスタマイズ。trueの牌は disabled になる */
  isDisabled?: (tile: Tile) => boolean;
}

function tileKey(tile: Tile): string {
  return `${tile.suit}${tile.num}`;
}

export function TilePalette({ onSelect, tileCounts, size = 'normal', isDisabled }: Props) {
  const suits: { suit: Suit; label: string; count: number }[] = [
    { suit: 'm', label: '萬子', count: 9 },
    { suit: 'p', label: '筒子', count: 9 },
    { suit: 's', label: '索子', count: 9 },
    { suit: 'z', label: '字牌', count: 7 },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      {suits.map(({ suit, label, count }) => (
        <div key={suit} style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 2 }}>{label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
            {Array.from({ length: count }, (_, i) => {
              const tile: Tile = { suit, num: i + 1 };
              const key = tileKey(tile);
              const used = tileCounts.get(key) || 0;
              const disabled = isDisabled ? isDisabled(tile) : used >= 4;
              return (
                <TileButton
                  key={key}
                  tile={tile}
                  onClick={onSelect}
                  disabled={disabled}
                  size={size}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
