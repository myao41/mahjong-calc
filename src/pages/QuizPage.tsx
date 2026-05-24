import { useState, useCallback, useEffect } from 'react';
import type { QuizQuestion } from '../types';
import { generateQuiz } from '../utils/quiz';
import { QuizSolver } from '../components/QuizSolver';
import { recordQuizAnswer } from '../utils/learningLog';

export function QuizPage() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);

  const newQuestion = useCallback(() => {
    setQuestion(generateQuiz());
  }, []);

  useEffect(() => { newQuestion(); }, [newQuestion]);

  const handleAnswered = useCallback((user: import('../utils/learningLog').UserAnswer) => {
    if (question) {
      recordQuizAnswer(question, user, 'quiz');
    }
  }, [question]);

  if (!question) return null;

  return (
    <QuizSolver
      question={question}
      onNext={newQuestion}
      onSkip={newQuestion}
      onAnswered={handleAnswered}
    />
  );
}
