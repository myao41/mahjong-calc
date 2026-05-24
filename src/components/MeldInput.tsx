import { useState } from 'react';
import type { Tile, Mentsu, MentsuType, Suit } from '../types';
import { TileButton } from './TileButton';

interface Props {
  onAddMeld: (meld: Mentsu) => void;
  tileCounts: Map<string, number>;
}

function tileKey(tile: Tile): string {
  return `${tile.suit}${tile.num}`;
}

export function MeldInput({ onAddMeld, tileCounts }: Props) {
  const [meldType, setMeldType] = useState<MentsuType>('shuntsu');
  const [selectedSuit, setSelectedSuit] = useState<Suit>('m');
  const [selectedNum, setSelectedNum] = useState<number>(1);

  const canAdd = () => {
    if (meldType === 'shuntsu') {
      if (selectedSuit === 'z') return false;
      if (selectedNum > 7) return false;
      for (let i = 0; i < 3; i++) {
        const key = `${selectedSuit}${selectedNum + i}`;
        if ((tileCounts.get(key) || 0) >= 4) return false;
      }
      return true;
    }
    const key = tileKey({ suit: selectedSuit, num: selectedNum });
    const needed = meldType === 'kantsu' ? 4 : 3;
    return (tileCounts.get(key) || 0) + needed <= 4;
  };

  const handleAdd = () => {
    if (!canAdd()) return;
    const tiles: Tile[] = [];
    if (meldType === 'shuntsu') {
      for (let i = 0; i < 3; i++) {
        tiles.push({ suit: selectedSuit, num: selectedNum + i });
      }
    } else {
      const count = meldType === 'kantsu' ? 4 : 3;
      for (let i = 0; i < count; i++) {
        tiles.push({ suit: selectedSuit, num: selectedNum });
      }
    }
    onAddMeld({ type: meldType, tiles, isOpen: true });
  };

  return (
    <div style={{
      marginBottom: 16, padding: 12,
      background: '#f8f9fa', borderRadius: 8,
    }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>副露追加</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={meldType}
          onChange={e => setMeldType(e.target.value as MentsuType)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #bdc3c7' }}
        >
          <option value="shuntsu">チー（順子）</option>
          <option value="koutsu">ポン（刻子）</option>
          <option value="kantsu">カン（槓子）</option>
        </select>

        <select
          value={selectedSuit}
          onChange={e => setSelectedSuit(e.target.value as Suit)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #bdc3c7' }}
        >
          <option value="m">萬子</option>
          <option value="p">筒子</option>
          <option value="s">索子</option>
          {meldType !== 'shuntsu' && <option value="z">字牌</option>}
        </select>

        <select
          value={selectedNum}
          onChange={e => setSelectedNum(Number(e.target.value))}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #bdc3c7' }}
        >
          {Array.from(
            { length: selectedSuit === 'z' ? 7 : meldType === 'shuntsu' ? 7 : 9 },
            (_, i) => {
              const n = i + 1;
              const labels: Record<string, string[]> = {
                z: ['', '東', '南', '西', '北', '白', '發', '中'],
              };
              const label = selectedSuit === 'z' ? labels.z[n] : String(n);
              return <option key={n} value={n}>{label}</option>;
            }
          )}
        </select>

        <button
          onClick={handleAdd}
          disabled={!canAdd()}
          style={{
            padding: '4px 16px', borderRadius: 4,
            background: canAdd() ? '#3498db' : '#bdc3c7',
            color: '#fff', border: 'none', cursor: canAdd() ? 'pointer' : 'not-allowed',
          }}
        >
          追加
        </button>
      </div>

      {/* Preview */}
      <div style={{ marginTop: 8, display: 'flex', gap: 2 }}>
        {meldType === 'shuntsu' && selectedSuit !== 'z' && selectedNum <= 7 ? (
          [0, 1, 2].map(i => (
            <TileButton
              key={i}
              tile={{ suit: selectedSuit, num: selectedNum + i }}
              onClick={() => {}}
              size="small"
            />
          ))
        ) : meldType !== 'shuntsu' ? (
          Array.from({ length: meldType === 'kantsu' ? 4 : 3 }, (_, i) => (
            <TileButton
              key={i}
              tile={{ suit: selectedSuit, num: selectedNum }}
              onClick={() => {}}
              size="small"
            />
          ))
        ) : null}
      </div>
    </div>
  );
}
