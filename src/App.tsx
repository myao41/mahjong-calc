import { useState } from 'react';
import { QuizPage } from './pages/QuizPage';
import { FuRulePage } from './pages/FuRulePage';
import { ScoreRulePage } from './pages/ScoreRulePage';
import { CustomProblemPage } from './pages/CustomProblemPage';
import { LearningLogPage } from './pages/LearningLogPage';
import { useViewport } from './utils/useViewport';

type Page = 'quiz' | 'custom' | 'log' | 'fu' | 'score';

const TABS: { key: Page; label: string }[] = [
  { key: 'quiz', label: 'クイズ' },
  { key: 'custom', label: '自作' },
  { key: 'log', label: '成績' },
  { key: 'fu', label: '符計算' },
  { key: 'score', label: '点数' },
];

export default function App() {
  const [page, setPage] = useState<Page>('quiz');
  const { isMobile } = useViewport();

  return (
    <div style={{
      maxWidth: 640, margin: '0 auto',
      padding: isMobile ? '12px 4px' : '20px 16px',
      fontFamily: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
    }}>
      <h1 style={{
        fontSize: isMobile ? 17 : 21,
        textAlign: 'center',
        marginBottom: isMobile ? 10 : 16,
        marginTop: 0,
        color: '#2c3e50',
      }}>
        麻雀点数計算
      </h1>

      <nav style={{
        display: 'flex', gap: 0,
        marginBottom: isMobile ? 12 : 20,
        borderBottom: '2px solid #4caf50',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPage(tab.key)}
            style={{
              flex: 1,
              padding: isMobile ? '8px 2px' : '10px 4px',
              fontSize: isMobile ? 11 : 13,
              fontWeight: 'bold',
              border: 'none', cursor: 'pointer',
              background: page === tab.key ? '#4caf50' : '#fff',
              color: page === tab.key ? '#fff' : '#2e7d32',
              borderRadius: '6px 6px 0 0',
              borderRight: '1px solid #c5e1a5',
              transition: 'background 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {page === 'quiz' && <QuizPage />}
      {page === 'custom' && <CustomProblemPage />}
      {page === 'log' && <LearningLogPage />}
      {page === 'fu' && <FuRulePage />}
      {page === 'score' && <ScoreRulePage />}
    </div>
  );
}
