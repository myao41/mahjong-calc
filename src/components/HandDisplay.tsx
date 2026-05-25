import { useRef, useState, useEffect, useMemo } from 'react';
import type { Tile, Mentsu } from '../types';
import { TileButton } from './TileButton';

interface Props {
  closedTiles: Tile[];
  openMelds: Mentsu[];
  agariTile: Tile | null;
  onRemoveTile: (index: number) => void;
  onSetAgariTile: (tile: Tile) => void;
  onRemoveMeld: (index: number) => void;
}

const TILES_PER_ROW = 9;

function tileKey(t: Tile): string {
  return `${t.suit}${t.num}`;
}

export function HandDisplay({
  closedTiles,
  openMelds,
  agariTile,
  onRemoveTile,
  onSetAgariTile,
  onRemoveMeld,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileWidth, setTileWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setTileWidth(Math.floor(w / TILES_PER_ROW));
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const totalTiles = closedTiles.length + openMelds.reduce((sum, m) => sum + m.tiles.length, 0);
  const numKans = openMelds.filter(m => m.type === 'kantsu').length;
  const expectedTotal = 14 + numKans;

  // Unique tile types in closed hand for agari selector
  const uniqueTiles = useMemo(() => {
    const seen = new Set<string>();
    const result: Tile[] = [];
    for (const t of closedTiles) {
      const k = tileKey(t);
      if (!seen.has(k)) {
        seen.add(k);
        result.push(t);
      }
    }
    return result;
  }, [closedTiles]);

  const agariKey = agariTile ? tileKey(agariTile) : null;

  return (
    <div ref={containerRef} style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
        手牌 ({totalTiles}/{expectedTotal})
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 4 }}>
          門前手牌（タップで削除）
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, minHeight: 54 }}>
          {closedTiles.map((tile, i) => (
            <TileButton
              key={i}
              tile={tile}
              onClick={() => onRemoveTile(i)}
              widthPx={tileWidth}
            />
          ))}
          {closedTiles.length === 0 && (
            <div style={{ color: '#bdc3c7', fontSize: 14, padding: 16 }}>
              下のパレットから牌を選択してください
            </div>
          )}
        </div>
      </div>

      {openMelds.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 2 }}>
            副露（タップで削除）
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {openMelds.map((meld, mi) => (
              <div
                key={mi}
                style={{
                  display: 'flex', gap: 0, padding: '2px 4px',
                  border: '1px dashed #bdc3c7', borderRadius: 4,
                  cursor: 'pointer', alignItems: 'flex-end',
                }}
                onClick={() => onRemoveMeld(mi)}
              >
                {meld.tiles.map((tile, ti) => (
                  <TileButton key={ti} tile={tile} onClick={() => onRemoveMeld(mi)} size="small" />
                ))}
                <div style={{ fontSize: 10, color: '#7f8c8d', alignSelf: 'center', marginLeft: 2 }}>
                  {meld.type === 'shuntsu' ? 'チー'
                    : meld.type === 'koutsu' ? 'ポン'
                    : meld.isOpen ? '明槓' : '暗槓'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agari tile selector */}
      {uniqueTiles.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 4 }}>
            和了牌（タップで選択）
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {uniqueTiles.map((tile) => {
              const k = tileKey(tile);
              const isSelected = k === agariKey;
              return (
                <div key={k} style={{ position: 'relative' }}>
                  <TileButton
                    tile={tile}
                    onClick={() => onSetAgariTile(tile)}
                    selected={isSelected}
                    widthPx={tileWidth ? Math.round(tileWidth * 0.7) : undefined}
                    size="small"
                  />
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -5, right: -5,
                      background: '#e67e22', color: '#fff',
                      fontSize: 9, borderRadius: 3, padding: '0 3px',
                      pointerEvents: 'none',
                    }}>
                      和
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
