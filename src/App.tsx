import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { QuizPage } from './pages/QuizPage';
import { CertificationPage } from './pages/CertificationPage';
import { CustomProblemPage } from './pages/CustomProblemPage';
import { LearningLogPage } from './pages/LearningLogPage';
import { ReferencePage } from './pages/ReferencePage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountPage } from './pages/AccountPage';
import { AboutPage } from './pages/AboutPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { useViewport } from './utils/useViewport';

const TABS: { path: string; match: string; label: string }[] = [
  { path: '/quiz/normal', match: '/quiz', label: 'クイズ' },
  { path: '/custom', match: '/custom', label: '自作' },
  { path: '/log', match: '/log', label: '成績' },
  { path: '/reference/fu', match: '/reference', label: 'ルール' },
  { path: '/settings', match: '/settings', label: '設定' },
];

export default function App() {
  const { isMobile } = useViewport();
  const location = useLocation();

  const activeTab = (match: string) => location.pathname.startsWith(match);

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
        <Link to="/" style={{ color: '#2c3e50', textDecoration: 'none' }}>
          麻雀点数計算
        </Link>
      </h1>

      <nav style={{
        display: 'flex', gap: 0,
        marginBottom: isMobile ? 12 : 20,
        borderBottom: '2px solid #4caf50',
      }}>
        {TABS.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              flex: 1,
              padding: isMobile ? '8px 2px' : '10px 4px',
              fontSize: isMobile ? 11 : 13,
              fontWeight: 'bold',
              border: 'none',
              textDecoration: 'none',
              textAlign: 'center',
              background: activeTab(tab.match) ? '#4caf50' : '#fff',
              color: activeTab(tab.match) ? '#fff' : '#2e7d32',
              borderRadius: '6px 6px 0 0',
              borderRight: '1px solid #c5e1a5',
              transition: 'background 0.15s',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/quiz/normal" replace />} />
        <Route path="/quiz/weakness" element={<QuizPage weaknessMode />} />
        <Route path="/quiz/cert" element={<CertificationPage />} />
        <Route path="/quiz/cert/:levelId" element={<CertificationPage />} />
        <Route path="/quiz/:difficulty" element={<QuizPage />} />
        <Route path="/custom" element={<CustomProblemPage />} />
        <Route path="/log" element={<LearningLogPage />} />
        <Route path="/reference" element={<Navigate to="/reference/fu" replace />} />
        <Route path="/reference/:tab" element={<ReferencePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/account" element={<AccountPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
