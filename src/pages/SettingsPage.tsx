import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loadSettings, saveSettings, type Settings } from '../utils/settings';
import { useAuth } from '../utils/useAuth';

const sectionStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: 16,
  border: '1px solid #e0e0e0', marginBottom: 14,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4,
};

const noteStyle: React.CSSProperties = {
  fontSize: 12, color: '#7f8c8d', marginBottom: 10,
};

function OptionButtons<T extends string | number | boolean>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string; desc?: string }[];
  selected: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          style={{
            flex: '1 1 0',
            padding: '8px 12px',
            borderRadius: 6,
            border: selected === opt.value ? '2px solid #3498db' : '1px solid #bdc3c7',
            background: selected === opt.value ? '#eef5ff' : '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: selected === opt.value ? 'bold' : 'normal',
            color: selected === opt.value ? '#2980b9' : '#7f8c8d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span>{opt.label}</span>
          {opt.desc && <span style={{ fontSize: 10, opacity: 0.8 }}>{opt.desc}</span>}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const { user, loading, syncing, signInWithTwitter, signOut } = useAuth();
  const [showAuthInfo, setShowAuthInfo] = useState(false);

  const update = (partial: Partial<Settings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 16 }}>設定</h2>

      {/* Account section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>アカウント</div>
        {loading ? (
          <div style={{ fontSize: 13, color: '#7f8c8d', padding: '8px 0' }}>読み込み中...</div>
        ) : user ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '50%' }}
                />
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e50' }}>
                  {user.user_metadata.full_name || user.user_metadata.user_name}
                </div>
                <div style={{ fontSize: 12, color: '#7f8c8d' }}>
                  @{user.user_metadata.user_name}
                </div>
              </div>
            </div>
            {syncing && (
              <div style={{ fontSize: 12, color: '#3498db', marginBottom: 6 }}>
                ☁ データを同期中...
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={signOut}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 'bold',
                  background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c',
                  borderRadius: 4, cursor: 'pointer',
                }}
              >
                ログアウト
              </button>
              <Link
                to="/settings/account"
                style={{
                  fontSize: 13, color: '#7f8c8d', textDecoration: 'none',
                }}
              >
                アカウント管理 &gt;
              </Link>
            </div>
          </div>
        ) : !showAuthInfo ? (
          <div>
            <div style={noteStyle}>ログインすると、学習データをクラウドに保存できます（予定）</div>
            <button
              onClick={() => setShowAuthInfo(true)}
              style={{
                width: '100%', padding: '10px 16px', fontSize: 14, fontWeight: 'bold',
                background: '#000', color: '#fff', border: 'none',
                borderRadius: 6, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>𝕏</span> でログイン
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              background: '#f8f9fa', borderRadius: 8, padding: 14,
              border: '1px solid #e0e0e0', marginBottom: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 }}>
                X 認証について
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#34495e', lineHeight: 2 }}>
                <li>X のログイン画面に移動します</li>
                <li><b>読み取り専用</b>です（投稿・DM の権限はありません）</li>
                <li>取得する情報: ユーザー名・表示名・アイコンのみ</li>
                <li>認証は X の画面からいつでも解除できます</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowAuthInfo(false)}
                style={{
                  flex: 1, padding: '10px 16px', fontSize: 14,
                  background: '#fff', color: '#7f8c8d', border: '1px solid #bdc3c7',
                  borderRadius: 6, cursor: 'pointer',
                }}
              >
                戻る
              </button>
              <button
                onClick={signInWithTwitter}
                style={{
                  flex: 2, padding: '10px 16px', fontSize: 14, fontWeight: 'bold',
                  background: '#000', color: '#fff', border: 'none',
                  borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>𝕏</span> 認証に進む
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>回答モード</div>
        <div style={noteStyle}>上級では自動的に「簡略」になります</div>
        <OptionButtons
          options={[
            { value: 'normal' as const, label: '通常', desc: '翻・符・点数' },
            { value: 'simple' as const, label: '簡略', desc: '点数のみ' },
          ]}
          selected={settings.answerMode}
          onChange={(v) => update({ answerMode: v })}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>制限時間</div>
        <div style={noteStyle}>1問あたりの制限時間</div>
        <OptionButtons
          options={[
            { value: 0, label: 'なし' },
            { value: 15, label: '15秒' },
            { value: 30, label: '30秒' },
            { value: 60, label: '60秒' },
          ]}
          selected={settings.timeLimit}
          onChange={(v) => update({ timeLimit: v })}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>本場</div>
        <OptionButtons
          options={[
            { value: false, label: 'なし' },
            { value: true, label: 'あり', desc: '点数に本場を加算' },
          ]}
          selected={settings.honba}
          onChange={(v) => update({ honba: v })}
        />
      </div>

      {/* About section */}
      <div style={{
        marginTop: 24, padding: 16,
        background: '#f8f9fa', borderRadius: 8, border: '1px solid #e0e0e0',
      }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 }}>
          このアプリについて
        </div>
        <div style={{ fontSize: 13, color: '#7f8c8d', lineHeight: 1.8 }}>
          麻雀の点数計算を反復練習できるWebアプリです。<br />
          学習データはブラウザに保存され、サーバーへの送信はありません。
        </div>
        <div style={{ fontSize: 13, marginTop: 8, display: 'flex', gap: 12 }}>
          <a
            href="https://github.com/myao41/mahjong-calc"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2e7d32' }}
          >
            GitHub
          </a>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/terms" style={{ color: '#2e7d32' }}>
            利用規約
          </Link>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/privacy" style={{ color: '#2e7d32' }}>
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </div>
  );
}
