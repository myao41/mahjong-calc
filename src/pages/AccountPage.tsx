import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { deleteAllCloudData } from '../utils/cloudSync';
import { showToast } from '../components/Toast';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [withdrawing, setWithdrawing] = useState(false);

  // Redirect if not logged in
  if (!loading && !user) {
    navigate('/settings', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 16 }}>アカウント管理</h2>
        <div style={{ fontSize: 13, color: '#7f8c8d', padding: '8px 0' }}>読み込み中...</div>
      </div>
    );
  }

  const handleWithdraw = async () => {
    const confirmed = window.confirm(
      '本当に退会しますか？\nすべてのデータが削除されます。この操作は取り消せません。'
    );
    if (!confirmed) return;

    setWithdrawing(true);
    try {
      // 1. Delete cloud data
      await deleteAllCloudData();

      // 2. Clear all localStorage
      localStorage.clear();

      // 3. Sign out
      await signOut();

      // 4. Redirect to top
      navigate('/', { replace: true });
      showToast('退会が完了しました', 'info');
    } catch {
      showToast('退会処理に失敗しました。もう一度お試しください。', 'error');
      setWithdrawing(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 16 }}>アカウント管理</h2>

      {/* Account info */}
      <div style={{
        background: '#fff', borderRadius: 8, padding: 16,
        border: '1px solid #e0e0e0', marginBottom: 14,
      }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 }}>
          アカウント情報
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr',
          gap: '8px 12px', fontSize: 14, color: '#2c3e50',
        }}>
          <span style={{ color: '#7f8c8d' }}>ログイン方法</span>
          <span>X</span>

          <span style={{ color: '#7f8c8d' }}>ユーザーID</span>
          <span>@{user!.user_metadata.user_name}</span>
        </div>
      </div>

      {/* Withdraw */}
      <div style={{
        background: '#fff', borderRadius: 8, padding: 16,
        border: '1px solid #e0e0e0',
      }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#c0392b', marginBottom: 10 }}>
          退会
        </div>
        <div style={{ fontSize: 13, color: '#5d4037', lineHeight: 1.7, marginBottom: 14 }}>
          退会すると以下のデータがすべて削除されます。<br />
          この操作は取り消せません。
        </div>
        <ul style={{
          margin: '0 0 14px', paddingLeft: 20,
          fontSize: 13, color: '#5d4037', lineHeight: 2,
        }}>
          <li>学習履歴</li>
          <li>自作問題</li>
          <li>検定記録</li>
          <li>設定</li>
        </ul>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 8, border: 'none',
            fontSize: 15, fontWeight: 'bold',
            background: withdrawing ? '#bdc3c7' : '#c0392b',
            color: '#fff', cursor: withdrawing ? 'default' : 'pointer',
          }}
        >
          {withdrawing ? '処理中...' : '退会する'}
        </button>
      </div>
    </div>
  );
}
