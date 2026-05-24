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

export function HandDisplay({
  closedTiles,
  openMelds,
  agariTileIndex,
  onRemoveTile,
  onSetAgariTile,
  onRemoveMeld,
}: Props) {
  const totalTiles = closedTiles.length + openMelds.reduce((sum, m) => sum + m.tiles.length, 0);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
        手牌 ({totalTiles}/14)
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 2 }}>
          門前手牌（クリックで削除 / 長押しでアガリ牌指定）
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, minHeight: 54 }}>
          {closedTiles.map((tile, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <TileButton
                tile={tile}
                onClick={() => onRemoveTile(i)}
                selected={agariTileIndex === i}
              />
              {agariTileIndex === i && (
                <div style={{
                  position: 'absolute', top: -6, right: -2,
                  background: '#e67e22', color: '#fff',
                  fontSize: 9, borderRadius: 3, padding: '0 3px',
                }}>
                  和
                </div>
              )}
              <div
                style={{
                  position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 8, color: '#3498db', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onClick={(e) => { e.stopPropagation(); onSetAgariTile(i); }}
              >
                {agariTileIndex !== i ? '和了' : '✓'}
              </div>
            </div>
          ))}
          {closedTiles.length === 0 && (
            <div style={{ color: '#bdc3c7', fontSize: 14, padding: 16 }}>
              上のパレットから牌を選択してください
            </div>
          )}
        </div>
      </div>

      {openMelds.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 2 }}>
            副露（クリックで削除）
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {openMelds.map((meld, mi) => (
              <div
                key={mi}
                style={{
                  display: 'flex', gap: 0, padding: '2px 4px',
                  border: '1px dashed #bdc3c7', borderRadius: 4,
                  cursor: 'pointer',
                }}
                onClick={() => onRemoveMeld(mi)}
              >
                {meld.tiles.map((tile, ti) => (
                  <TileButton key={ti} tile={tile} onClick={() => onRemoveMeld(mi)} size="small" />
                ))}
                <div style={{ fontSize: 10, color: '#7f8c8d', alignSelf: 'center', marginLeft: 2 }}>
                  {meld.type === 'shuntsu' ? 'チー' : meld.type === 'koutsu' ? 'ポン' : 'カン'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
