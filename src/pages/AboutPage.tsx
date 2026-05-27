import { Link } from 'react-router-dom';

const sectionStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: 16,
  border: '1px solid #e0e0e0', marginBottom: 14,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10,
};

export function AboutPage() {
  return (
    <div>
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 16 }}>このアプリについて</h2>

      <div style={sectionStyle}>
        <div style={{ fontSize: 14, color: '#2c3e50', lineHeight: 1.8 }}>
          麻雀の点数計算を反復練習できるWebアプリです。<br />
          学習データはブラウザに保存されます。ログイン時はクラウドにも同期されます。
        </div>
      </div>

      {/* Modes */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>各モードの説明</div>

        <ModeItem
          name="クイズ"
          description="ランダムに出題される問題を解いて点数計算を練習します。難易度・回答モード・制限時間を設定から変更できます。"
        />
        <ModeItem
          name="検定"
          description="制限時間つきの実力テストです。全問正解で合格となり、レベルごとの合格記録が残ります。"
        />
        <ModeItem
          name="自作"
          description="自分で手牌を作成して点数計算を練習できます。苦手な形を繰り返し練習するのに便利です。"
        />
        <ModeItem
          name="成績"
          description="クイズ・自作問題・苦手克服モードの回答履歴と正答率を確認できます。苦手分野のランキングも表示されます。"
          note="※ 検定モードの回答は学習履歴に含まれません"
        />
        <ModeItem
          name="ルール"
          description="符計算ルール・点数計算ルール・役一覧の早見表を確認できます。"
          last
        />
      </div>

      {/* Difficulty */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>難易度について</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr',
          gap: '8px 12px', fontSize: 14, color: '#2c3e50',
        }}>
          <span style={{ fontWeight: 'bold' }}>初級</span>
          <span>基本役のみ（平和・断么九・一盃口など）</span>

          <span style={{ fontWeight: 'bold' }}>中級</span>
          <span>全役（三色・七対子・混一色・役満など）</span>

          <span style={{ fontWeight: 'bold' }}>上級</span>
          <span>プロ試験対策（複雑な符計算を含む）</span>
        </div>
        <div style={{
          marginTop: 10, fontSize: 12, color: '#7f8c8d', lineHeight: 1.6,
        }}>
          ※ 上級は最高位戦日本プロ麻雀協会のプロテスト過去問に基づいて作成しています
        </div>
      </div>

      {/* Certification levels */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>検定レベル</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr',
          gap: '8px 12px', fontSize: 14, color: '#2c3e50',
        }}>
          <span style={{ fontWeight: 'bold' }}>1級</span>
          <span>基本役 / 30秒 / 5問</span>

          <span style={{ fontWeight: 'bold' }}>2級</span>
          <span>全役 / 30秒 / 5問</span>

          <span style={{ fontWeight: 'bold' }}>3級</span>
          <span>プロ試験レベル / 30秒 / 5問</span>

          <span style={{ fontWeight: 'bold' }}>初段</span>
          <span>プロ試験レベル / 15秒 / 5問</span>
        </div>
        <div style={{
          marginTop: 10, fontSize: 12, color: '#7f8c8d', lineHeight: 1.6,
        }}>
          ※ すべて全問正解で合格。回答形式はアガリ点数のみ
        </div>
      </div>

      {/* Rules */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>ルールについて</div>
        <div style={{ fontSize: 14, color: '#2c3e50', lineHeight: 1.8 }}>
          符計算・点数計算のルールはM-League公式ルールに準拠しています。
          詳しくはルールタブの「符計算ルール」「点数計算ルール」をご参照ください。
        </div>
      </div>

      <Link
        to="/settings"
        style={{
          display: 'block', textAlign: 'center', marginTop: 4,
          fontSize: 14, color: '#7f8c8d', textDecoration: 'none',
        }}
      >
        ← 設定に戻る
      </Link>
    </div>
  );
}

function ModeItem({ name, description, note, last }: {
  name: string; description: string; note?: string; last?: boolean;
}) {
  return (
    <div style={{
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid #f0f0f0',
    }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 }}>
        {name}
      </div>
      <div style={{ fontSize: 13, color: '#5d4037', lineHeight: 1.7 }}>
        {description}
      </div>
      {note && (
        <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
          {note}
        </div>
      )}
    </div>
  );
}
