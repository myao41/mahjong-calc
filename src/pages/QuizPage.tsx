import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { QuizQuestion, Difficulty } from '../types';
import { generateQuiz, generateWeaknessQuiz } from '../utils/quiz';
import { QuizSolver } from '../components/QuizSolver';
import { recordQuizAnswer, getCategoryRanking } from '../utils/learningLog';
import type { CategoryCount } from '../utils/learningLog';
import { loadSettings } from '../utils/settings';

const difficultyOptions: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: '初級', desc: '基本役' },
  { value: 'normal', label: '中級', desc: '全役' },
  { value: 'hard', label: '上級', desc: 'プロ試験対策' },
];

const VALID_DIFFICULTIES = new Set<string>(['easy', 'normal', 'hard']);

function generateHonbaCount(): number {
  const r = Math.random();
  if (r < 0.5) return 1;
  if (r < 0.8) return 2;
  return 3;
}

interface Props {
  weaknessMode?: boolean;
}

export function QuizPage({ weaknessMode }: Props) {
  const { difficulty: diffParam } = useParams<{ difficulty: string }>();
  const navigate = useNavigate();

  const difficulty: Difficulty = VALID_DIFFICULTIES.has(diffParam ?? '')
    ? (diffParam as Difficulty)
    : 'normal';

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [honbaCount, setHonbaCount] = useState(0);
  const [weaknessCategories, setWeaknessCategories] = useState<CategoryCount[]>([]);
  const [hasWeakness, setHasWeakness] = useState(false);

  useEffect(() => {
    if (!weaknessMode) setHasWeakness(getCategoryRanking().length > 0);
  }, [weaknessMode]);

  const newQuestion = useCallback(() => {
    const settings = loadSettings();
    const useHonba = difficulty !== 'hard' && settings.honba;
    setHonbaCount(useHonba ? generateHonbaCount() : 0);

    if (weaknessMode) {
      const cats = getCategoryRanking();
      setWeaknessCategories(cats);
      setQuestion(cats.length > 0 ? generateWeaknessQuiz(cats, difficulty) : generateQuiz(difficulty));
    } else {
      setQuestion(generateQuiz(difficulty));
    }
  }, [difficulty, weaknessMode]);

  useEffect(() => { newQuestion(); }, [newQuestion]);

  const handleAnswered = useCallback((user: import('../utils/learningLog').UserAnswer) => {
    if (question) {
      recordQuizAnswer(question, user, weaknessMode ? 'weakness' : 'quiz', difficulty);
    }
  }, [question, difficulty, weaknessMode]);

  const settings = loadSettings();
  const effectiveAnswerMode = difficulty === 'hard' ? 'simple' as const : settings.answerMode;
  const effectiveTimeLimit = settings.timeLimit;

  const topWeakness = weaknessCategories[0];

  return (
    <div>
      {weaknessMode && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10, padding: '10px 14px',
          background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100' }}>
              苦手克服モード
            </div>
            {topWeakness && (
              <div style={{ fontSize: 12, color: '#8d6e63', marginTop: 2 }}>
                重点: {topWeakness.label}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/quiz/normal')}
            style={{
              padding: '6px 14px', borderRadius: 6,
              border: '1px solid #bdc3c7', background: '#fff',
              cursor: 'pointer', fontSize: 13, color: '#7f8c8d',
            }}
          >
            通常モードに戻る
          </button>
        </div>
      )}

      {!weaknessMode && (
        <div style={{
          display: 'flex', gap: 6, marginBottom: 14,
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          {difficultyOptions.map(opt => (
            <Link
              key={opt.value}
              to={`/quiz/${opt.value}`}
              style={{
                flex: '1 1 0',
                padding: '8px 14px',
                borderRadius: 6,
                border: difficulty === opt.value ? '2px solid #3498db' : '1px solid #bdc3c7',
                background: difficulty === opt.value ? '#eef5ff' : '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: difficulty === opt.value ? 'bold' : 'normal',
                color: difficulty === opt.value ? '#2980b9' : '#7f8c8d',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                textDecoration: 'none',
              }}
            >
              <span>{opt.label}</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>{opt.desc}</span>
            </Link>
          ))}

          {hasWeakness && (
            <Link
              to="/quiz/weakness"
              style={{
                flex: '1 1 0',
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #bdc3c7',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'normal',
                color: '#7f8c8d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              苦手克服
            </Link>
          )}
        </div>
      )}

      {!weaknessMode && (
        <Link
          to="/quiz/cert"
          style={{
            display: 'block',
            width: '100%', padding: '10px 14px',
            borderRadius: 6, border: '1px solid #ffe082',
            background: '#fff8e1', cursor: 'pointer',
            fontSize: 14, fontWeight: 'bold', color: '#e65100',
            marginBottom: 14,
            textDecoration: 'none',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          🏆 検定モード
        </Link>
      )}

      {question && (
        <QuizSolver
          question={question}
          onNext={newQuestion}
          onSkip={newQuestion}
          onAnswered={handleAnswered}
          timeLimit={effectiveTimeLimit}
          answerMode={effectiveAnswerMode}
          honba={honbaCount}
        />
      )}
    </div>
  );
}
