import { useState, useCallback, useEffect } from 'react';
import type { QuizQuestion, Difficulty } from '../types';
import { generateQuiz, generateWeaknessQuiz } from '../utils/quiz';
import { QuizSolver } from '../components/QuizSolver';
import { recordQuizAnswer, getCategoryRanking } from '../utils/learningLog';
import type { CategoryCount } from '../utils/learningLog';

const difficultyOptions: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: '初級', desc: '平和・タンヤオ中心' },
  { value: 'normal', label: '中級', desc: '全役対象・鳴きあり' },
  { value: 'hard', label: '上級', desc: '槓・珍しい役・ドラ' },
];

interface Props {
  weaknessMode?: boolean;
  onExitWeakness?: () => void;
  onStartWeakness?: () => void;
}

export function QuizPage({ weaknessMode, onExitWeakness, onStartWeakness }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [weaknessCategories, setWeaknessCategories] = useState<CategoryCount[]>([]);
  const [hasWeakness, setHasWeakness] = useState(false);

  useEffect(() => {
    if (!weaknessMode) setHasWeakness(getCategoryRanking().length > 0);
  }, [weaknessMode]);

  const newQuestion = useCallback(() => {
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

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
  }, []);

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
            onClick={onExitWeakness}
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
            <button
              key={opt.value}
              onClick={() => handleDifficultyChange(opt.value)}
              style={{
                flex: '0 1 auto',
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
              }}
            >
              <span>{opt.label}</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>{opt.desc}</span>
            </button>
          ))}

          {hasWeakness && onStartWeakness && (
            <button
              onClick={onStartWeakness}
              style={{
                flex: '0 1 auto',
                padding: '8px 14px',
                borderRadius: 6,
                border: '2px solid #e67e22',
                background: '#fff8e1',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#e67e22',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span>苦手克服</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>苦手分野を重点練習</span>
            </button>
          )}
        </div>
      )}

      {question && (
        <QuizSolver
          question={question}
          onNext={newQuestion}
          onSkip={newQuestion}
          onAnswered={handleAnswered}
        />
      )}
    </div>
  );
}
