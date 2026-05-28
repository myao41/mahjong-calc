import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { QuizQuestion } from '../types';
import { generateCertQuiz } from '../utils/quiz';
import { QuizSolver } from '../components/QuizSolver';
import {
  CERT_CATEGORIES, CERT_LEVELS, type CertLevel,
  saveCertRecord, getBestRecord, hasPassed, isUnlocked,
  getLevelsByCategory,
} from '../utils/certification';
import type { UserAnswer } from '../utils/learningLog';
import { useViewport } from '../utils/useViewport';

type Phase = 'select' | 'confirm' | 'testing' | 'result';

export function CertificationPage() {
  const { levelId } = useParams<{ levelId?: string }>();
  const navigate = useNavigate();
  const { isMobile } = useViewport();
  const [phase, setPhase] = useState<Phase>('select');
  const [level, setLevel] = useState<CertLevel | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const resultsRef = useRef<boolean[]>([]);

  useEffect(() => {
    const lv = levelId ? CERT_LEVELS.find(l => l.id === levelId) ?? null : null;
    if (lv) {
      setLevel(lv);
      setPhase('confirm');
    } else {
      setLevel(null);
      setPhase('select');
    }
    setQuestions([]);
    setQIndex(0);
    setResults([]);
    resultsRef.current = [];
  }, [levelId]);

  const selectLevel = useCallback((lv: CertLevel) => {
    navigate(`/quiz/cert/${lv.id}`);
  }, [navigate]);

  const startTest = useCallback((lv: CertLevel) => {
    setLevel(lv);
    const qs: QuizQuestion[] = [];
    for (let i = 0; i < lv.totalQuestions; i++) {
      qs.push(generateCertQuiz(lv));
    }
    setQuestions(qs);
    setQIndex(0);
    setResults([]);
    resultsRef.current = [];
    setPhase('testing');
  }, []);

  const handleAnswered = useCallback((_user: UserAnswer, isCorrect: boolean) => {
    resultsRef.current = [...resultsRef.current, isCorrect];
    setResults(prev => [...prev, isCorrect]);
  }, []);

  const handleNext = useCallback(() => {
    if (!level) return;
    const next = qIndex + 1;
    if (next >= level.totalQuestions) {
      const correct = resultsRef.current.filter(Boolean).length;
      saveCertRecord({
        levelId: level.id,
        date: new Date().toISOString(),
        correct,
        total: level.totalQuestions,
        passed: correct >= level.passCount,
      });
      setPhase('result');
    } else {
      setQIndex(next);
    }
  }, [level, qIndex]);

  /* ── Level Select ── */
  if (phase === 'select') {
    return (
      <div>
        <div style={{
          textAlign: 'center', padding: '16px 0', marginBottom: 16,
          background: '#fff8e1', borderRadius: 8, border: '1px solid #ffe082',
        }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e65100' }}>
            検定モード
          </div>
          <div style={{ fontSize: 13, color: '#8d6e63', marginTop: 4 }}>
            合格すると次の検定が解放されます
          </div>
        </div>

        {CERT_CATEGORIES.map(cat => {
          const levels = getLevelsByCategory(cat.id);
          if (levels.length === 0) return null;
          return (
            <section key={cat.id} style={{ marginBottom: 16 }}>
              <h3 style={{
                fontSize: 14, color: '#2e7d32', marginBottom: 8,
                padding: '6px 12px', background: '#e8f5e9', borderRadius: 4,
                fontWeight: 'bold',
              }}>
                {cat.label}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {levels.map(lv => {
                  const unlocked = isUnlocked(lv);
                  const passed = hasPassed(lv.id);
                  const best = getBestRecord(lv.id);
                  return (
                    <button
                      key={lv.id}
                      onClick={() => unlocked && selectLevel(lv)}
                      disabled={!unlocked}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: isMobile ? '10px 12px' : '12px 14px',
                        borderRadius: 8,
                        border: passed ? '2px solid #27ae60' : '1px solid #bdc3c7',
                        background: !unlocked ? '#f5f5f5' : passed ? '#f0fff4' : '#fff',
                        cursor: unlocked ? 'pointer' : 'default',
                        opacity: unlocked ? 1 : 0.6,
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {!unlocked && (
                        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                      )}
                      {passed && (
                        <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                      )}
                      {unlocked && !passed && (
                        <span style={{ fontSize: 16, flexShrink: 0, width: 20 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 'bold',
                          color: unlocked ? '#2c3e50' : '#95a5a6',
                        }}>
                          {lv.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 2 }}>
                          {lv.desc}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right', fontSize: 12 }}>
                        {passed && (
                          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>合格</span>
                        )}
                        {!passed && best && (
                          <span style={{ color: '#e74c3c' }}>
                            最高 {best.correct}/{best.total}
                          </span>
                        )}
                        {unlocked && !passed && !best && (
                          <span style={{ color: '#95a5a6' }}>未挑戦</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <button
          onClick={() => navigate('/quiz/normal')}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 8, border: '1px solid #bdc3c7',
            background: '#fff', color: '#7f8c8d',
            cursor: 'pointer', fontSize: 14,
          }}
        >
          クイズに戻る
        </button>
      </div>
    );
  }

  /* ── Confirm ── */
  if (phase === 'confirm' && level) {
    const answerModeLabel =
      level.answerMode === 'yaku-name' ? '役名を選択' :
      level.answerMode === 'fu-only' ? '符を選択' :
      level.answerMode === 'fu-detail' ? '翻・符(詳細)・点数' :
      level.answerMode === 'simple' ? 'アガリ点数のみ' :
      '翻・符・点数';

    return (
      <div>
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #e0e0e0',
          padding: isMobile ? '24px 16px' : '32px 24px',
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, color: '#e65100', fontWeight: 'bold', marginBottom: 4 }}>
              検定
            </div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2c3e50' }}>
              {level.label}
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr',
            gap: '8px 12px', fontSize: 14, color: '#2c3e50',
          }}>
            <span style={{ color: '#7f8c8d' }}>内容</span>
            <span>{level.desc}</span>

            <span style={{ color: '#7f8c8d' }}>問題数</span>
            <span>{level.totalQuestions}問</span>

            <span style={{ color: '#7f8c8d' }}>制限時間</span>
            <span>{level.timeLimit}秒 / 問</span>

            <span style={{ color: '#7f8c8d' }}>回答形式</span>
            <span>{answerModeLabel}</span>

            <span style={{ color: '#7f8c8d' }}>合格基準</span>
            <span>{level.passCount}/{level.totalQuestions}問正解</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => startTest(level)}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 8, border: 'none',
              fontSize: 16, fontWeight: 'bold',
              background: '#3498db', color: '#fff', cursor: 'pointer',
            }}
          >
            開始する
          </button>
          <button
            onClick={() => navigate('/quiz/cert')}
            style={{
              width: '100%', padding: '12px',
              borderRadius: 8, border: '1px solid #bdc3c7',
              background: '#fff', color: '#7f8c8d',
              cursor: 'pointer', fontSize: 14,
            }}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  /* ── Testing ── */
  if (phase === 'testing' && level && questions[qIndex]) {
    const isLast = qIndex + 1 >= level.totalQuestions;
    return (
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 8, padding: '10px 14px',
          background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8,
        }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100' }}>
            検定: {level.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, color: '#8d6e63', fontWeight: 'bold' }}>
              {qIndex + 1}/{level.totalQuestions}
            </div>
            <button
              onClick={() => {
                if (confirm('検定を中止しますか？結果は記録されません。')) {
                  navigate('/quiz/cert');
                }
              }}
              style={{
                padding: '4px 10px', fontSize: 12,
                background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c',
                borderRadius: 4, cursor: 'pointer',
              }}
            >
              やめる
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8,
          marginBottom: 12,
        }}>
          {Array.from({ length: level.totalQuestions }, (_, i) => {
            let bg = '#e0e0e0';
            let label = String(i + 1);
            if (i < results.length) {
              bg = results[i] ? '#27ae60' : '#e74c3c';
              label = results[i] ? '○' : '×';
            } else if (i === qIndex) {
              bg = '#3498db';
            }
            return (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: '50%',
                background: bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 'bold', color: '#fff',
              }}>
                {label}
              </div>
            );
          })}
        </div>

        <QuizSolver
          key={qIndex}
          question={questions[qIndex]}
          onNext={handleNext}
          nextLabel={isLast ? '結果を見る' : `次へ (${qIndex + 2}/${level.totalQuestions})`}
          onAnswered={handleAnswered}
          timeLimit={level.timeLimit}
          answerMode={level.answerMode}
          honba={0}
        />
      </div>
    );
  }

  /* ── Result ── */
  if (phase === 'result' && level) {
    const correct = results.filter(Boolean).length;
    const passed = correct >= level.passCount;
    return (
      <div>
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '20px 14px' : '28px 20px',
          background: passed ? '#f0fff4' : '#fdf2f2',
          border: `2px solid ${passed ? '#27ae60' : '#e74c3c'}`,
          borderRadius: 12, marginBottom: 16,
        }}>
          <div style={{
            fontSize: 30, fontWeight: 'bold',
            color: passed ? '#27ae60' : '#e74c3c',
            marginBottom: 8,
          }}>
            {passed ? '合格！' : '不合格'}
          </div>
          <div style={{
            fontSize: 20, color: '#2c3e50',
            fontWeight: 'bold', marginBottom: 14,
          }}>
            {level.label} — {correct}/{level.totalQuestions} 正解
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {results.map((ok, i) => (
              <div key={i} style={{
                width: 34, height: 34, borderRadius: '50%',
                background: ok ? '#27ae60' : '#e74c3c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 'bold', color: '#fff',
              }}>
                {ok ? '○' : '×'}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => startTest(level)}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 8, border: 'none',
              fontSize: 16, fontWeight: 'bold',
              background: '#3498db', color: '#fff', cursor: 'pointer',
            }}
          >
            再挑戦
          </button>
          <button
            onClick={() => navigate('/quiz/cert')}
            style={{
              width: '100%', padding: '12px',
              borderRadius: 8, border: '1px solid #bdc3c7',
              background: '#fff', color: '#2c3e50',
              cursor: 'pointer', fontSize: 14,
            }}
          >
            レベル選択に戻る
          </button>
          <button
            onClick={() => navigate('/quiz/normal')}
            style={{
              width: '100%', padding: '12px',
              borderRadius: 8, border: '1px solid #bdc3c7',
              background: '#fff', color: '#7f8c8d',
              cursor: 'pointer', fontSize: 14,
            }}
          >
            クイズに戻る
          </button>
        </div>
      </div>
    );
  }

  return null;
}
