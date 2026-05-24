import type { ReactNode } from 'react';

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, color: '#2e7d32', marginBottom: 8,
  padding: '6px 12px', background: '#e8f5e9', borderRadius: 4,
  fontWeight: 'bold',
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#f1f8e9',
  fontWeight: 'bold',
  color: '#33691e',
  fontSize: 12,
  textAlign: 'center',
  borderBottom: '1px solid #c5e1a5',
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #e0e0e0',
  fontSize: 14,
  textAlign: 'center',
};

export function FuRulePage() {
  return (
    <div>
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 6 }}>
        符計算ルール
      </h2>
      <div style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 16 }}>
        M-League公式ルール 第3条 得点計算(1) 準拠
      </div>

      <Section title="基本符">
        <RuleRow name="副底（フーテイ）" value="20符" note="全てのアガリの基本点" />
        <RuleRow name="門前清栄和加符" value="+10符" note="門前で出アガリ（ロン）した場合" />
        <RuleRow name="ツモ符" value="+2符" note="ツモアガリ。ただし平和ツモは加算しない" />
      </Section>

      <Section title="待ち符">
        <RuleRow name="辺張（ペンチャン）待ち" value="+2符" />
        <RuleRow name="嵌張（カンチャン）待ち" value="+2符" />
        <RuleRow name="単騎（タンキ）待ち" value="+2符" />
        <RuleRow name="両面・シャンポン待ち" value="0符" />
      </Section>

      <Section title="面子の符">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 8 }}>
          <thead>
            <tr>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>面子</th>
              <th style={tableHeaderStyle}>中張牌<br /><span style={{ fontWeight: 'normal', fontSize: 11 }}>(2-8)</span></th>
              <th style={tableHeaderStyle}>老頭牌<br /><span style={{ fontWeight: 'normal', fontSize: 11 }}>(1・9)</span></th>
              <th style={tableHeaderStyle}>字牌<br /><span style={{ fontWeight: 'normal', fontSize: 11 }}>(風・三元)</span></th>
            </tr>
          </thead>
          <tbody>
            <MentsuFuRow label="明刻" mid={2} terminal={4} honor={4} />
            <MentsuFuRow label="暗刻" mid={4} terminal={8} honor={8} />
            <MentsuFuRow label="明槓" mid={8} terminal={16} honor={16} />
            <MentsuFuRow label="暗槓" mid={16} terminal={32} honor={32} />
          </tbody>
        </table>
      </Section>

      <Section title="雀頭の符">
        <RuleRow name="中張牌（2-8）" value="0符" />
        <RuleRow name="老頭牌（1・9）" value="0符" />
        <RuleRow name="客風牌（場風でも自風でもない）" value="0符" />
        <RuleRow name="場風牌" value="+2符" />
        <RuleRow name="自風牌" value="+2符" />
        <RuleRow name="連風牌（場風＝自風）" value="+2符" note="連風牌は+2符（+4符ではない）" />
        <RuleRow name="三元牌（白・發・中）" value="+2符" />
      </Section>

      <Section title="特殊符">
        <RuleRow name="平和ツモ" value="20符固定" note="副底のみ。ツモ符は加算しない" />
        <RuleRow name="平和ロン" value="30符固定" note="副底20+門前ロン10。他の符は加算しない" />
        <RuleRow name="七対子" value="25符固定" note="他の符計算は適用しない" />
        <RuleRow name="副露時の最低保証" value="30符" note="副底20のみの場合は10符加算" />
      </Section>

      <Section title="計算方法">
        <div style={{ fontSize: 14, lineHeight: 1.7, color: '#2c3e50', padding: '0 4px' }}>
          <p style={{ marginBottom: 8 }}>
            副底、門前清栄和加符、面子の符、雀頭の符、待ち符、ツモ符を合計したものを<b>連底</b>といいます。
          </p>
          <p style={{ marginBottom: 8 }}>
            連底の<b>1の位を10の位に切り上げ</b>たものが最終的な符となります。
          </p>
          <div style={{
            background: '#fff8e1', padding: 12, borderRadius: 6,
            border: '1px solid #ffe082', marginTop: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 4 }}>例：</div>
            <div style={{ fontSize: 13, color: '#2c3e50' }}>
              副底 20 + 暗刻（中張）4 + 単騎待ち 2 + ツモ 2 = <b>28符</b><br />
              → 切り上げて <b style={{ color: '#e65100' }}>30符</b>
            </div>
          </div>
        </div>
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

function RuleRow({ name, value, note }: { name: string; value: string; note?: string }) {
  return (
    <div style={{
      padding: '8px 12px',
      borderBottom: '1px solid #eee',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
        <div style={{ flex: 1, fontSize: 14, color: '#2c3e50' }}>{name}</div>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#e65100', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
      {note && (
        <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>{note}</div>
      )}
    </div>
  );
}

function MentsuFuRow({ label, mid, terminal, honor }: {
  label: string; mid: number; terminal: number; honor: number;
}) {
  return (
    <tr>
      <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>{label}</td>
      <td style={{ ...cellStyle, color: '#e65100', fontWeight: 'bold' }}>{mid}符</td>
      <td style={{ ...cellStyle, color: '#e65100', fontWeight: 'bold' }}>{terminal}符</td>
      <td style={{ ...cellStyle, color: '#e65100', fontWeight: 'bold' }}>{honor}符</td>
    </tr>
  );
}
