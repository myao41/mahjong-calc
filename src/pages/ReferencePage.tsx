import { useParams, Link } from 'react-router-dom';
import { FuRulePage } from './FuRulePage';
import { ScoreRulePage } from './ScoreRulePage';
import { YakuListPage } from './YakuListPage';

type SubTab = 'fu' | 'score' | 'yaku';

const VALID_TABS = new Set<string>(['fu', 'score', 'yaku']);

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 'bold',
  border: 'none',
  cursor: 'pointer',
  background: active ? '#2e7d32' : '#e8f5e9',
  color: active ? '#fff' : '#2e7d32',
  transition: 'background 0.15s',
  textDecoration: 'none',
  textAlign: 'center',
});

export function ReferencePage() {
  const { tab: tabParam } = useParams<{ tab: string }>();
  const subTab: SubTab = VALID_TABS.has(tabParam ?? '') ? (tabParam as SubTab) : 'fu';

  return (
    <div>
      <div style={{
        display: 'flex', borderRadius: 8, overflow: 'hidden',
        border: '1px solid #c5e1a5', marginBottom: 16,
      }}>
        <Link to="/reference/fu" style={{ ...tabStyle(subTab === 'fu'), borderRadius: '7px 0 0 7px', borderRight: '1px solid #a5d6a7' }}>
          符計算
        </Link>
        <Link to="/reference/score" style={{ ...tabStyle(subTab === 'score'), borderRight: '1px solid #a5d6a7' }}>
          点数表
        </Link>
        <Link to="/reference/yaku" style={{ ...tabStyle(subTab === 'yaku'), borderRadius: '0 7px 7px 0' }}>
          役一覧
        </Link>
      </div>
      {subTab === 'fu' && <FuRulePage />}
      {subTab === 'score' && <ScoreRulePage />}
      {subTab === 'yaku' && <YakuListPage />}
    </div>
  );
}
