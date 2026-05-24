import { useState, useCallback, useEffect } from 'react';
import type { QuizQuestion, Difficulty } from '../types';
import { generateQuiz } from '../utils/quiz';
import { QuizSolver } from '../components/QuizSolver';
import { recordQuizAnswer } from '../utils/learningLog';

const difficultyOptions: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: '初級', desc: '平和・タンヤオ中心' },
  { value: 'normal', label: '中級', desc: '全役対象・鳴きあり' },
  { value: 'hard', label: '上級', desc: '槓・珍しい役・ドラ' },
];

export function QuizPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);

  const newQuestion = useCallback(() => {
    setQuestion(generateQuiz(difficulty));
  }, [difficulty]);

  useEffect(() => { newQuestion(); }, [newQuestion]);

  const handleAnswered = useCallback((user: import('../utils/learningLog').UserAnswer) => {
    if (question) {
      recordQuizAnswer(question, user, 'quiz');
    }
  }, [question]);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
  }, []);

  return (
    <div>
      <div style={{
        display: 'flex', gap: 6, marginBottom: 14,
        justifyContent: 'center',
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
      </div>

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
