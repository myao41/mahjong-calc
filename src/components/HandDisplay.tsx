import { useRef, useState, useEffect } from 'react';
import type { Tile, Mentsu } from '../types';
import { TileButton } from './TileButton';

interface Props {
  closedTiles: Tile[];
  openMelds: Mentsu[];
  agariTileIndex: number | null;
  onRemoveTile: (index: number) => void;
  onSetAgariTile: (index: number) => void;
  onRemoveMeld: (index: number) => void;
}

const TILES_PER_ROW = 9;

export function HandDisplay({
  closedTiles,
  openMelds,
  agariTileIndex,
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

  // × button size scales with tile
  const deleteSize = tileWidth ? Math.max(16, Math.round(tileWidth * 0.32)) : 16;

  return (
    <div ref={containerRef} style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
        手牌 ({totalTiles}/{expectedTotal})
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 4 }}>
          門前手牌（タップで和了牌指定 / ×で削除）
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, minHeight: 54 }}>
          {closedTiles.map((tile, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <TileButton
                tile={tile}
                onClick={() => onSetAgariTile(i)}
                selected={agariTileIndex === i}
                widthPx={tileWidth}
              />
              {agariTileIndex === i && (
                <div style={{
                  position: 'absolute', top: -6, left: -2,
                  background: '#e67e22', color: '#fff',
                  fontSize: deleteSize > 20 ? 11 : 9,
                  borderRadius: 3, padding: '0 3px',
                  pointerEvents: 'none',
                }}>
                  和
                </div>
              )}
              <div
                onClick={(e) => { e.stopPropagation(); onRemoveTile(i); }}
                style={{
                  position: 'absolute', top: -4, right: -4,
                  width: deleteSize, height: deleteSize,
                  borderRadius: '50%',
                  background: '#e74c3c', color: '#fff',
                  fontSize: deleteSize > 20 ? 13 : 10,
                  fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  lineHeight: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                ×
              </div>
            </div>
          ))}
          {closedTiles.length === 0 && (
            <div style={{ color: '#bdc3c7', fontSize: 14, padding: 16 }}>
              下のパレットから牌を選択してください
            </div>
          )}
        </div>
      </div>

      {openMelds.length > 0 && (
        <div>
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
    </div>
  );
}
