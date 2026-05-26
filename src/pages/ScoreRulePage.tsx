import type { ReactNode } from 'react';
import { DetailScoreTable } from '../components/DetailScoreTable';

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, color: '#2e7d32', marginBottom: 8,
  padding: '6px 12px', background: '#e8f5e9', borderRadius: 4,
  fontWeight: 'bold',
};

const tableHeaderStyle: React.CSSProperties = {
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

export function ScoreRulePage() {
  return (
    <div>
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 6 }}>
        点数計算ルール
      </h2>
      <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 16 }}>
        M-League公式ルール 第4条 得点計算(2) 翻の計算とアガリ点 準拠：<a href="https://m-league.jp/about/" target="_blank" rel="noopener noreferrer" style={{ color: '#7f8c8d' }}>https://m-league.jp/about/</a>
      </div>

      <Section title="基本計算式">
        <div style={{ fontSize: 14, lineHeight: 1.7, color: '#2c3e50', padding: '0 4px' }}>
          <div style={{
            background: '#fff8e1', padding: 12, borderRadius: 6,
            border: '1px solid #ffe082', marginBottom: 10,
          }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#e65100', textAlign: 'center' }}>
              基準点 = 符 × 2<sup>(翻数 + 2)</sup>
            </div>
            <div style={{ fontSize: 12, color: '#7f8c8d', textAlign: 'center', marginTop: 4 }}>
              ※ 「+2」は場ゾロの2翻分
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>アガリ方</th>
                <th style={tableHeaderStyle}>子のアガリ</th>
                <th style={tableHeaderStyle}>親のアガリ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, textAlign: 'left' }}>ロン</td>
                <td style={cellStyle}>基準点 × 4</td>
                <td style={cellStyle}>基準点 × 6</td>
              </tr>
              <tr>
                <td style={{ ...cellStyle, textAlign: 'left' }}>ツモ</td>
                <td style={cellStyle}>子→基準点 ×1 / 親→基準点 ×2</td>
                <td style={cellStyle}>基準点 ×2 オール</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 8, color: '#7f8c8d', fontSize: 12 }}>
            ※ 100点未満は切り上げ
          </p>
        </div>
      </Section>

      <Section title="切り上げ満貫">
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#2c3e50', padding: '0 4px' }}>
          <b>30符4翻、60符3翻</b>などで基準点が <b>1,920</b> となり満貫（2,000）に届かない場合、満貫扱いとします。
        </p>
      </Section>

      <Section title="七対子の特例">
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#2c3e50', padding: '0 4px' }}>
          七対子は<b>25符固定</b>。子の2翻アガリ = 1,600点、親の2翻アガリ = 2,400点。
        </p>
      </Section>

      <Section title="数え役満なし">
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#2c3e50', padding: '0 4px' }}>
          役満以外の役が複合した場合のアガリ点は<b>三倍満を上限</b>とする。
          11翻以上の通常役は三倍満（子24,000 / 親36,000）まで。
        </p>
      </Section>

      <Section title="符×翻 詳細表">
        <DetailScoreTable showTitle={false} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
