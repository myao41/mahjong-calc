interface Props {
  highlightHan?: number;
  isDealer: boolean;
  agariType: 'tsumo' | 'ron';
  isYakuman?: boolean;
}

const rows: { han: number; label: string; dealerTsumo: string; dealerRon: number; childTsumo: string; childRon: number }[] = [
  { han: 1, label: '1翻',           dealerTsumo: '500ALL',   dealerRon: 1500,  childTsumo: '300/500',     childRon: 1000 },
  { han: 2, label: '2翻',           dealerTsumo: '1000ALL',  dealerRon: 3000,  childTsumo: '500/1000',    childRon: 2000 },
  { han: 3, label: '3翻',           dealerTsumo: '2000ALL',  dealerRon: 5800,  childTsumo: '1000/2000',   childRon: 3900 },
  { han: 4, label: '4翻(満貫)',     dealerTsumo: '4000ALL',  dealerRon: 12000, childTsumo: '2000/4000',   childRon: 8000 },
  { han: 6, label: '6翻(跳満)',     dealerTsumo: '6000ALL',  dealerRon: 18000, childTsumo: '3000/6000',   childRon: 12000 },
  { han: 8, label: '8翻(倍満)',     dealerTsumo: '8000ALL',  dealerRon: 24000, childTsumo: '4000/8000',   childRon: 16000 },
  { han: 11, label: '11翻以上(三倍満)', dealerTsumo: '12000ALL', dealerRon: 36000, childTsumo: '6000/12000',  childRon: 24000 },
  { han: 13, label: '役満',          dealerTsumo: '16000ALL', dealerRon: 48000, childTsumo: '8000/16000',  childRon: 32000 },
];

function matchRow(rowHan: number, answerHan: number, isYakuman: boolean): boolean {
  if (isYakuman) return rowHan === 13;
  if (rowHan === 1 && answerHan === 1) return true;
  if (rowHan === 2 && answerHan === 2) return true;
  if (rowHan === 3 && answerHan === 3) return true;
  if (rowHan === 4 && (answerHan === 4 || answerHan === 5)) return true;
  if (rowHan === 6 && (answerHan === 6 || answerHan === 7)) return true;
  if (rowHan === 8 && answerHan >= 8 && answerHan <= 10) return true;
  if (rowHan === 11 && answerHan >= 11) return true;
  return false;
}

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

export function ScoreTable({ highlightHan, isDealer, agariType, isYakuman = false }: Props) {
  const colIdx = isDealer
    ? (agariType === 'tsumo' ? 0 : 1)
    : (agariType === 'tsumo' ? 3 : 4);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 6, color: '#2e7d32' }}>簡単点数表</div>
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
          {rows.map((row) => {
            const isRowMatch = highlightHan !== undefined && matchRow(row.han, highlightHan, isYakuman);
            const vals = [row.dealerTsumo, String(row.dealerRon), row.label, row.childTsumo, String(row.childRon)];
            return (
              <tr key={row.han}>
                {vals.map((v, ci) => {
                  const isCellMatch = isRowMatch && ci === colIdx;
                  const isCenterCol = ci === 2;
                  return (
                    <td key={ci} style={{
                      ...cell,
                      background: isCellMatch ? '#fff9c4' : (isRowMatch ? '#f1f8e9' : (isCenterCol ? '#f9fbe7' : 'transparent')),
                      fontWeight: isCellMatch ? 'bold' : (isCenterCol ? 'bold' : 'normal'),
                      color: isCellMatch ? '#b71c1c' : (isCenterCol ? '#33691e' : '#333'),
                      fontSize: isCenterCol ? 12 : 13,
                    }}>
                      {v}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
