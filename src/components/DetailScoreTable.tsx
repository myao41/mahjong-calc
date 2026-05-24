import { useState, useEffect } from 'react';
import { calcBaseScore } from '../utils/score';

interface Props {
  highlightFu?: number;
  highlightHan?: number;
  highlightYakuman?: boolean;
  defaultMode?: 'dealer' | 'child';
  defaultAgari?: 'ron' | 'tsumo';
  showTitle?: boolean;
}

const headerStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: '#f1f8e9',
  fontWeight: 'bold',
  color: '#33691e',
  fontSize: 12,
  textAlign: 'center',
  borderBottom: '1px solid #c5e1a5',
  borderRight: '1px solid #c5e1a5',
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #e0e0e0',
  borderRight: '1px solid #e0e0e0',
  fontSize: 12,
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

function cellText(fu: number, han: number, isDealer: boolean, isTsumo: boolean): string {
  const base = calcBaseScore(han, fu, 0);
  if (isTsumo) {
    if (isDealer) {
      return `${roundUp100(base * 2).toLocaleString()} オール`;
    }
    const fromChild = roundUp100(base);
    const fromDealer = roundUp100(base * 2);
    return `${fromChild.toLocaleString()}/${fromDealer.toLocaleString()}`;
  }
  const total = isDealer ? roundUp100(base * 6) : roundUp100(base * 4);
  return total.toLocaleString();
}

function isMangan(fu: number, han: number): boolean {
  return calcBaseScore(han, fu, 0) >= 2000;
}

function cellCanExist(fu: number, han: number, isTsumo: boolean): boolean {
  // 20符は ピンフツモのみ → ロンでは存在しない
  if (fu === 20 && !isTsumo) return false;
  // 20符は1翻不可（最低でもピンフツモで2翻必要）
  if (fu === 20 && han === 1) return false;
  // 25符は七対子（2翻）以上が前提のため1翻不可
  if (fu === 25 && han === 1) return false;
  return true;
}

export function DetailScoreTable({
  highlightFu, highlightHan, highlightYakuman = false,
  defaultMode = 'child', defaultAgari = 'ron',
  showTitle = true,
}: Props) {
  const [mode, setMode] = useState<'dealer' | 'child'>(defaultMode);
  const [agari, setAgari] = useState<'ron' | 'tsumo'>(defaultAgari);

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);
  useEffect(() => { setAgari(defaultAgari); }, [defaultAgari]);

  const isDealer = mode === 'dealer';
  const isTsumo = agari === 'tsumo';

  const hanCols = [1, 2, 3, 4];
  const fuRows = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

  return (
    <div>
      {showTitle && (
        <div style={{
          fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginBottom: 8,
        }}>
          符×翻 詳細表
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['child', 'dealer'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '6px 14px', fontSize: 13, fontWeight: 'bold',
                border: '1px solid #2196f3', cursor: 'pointer',
                background: mode === m ? '#2196f3' : '#fff',
                color: mode === m ? '#fff' : '#2196f3',
                borderRadius: m === 'child' ? '4px 0 0 4px' : '0 4px 4px 0',
              }}
            >
              {m === 'dealer' ? '親' : '子'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['ron', 'tsumo'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAgari(a)}
              style={{
                padding: '6px 14px', fontSize: 13, fontWeight: 'bold',
                border: '1px solid #ff9800', cursor: 'pointer',
                background: agari === a ? '#ff9800' : '#fff',
                color: agari === a ? '#fff' : '#ff9800',
                borderRadius: a === 'ron' ? '4px 0 0 4px' : '0 4px 4px 0',
              }}
            >
              {a === 'ron' ? 'ロン' : 'ツモ'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          borderCollapse: 'collapse', width: '100%',
          border: '2px solid #4caf50', fontSize: 12,
        }}>
          <thead>
            <tr>
              <th style={headerStyle}>符＼翻</th>
              {hanCols.map(h => (
                <th key={h} style={headerStyle}>{h}翻</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fuRows.map((fu) => (
              <tr key={fu}>
                <td style={{
                  ...cellStyle, background: '#f9fbe7',
                  fontWeight: 'bold', color: '#33691e',
                }}>
                  {fu}符
                </td>
                {hanCols.map(h => {
                  if (!cellCanExist(fu, h, isTsumo)) {
                    return <td key={h} style={{ ...cellStyle, color: '#ccc' }}>-</td>;
                  }
                  const text = cellText(fu, h, isDealer, isTsumo);
                  const mangan = isMangan(fu, h);
                  const isHighlight = !highlightYakuman
                    && highlightFu !== undefined
                    && highlightHan !== undefined
                    && fu === highlightFu
                    && (h === highlightHan || (h === 4 && highlightHan >= 4 && highlightHan <= 4));
                  return (
                    <td key={h} style={{
                      ...cellStyle,
                      background: isHighlight
                        ? '#fff9c4'
                        : (mangan ? '#fff3e0' : 'transparent'),
                      fontWeight: isHighlight || mangan ? 'bold' : 'normal',
                      color: isHighlight
                        ? '#b71c1c'
                        : (mangan ? '#e65100' : '#333'),
                      outline: isHighlight ? '2px solid #e74c3c' : 'none',
                      outlineOffset: -1,
                    }}>
                      {mangan ? '満貫' : text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 満貫以上 mini-table */}
      <ManganTable
        isDealer={isDealer}
        isTsumo={isTsumo}
        highlightHan={highlightHan}
        highlightYakuman={highlightYakuman}
      />
    </div>
  );
}

function ManganTable({ isDealer, isTsumo, highlightHan, highlightYakuman }: {
  isDealer: boolean;
  isTsumo: boolean;
  highlightHan?: number;
  highlightYakuman?: boolean;
}) {
  type Row = {
    name: string; hanRange: string;
    baseScore: number; isYakumanRow?: boolean;
    matches: (han: number, yakuman: boolean) => boolean;
  };

  const rows: Row[] = [
    { name: '満貫', hanRange: '5翻', baseScore: 2000, matches: (h, y) => !y && h === 5 },
    { name: '跳満', hanRange: '6-7翻', baseScore: 3000, matches: (h, y) => !y && h >= 6 && h <= 7 },
    { name: '倍満', hanRange: '8-10翻', baseScore: 4000, matches: (h, y) => !y && h >= 8 && h <= 10 },
    { name: '三倍満', hanRange: '11翻以上', baseScore: 6000, matches: (h, y) => !y && h >= 11 },
    { name: '役満', hanRange: '役満役', baseScore: 8000, isYakumanRow: true, matches: (_h, y) => y },
  ];

  const valueFor = (base: number) => {
    if (isTsumo) {
      if (isDealer) return `${roundUp100(base * 2).toLocaleString()} オール`;
      return `${roundUp100(base).toLocaleString()}/${roundUp100(base * 2).toLocaleString()}`;
    }
    return (isDealer ? roundUp100(base * 6) : roundUp100(base * 4)).toLocaleString();
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: '#2e7d32', marginBottom: 4, fontWeight: 'bold' }}>
        満貫以上
      </div>
      <table style={{
        borderCollapse: 'collapse', width: '100%',
        border: '2px solid #4caf50', fontSize: 12,
      }}>
        <thead>
          <tr>
            <th style={headerStyle}>名称</th>
            <th style={headerStyle}>翻数</th>
            <th style={headerStyle}>
              {isDealer ? '親' : '子'}{isTsumo ? 'ツモ' : 'ロン'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const isHighlight = highlightHan !== undefined &&
              r.matches(highlightHan, highlightYakuman ?? false);
            return (
              <tr key={r.name}>
                <td style={{
                  ...cellStyle, fontWeight: 'bold',
                  color: r.isYakumanRow ? '#c62828' : '#e65100',
                  background: isHighlight ? '#fff9c4' : 'transparent',
                  outline: isHighlight ? '2px solid #e74c3c' : 'none',
                  outlineOffset: -1,
                }}>{r.name}</td>
                <td style={{
                  ...cellStyle,
                  background: isHighlight ? '#fff9c4' : 'transparent',
                  outline: isHighlight ? '2px solid #e74c3c' : 'none',
                  outlineOffset: -1,
                }}>{r.hanRange}</td>
                <td style={{
                  ...cellStyle, fontWeight: isHighlight ? 'bold' : 'normal',
                  color: isHighlight ? '#b71c1c' : '#333',
                  background: isHighlight ? '#fff9c4' : 'transparent',
                  outline: isHighlight ? '2px solid #e74c3c' : 'none',
                  outlineOffset: -1,
                }}>{valueFor(r.baseScore)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
