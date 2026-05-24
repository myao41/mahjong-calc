const cell: React.CSSProperties = {
  padding: '6px 8px',
  textAlign: 'center',
  fontSize: 13,
  borderBottom: '1px solid #d0d0d0',
  borderRight: '1px solid #d0d0d0',
  whiteSpace: 'nowrap',
};

const hdr: React.CSSProperties = {
  ...cell,
  background: '#e8f5e9',
  fontWeight: 'bold',
  color: '#2e7d32',
};

const simpleRows = [
  { label: '1翻', dealerTsumo: '500ALL', dealerRon: '1,500', childTsumo: '300/500', childRon: '1,000' },
  { label: '2翻', dealerTsumo: '1,000ALL', dealerRon: '3,000', childTsumo: '500/1,000', childRon: '2,000' },
  { label: '3翻', dealerTsumo: '2,000ALL', dealerRon: '5,800', childTsumo: '1,000/2,000', childRon: '3,900' },
  { label: '4翻(満貫)', dealerTsumo: '4,000ALL', dealerRon: '12,000', childTsumo: '2,000/4,000', childRon: '8,000' },
  { label: '6翻(跳満)', dealerTsumo: '6,000ALL', dealerRon: '18,000', childTsumo: '3,000/6,000', childRon: '12,000' },
  { label: '8翻(倍満)', dealerTsumo: '8,000ALL', dealerRon: '24,000', childTsumo: '4,000/8,000', childRon: '16,000' },
  { label: '11翻(三倍満)', dealerTsumo: '12,000ALL', dealerRon: '36,000', childTsumo: '6,000/12,000', childRon: '24,000' },
  { label: '13翻(役満)', dealerTsumo: '16,000ALL', dealerRon: '48,000', childTsumo: '8,000/16,000', childRon: '32,000' },
];

type FuHanCell = { dealerTsumo: string; dealerRon: string; childTsumo: string; childRon: string } | 'mangan';

const fuHanTable: { fu: number; cells: Record<number, FuHanCell> }[] = [
  {
    fu: 20,
    cells: {
      2: { dealerTsumo: '700ALL', dealerRon: '-', childTsumo: '400/700', childRon: '-' },
      3: { dealerTsumo: '1,300ALL', dealerRon: '-', childTsumo: '700/1,300', childRon: '-' },
      4: { dealerTsumo: '2,600ALL', dealerRon: '-', childTsumo: '1,300/2,600', childRon: '-' },
    },
  },
  {
    fu: 25,
    cells: {
      2: { dealerTsumo: '-', dealerRon: '2,400', childTsumo: '-', childRon: '1,600' },
      3: { dealerTsumo: '1,600ALL', dealerRon: '4,800', childTsumo: '800/1,600', childRon: '3,200' },
      4: { dealerTsumo: '3,200ALL', dealerRon: '9,600', childTsumo: '1,600/3,200', childRon: '6,400' },
    },
  },
  {
    fu: 30,
    cells: {
      1: { dealerTsumo: '500ALL', dealerRon: '1,500', childTsumo: '300/500', childRon: '1,000' },
      2: { dealerTsumo: '1,000ALL', dealerRon: '2,900', childTsumo: '500/1,000', childRon: '2,000' },
      3: { dealerTsumo: '2,000ALL', dealerRon: '5,800', childTsumo: '1,000/2,000', childRon: '3,900' },
      4: { dealerTsumo: '3,900ALL', dealerRon: '11,600', childTsumo: '2,000/3,900', childRon: '7,700' },
    },
  },
  {
    fu: 40,
    cells: {
      1: { dealerTsumo: '700ALL', dealerRon: '2,000', childTsumo: '400/700', childRon: '1,300' },
      2: { dealerTsumo: '1,300ALL', dealerRon: '3,900', childTsumo: '700/1,300', childRon: '2,600' },
      3: { dealerTsumo: '2,600ALL', dealerRon: '7,700', childTsumo: '1,300/2,600', childRon: '5,200' },
      4: 'mangan',
    },
  },
  {
    fu: 50,
    cells: {
      1: { dealerTsumo: '800ALL', dealerRon: '2,400', childTsumo: '400/800', childRon: '1,600' },
      2: { dealerTsumo: '1,600ALL', dealerRon: '4,800', childTsumo: '800/1,600', childRon: '3,200' },
      3: { dealerTsumo: '3,200ALL', dealerRon: '9,600', childTsumo: '1,600/3,200', childRon: '6,400' },
      4: 'mangan',
    },
  },
  {
    fu: 60,
    cells: {
      1: { dealerTsumo: '1,000ALL', dealerRon: '2,900', childTsumo: '500/1,000', childRon: '2,000' },
      2: { dealerTsumo: '2,000ALL', dealerRon: '5,800', childTsumo: '1,000/2,000', childRon: '3,900' },
      3: { dealerTsumo: '3,900ALL', dealerRon: '11,600', childTsumo: '2,000/3,900', childRon: '7,700' },
      4: 'mangan',
    },
  },
  {
    fu: 70,
    cells: {
      1: { dealerTsumo: '1,200ALL', dealerRon: '3,400', childTsumo: '600/1,200', childRon: '2,300' },
      2: { dealerTsumo: '2,300ALL', dealerRon: '6,800', childTsumo: '1,200/2,300', childRon: '4,500' },
      3: 'mangan',
      4: 'mangan',
    },
  },
  {
    fu: 80,
    cells: {
      1: { dealerTsumo: '1,300ALL', dealerRon: '3,900', childTsumo: '700/1,300', childRon: '2,600' },
      2: { dealerTsumo: '2,600ALL', dealerRon: '7,700', childTsumo: '1,300/2,600', childRon: '5,200' },
      3: 'mangan',
      4: 'mangan',
    },
  },
  {
    fu: 90,
    cells: {
      1: { dealerTsumo: '1,500ALL', dealerRon: '4,400', childTsumo: '800/1,500', childRon: '2,900' },
      2: { dealerTsumo: '2,900ALL', dealerRon: '8,700', childTsumo: '1,500/2,900', childRon: '5,800' },
      3: 'mangan',
      4: 'mangan',
    },
  },
  {
    fu: 100,
    cells: {
      1: { dealerTsumo: '1,600ALL', dealerRon: '4,800', childTsumo: '800/1,600', childRon: '3,200' },
      2: { dealerTsumo: '3,200ALL', dealerRon: '9,600', childTsumo: '1,600/3,200', childRon: '6,400' },
      3: 'mangan',
      4: 'mangan',
    },
  },
  {
    fu: 110,
    cells: {
      1: { dealerTsumo: '1,800ALL', dealerRon: '5,300', childTsumo: '900/1,800', childRon: '3,600' },
      2: 'mangan',
      3: 'mangan',
      4: 'mangan',
    },
  },
];

const manganStr = '満貫';

type Tab = 'simple' | 'detail';

export function ScoreTablePage() {
  const [tab, setTab] = useState<Tab>('simple');

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        {([['simple', '簡易表'], ['detail', '符×翻 詳細表']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '10px 0', fontSize: 15, fontWeight: 'bold',
              border: '1px solid #4caf50', cursor: 'pointer',
              background: tab === key ? '#4caf50' : '#fff',
              color: tab === key ? '#fff' : '#4caf50',
              borderRadius: key === 'simple' ? '6px 0 0 6px' : '0 6px 6px 0',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'simple' && <SimpleTable />}
      {tab === 'detail' && <DetailTable />}
    </div>
  );
}

function SimpleTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        borderCollapse: 'collapse', width: '100%',
        border: '2px solid #4caf50', fontSize: 13,
      }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ ...hdr, borderBottom: '1px solid #a5d6a7' }}>親</th>
            <th style={{ ...hdr, borderBottom: '1px solid #a5d6a7' }}>役</th>
            <th colSpan={2} style={{ ...hdr, borderBottom: '1px solid #a5d6a7' }}>子</th>
          </tr>
          <tr>
            <th style={hdr}>ツモ</th>
            <th style={hdr}>ロン</th>
            <th style={hdr}></th>
            <th style={hdr}>ツモ</th>
            <th style={hdr}>ロン</th>
          </tr>
        </thead>
        <tbody>
          {simpleRows.map((row, ri) => (
            <tr key={ri}>
              <td style={cell}>{row.dealerTsumo}</td>
              <td style={cell}>{row.dealerRon}</td>
              <td style={{ ...cell, background: '#f9fbe7', fontWeight: 'bold', color: '#33691e', fontSize: 12 }}>{row.label}</td>
              <td style={cell}>{row.childTsumo}</td>
              <td style={cell}>{row.childRon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailTable() {
  const [mode, setMode] = useState<'dealer' | 'child'>('child');
  const [agari, setAgari] = useState<'tsumo' | 'ron'>('ron');

  const hanCols = [1, 2, 3, 4];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['child', 'dealer'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '6px 16px', fontSize: 14, fontWeight: 'bold',
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
                padding: '6px 16px', fontSize: 14, fontWeight: 'bold',
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
          border: '2px solid #4caf50', fontSize: 13,
        }}>
          <thead>
            <tr>
              <th style={hdr}>符＼翻</th>
              {hanCols.map(h => (
                <th key={h} style={hdr}>{h}翻</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fuHanTable.map((row) => (
              <tr key={row.fu}>
                <td style={{ ...cell, background: '#f9fbe7', fontWeight: 'bold', color: '#33691e' }}>
                  {row.fu}符
                </td>
                {hanCols.map(h => {
                  const c = row.cells[h];
                  if (!c) return <td key={h} style={{ ...cell, color: '#ccc' }}>-</td>;
                  if (c === 'mangan') return (
                    <td key={h} style={{ ...cell, background: '#fff3e0', fontWeight: 'bold', color: '#e65100' }}>
                      {manganStr}
                    </td>
                  );
                  const val = mode === 'dealer'
                    ? (agari === 'tsumo' ? c.dealerTsumo : c.dealerRon)
                    : (agari === 'tsumo' ? c.childTsumo : c.childRon);
                  return <td key={h} style={cell}>{val}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginBottom: 8 }}>満貫以上</div>
        <table style={{
          borderCollapse: 'collapse', width: '100%',
          border: '2px solid #4caf50', fontSize: 13,
        }}>
          <thead>
            <tr>
              <th style={hdr}>名称</th>
              <th style={hdr}>翻数</th>
              <th style={hdr}>
                {mode === 'dealer' ? '親' : '子'}
                {agari === 'tsumo' ? 'ツモ' : 'ロン'}
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: '満貫', hanRange: '5翻', dealer: agari === 'tsumo' ? '4,000ALL' : '12,000', child: agari === 'tsumo' ? '2,000/4,000' : '8,000' },
              { name: '跳満', hanRange: '6-7翻', dealer: agari === 'tsumo' ? '6,000ALL' : '18,000', child: agari === 'tsumo' ? '3,000/6,000' : '12,000' },
              { name: '倍満', hanRange: '8-10翻', dealer: agari === 'tsumo' ? '8,000ALL' : '24,000', child: agari === 'tsumo' ? '4,000/8,000' : '16,000' },
              { name: '三倍満', hanRange: '11-12翻', dealer: agari === 'tsumo' ? '12,000ALL' : '36,000', child: agari === 'tsumo' ? '6,000/12,000' : '24,000' },
              { name: '役満', hanRange: '13翻', dealer: agari === 'tsumo' ? '16,000ALL' : '48,000', child: agari === 'tsumo' ? '8,000/16,000' : '32,000' },
            ].map((r) => (
              <tr key={r.name}>
                <td style={{ ...cell, fontWeight: 'bold', color: '#e65100' }}>{r.name}</td>
                <td style={cell}>{r.hanRange}</td>
                <td style={cell}>{mode === 'dealer' ? r.dealer : r.child}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
