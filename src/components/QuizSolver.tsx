import { useState, useCallback, useEffect } from 'react';
import type { QuizQuestion, ScoreResult } from '../types';
import { windName } from '../utils/tiles';
import { TileButton } from './TileButton';
import { DetailScoreTable } from './DetailScoreTable';
import { generateHint } from '../utils/hint';
import type { UserAnswer } from '../utils/learningLog';
import { useViewport } from '../utils/useViewport';
import type { Tile } from '../types';

/** 鳴いた牌の最左を90度横向きに表示するヘルパー */
function RotatedTile({ tile, isMobile }: { tile: Tile; isMobile: boolean }) {
  const tileW = isMobile ? 22 : 34;
  const tileH = isMobile ? 33 : 51;
  // 回転後の見た目: 横向きなので幅=tileH, 高さ=tileW
  return (
    <div style={{
      width: tileH,
      height: tileW,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ transform: 'rotate(-90deg)' }}>
        <TileButton tile={tile} size="normal" />
      </div>
    </div>
  );
}

type Phase = 'answering' | 'correct' | 'wrong';

interface Props {
  question: QuizQuestion;
  onNext: () => void;
  nextLabel?: string;
  title?: string;
  onAnswered?: (user: UserAnswer, isCorrect: boolean) => void;
  onSkip?: () => void;
}

function Stepper({ value, onChange, min = 0, max = 99, step = 1 }: {
  value: string; onChange: (v: string) => void; min?: number; max?: number; step?: number;
}) {
  const n = Number(value) || 0;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'stretch', height: 40 }}>
      <button
        type="button"
        onClick={() => onChange(String(Math.max(min, n - step)))}
        style={stepperBtnStyle}
      >−</button>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: 64, textAlign: 'center', fontSize: 16, fontWeight: 'bold',
          border: '1px solid #bdc3c7', borderLeft: 'none', borderRight: 'none',
          outline: 'none', background: '#fff',
        }}
      />
      <button
        type="button"
        onClick={() => onChange(String(Math.min(max, n + step)))}
        style={{ ...stepperBtnStyle, borderRadius: '0 4px 4px 0' }}
      >+</button>
    </div>
  );
}

const stepperBtnStyle: React.CSSProperties = {
  width: 38, border: '1px solid #bdc3c7', borderRadius: '4px 0 0 4px',
  background: '#f0f0f0', fontSize: 22, cursor: 'pointer', fontWeight: 'bold',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#2c3e50', userSelect: 'none',
};

const inputStyle: React.CSSProperties = {
  width: 90, padding: '8px 10px', borderRadius: 4,
  border: '1px solid #bdc3c7', fontSize: 16, textAlign: 'center',
};

export function QuizSolver({ question, onNext, nextLabel = '次の問題', title, onAnswered, onSkip }: Props) {
  const { isMobile } = useViewport();
  const [phase, setPhase] = useState<Phase>('answering');
  const [inputHan, setInputHan] = useState('1');
  const [inputFu, setInputFu] = useState('20');
  const [inputScore1, setInputScore1] = useState('');
  const [inputScore2, setInputScore2] = useState('');

  // Reset when question changes
  useEffect(() => {
    setPhase('answering');
    setInputHan('1');
    setInputFu('20');
    setInputScore1('');
    setInputScore2('');
  }, [question]);

  const { condition, answer } = question;
  const isDealer = condition.seatWind === 1;
  const isTsumo = condition.agariType === 'tsumo';

  const handleSubmit = useCallback(() => {
    const a = answer;
    const user: UserAnswer = {
      han: Number(inputHan),
      fu: Number(inputFu),
      score1: Number(inputScore1),
      score2: Number(inputScore2),
    };
    const hanOk = user.han === a.han;
    const fuOk = user.fu === a.rawFu;

    let scoreOk = false;
    if (a.agariType === 'ron') {
      scoreOk = user.score1 === a.ronPayment;
    } else if (a.isDealer) {
      scoreOk = user.score1 === a.tsumoAllPayment;
    } else {
      scoreOk = user.score1 === a.tsumoChildPayment &&
                user.score2 === a.tsumoDealerPayment;
    }

    const allCorrect = hanOk && fuOk && scoreOk;
    setPhase(allCorrect ? 'correct' : 'wrong');
    onAnswered?.(user, allCorrect);
  }, [answer, inputHan, inputFu, inputScore1, inputScore2, onAnswered]);

  return (
    <div>
      {title && (
        <div style={{
          fontSize: 14, fontWeight: 'bold', color: '#2c3e50',
          padding: '8px 12px', background: '#eef5ff', borderRadius: 4,
          marginBottom: 12,
        }}>
          📝 {title}
        </div>
      )}

      {/* Conditions above hand */}
      <div style={{
        display: 'flex',
        gap: isMobile ? 8 : 14,
        marginBottom: 10,
        fontSize: isMobile ? 13 : 15,
        color: '#2c3e50',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span>場風: <b>{windName(condition.roundWind)}</b></span>
        <span>自風: <b>{windName(condition.seatWind)}</b></span>
        <span style={{
          background: isDealer ? '#e74c3c' : '#16a085',
          color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>{isDealer ? '親' : '子'}</span>
        {condition.isRiichi && <span style={{
          background: '#3498db', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>立直</span>}
        {!condition.isRiichi && question.openMelds.length === 0 && <span style={{
          background: '#95a5a6', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>ヤミテン</span>}
        {question.openMelds.length > 0 && <span style={{
          background: '#e67e22', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>鳴きあり</span>}
      </div>

      {/* Hand display */}
      <div style={{
        background: '#fff', borderRadius: 8,
        padding: isMobile ? '10px 6px' : '16px 16px',
        marginBottom: 14,
        border: '1px solid #e0e0e0',
      }}>
        <div style={{ fontSize: isMobile ? 13 : 15, color: '#7f8c8d', marginBottom: 6 }}>手牌</div>
        <div style={{
          display: 'flex', flexWrap: 'nowrap',
          gap: isMobile ? 2 : 4,
          alignItems: 'flex-end', justifyContent: 'center',
        }}>
          {question.closedTiles.map((tile, i) => {
            const isLastMatch = (() => {
              let lastIdx = -1;
              for (let j = 0; j < question.closedTiles.length; j++) {
                if (question.closedTiles[j].suit === condition.agariTile.suit &&
                    question.closedTiles[j].num === condition.agariTile.num) {
                  lastIdx = j;
                }
              }
              return i === lastIdx;
            })();

            return (
              <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                <TileButton tile={tile} />
                {isLastMatch && (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: -8, right: -3, bottom: -2, left: -3,
                      border: '2px solid #e67e22',
                      borderRadius: 6,
                      pointerEvents: 'none',
                      boxShadow: '0 0 4px rgba(230,126,34,0.5)',
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 3px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#e67e22', color: '#fff',
                      fontSize: 11, borderRadius: 4, padding: '2px 6px',
                      fontWeight: 'bold', lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                    }}>
                      {isTsumo ? 'ツモ' : 'ロン'}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {question.openMelds.length > 0 && (
            <div style={{ width: isMobile ? 6 : 10, flexShrink: 0 }} />
          )}

          {question.openMelds.map((meld, mi) => (
            <div key={`meld-${mi}`} style={{
              display: 'flex', gap: 1,
              alignItems: 'flex-end',
              padding: isMobile ? '3px 4px' : '5px 6px',
              border: '1px dashed #bdc3c7',
              borderRadius: 8,
              marginLeft: mi > 0 ? 4 : 0,
              marginBottom: isMobile ? -4 : -6,
            }}>
              {meld.tiles.map((tile, ti) => (
                ti === 0
                  ? <RotatedTile key={ti} tile={tile} isMobile={isMobile} />
                  : <TileButton key={ti} tile={tile} size="normal" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Answer input */}
      {phase === 'answering' && (
        <div style={{
          background: '#fff', borderRadius: 8,
          padding: isMobile ? 12 : 16,
          marginBottom: 14,
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
              <span style={{ flex: '0 0 auto' }}>翻数:</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <Stepper value={inputHan} onChange={setInputHan} min={1} max={13} />
                <span style={{ color: '#7f8c8d', minWidth: 20 }}>翻</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
              <span style={{ flex: '0 0 auto' }}>符（繰り上がり前）:</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <Stepper value={inputFu} onChange={setInputFu} min={20} max={130} step={2} />
                <span style={{ color: '#7f8c8d', minWidth: 20 }}>符</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
              <span style={{ flex: '0 0 auto' }}>
                点数{isTsumo ? '(ツモ)' : '(ロン)'}:
              </span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                {isTsumo && !isDealer ? (
                  <>
                    <input
                      type="number"
                      value={inputScore1}
                      onChange={e => setInputScore1(e.target.value)}
                      style={inputStyle}
                      placeholder="子払い"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      value={inputScore2}
                      onChange={e => setInputScore2(e.target.value)}
                      style={inputStyle}
                      placeholder="親払い"
                    />
                    <span style={{ color: '#7f8c8d', minWidth: 20 }}>点</span>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      value={inputScore1}
                      onChange={e => setInputScore1(e.target.value)}
                      style={inputStyle}
                      placeholder={isTsumo ? 'オール' : '点数'}
                    />
                    <span style={{ color: '#7f8c8d', minWidth: 20 }}>点</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button
              onClick={handleSubmit}
              disabled={!inputHan || !inputFu || !inputScore1 || (isTsumo && !isDealer && !inputScore2)}
              style={{
                flex: 1, padding: '14px',
                borderRadius: 8, border: 'none', fontSize: 18, fontWeight: 'bold',
                background: '#3498db', color: '#fff', cursor: 'pointer',
              }}
            >
              回答する
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                style={{
                  flex: '0 0 auto', padding: '14px 18px',
                  borderRadius: 8, border: '1px solid #bdc3c7', fontSize: 15, fontWeight: 'bold',
                  background: '#fff', color: '#7f8c8d', cursor: 'pointer',
                }}
              >
                スキップ
              </button>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {phase !== 'answering' && (
        <div style={{
          borderRadius: 8,
          padding: isMobile ? 14 : 20,
          marginBottom: 14,
          background: phase === 'correct' ? '#f0fff4' : '#fdf2f2',
          border: `1px solid ${phase === 'correct' ? '#27ae60' : '#e74c3c'}`,
        }}>
          <div style={{
            fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 12,
            color: phase === 'correct' ? '#27ae60' : '#e74c3c',
          }}>
            {phase === 'correct' ? '正解!' : '不正解'}
          </div>

          <div style={{
            textAlign: 'center', fontSize: 22, fontWeight: 'bold',
            color: '#2c3e50', marginBottom: 4,
          }}>
            {answer.scoreString}
          </div>
          <div style={{
            textAlign: 'center', fontSize: 20, color: '#e67e22',
            fontWeight: 'bold', marginBottom: 12,
          }}>
            {answer.payments}
          </div>
          <div style={{ textAlign: 'center', fontSize: 15, color: '#7f8c8d', marginBottom: 16 }}>
            {answer.han}翻 / {answer.fu}符（繰り上がり前: {answer.rawFu}）/
            {answer.isDealer ? ' 親' : ' 子'} / {answer.agariType === 'tsumo' ? 'ツモ' : 'ロン'}
          </div>

          {phase === 'wrong' && (
            <>
              {/* Hint */}
              {(() => {
                const hint = generateHint(question, {
                  han: inputHan, fu: inputFu,
                  score1: inputScore1, score2: inputScore2,
                });
                if (!hint) return null;
                return (
                  <div style={{
                    background: '#fff8e1', borderRadius: 6, padding: '10px 12px',
                    marginBottom: 14, border: '1px solid #ffe082',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>💡</span>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: '#5d4037', flex: 1 }}>
                      {hint}
                    </div>
                  </div>
                );
              })()}

              {/* Your answers vs correct */}
              <div style={{
                background: '#fff', borderRadius: 6, padding: 12, marginBottom: 14,
                border: '1px solid #eee',
              }}>
                <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>あなたの回答</div>
                <table style={{ width: '100%', fontSize: 15, borderCollapse: 'collapse' }}>
                  <tbody>
                    <AnswerRow label="翻数" yours={inputHan + '翻'} correct={answer.han + '翻'} ok={Number(inputHan) === answer.han} />
                    <AnswerRow label="符" yours={inputFu + '符'} correct={answer.rawFu + '符'} ok={Number(inputFu) === answer.rawFu} />
                    <AnswerRow
                      label="点数"
                      yours={formatUserScore(inputScore1, inputScore2, isTsumo, isDealer)}
                      correct={answer.payments}
                      ok={scoreIsCorrect(answer, inputScore1, inputScore2)}
                    />
                  </tbody>
                </table>
              </div>

              {/* Yaku list */}
              <div style={{
                background: '#fff', borderRadius: 6, padding: 12, marginBottom: 14,
                border: '1px solid #eee',
              }}>
                <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>役一覧</div>
                {answer.yaku.map((y, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '3px 0', fontSize: 15,
                  }}>
                    <span>{y.name}</span>
                    <span style={{ color: '#7f8c8d' }}>{y.han}翻</span>
                  </div>
                ))}
                <div style={{
                  borderTop: '1px solid #eee', marginTop: 6, paddingTop: 6,
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 16, fontWeight: 'bold',
                }}>
                  <span>合計</span>
                  <span>{answer.han}翻</span>
                </div>
              </div>

              {/* Fu breakdown */}
              <div style={{
                background: '#fff', borderRadius: 6, padding: 12, marginBottom: 14,
                border: '1px solid #eee',
              }}>
                <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 8 }}>符計算</div>
                {answer.fuCalc.details.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '3px 0', fontSize: 15,
                  }}>
                    <span>{d.name}</span>
                    <span style={{ color: '#7f8c8d' }}>{d.fu}符</span>
                  </div>
                ))}
                <div style={{
                  borderTop: '1px solid #eee', marginTop: 6, paddingTop: 6,
                  fontSize: 15,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>合計（繰り上がり前）</span>
                    <span style={{ fontWeight: 'bold' }}>{answer.rawFu}符</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d' }}>
                    <span>繰り上がり後</span>
                    <span>{answer.fu}符</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Detail score table - shown on both correct and wrong */}
          <div style={{
            background: '#fff', borderRadius: 6, padding: 12,
            border: '1px solid #eee',
          }}>
            <DetailScoreTable
              highlightFu={answer.fu}
              highlightHan={answer.han}
              highlightYakuman={answer.yaku.some(y => y.isYakuman)}
              defaultMode={isDealer ? 'dealer' : 'child'}
              defaultAgari={isTsumo ? 'tsumo' : 'ron'}
            />
          </div>

          <button
            onClick={onNext}
            style={{
              width: '100%', marginTop: 18, padding: '14px',
              borderRadius: 8, border: 'none', fontSize: 18, fontWeight: 'bold',
              background: '#27ae60', color: '#fff', cursor: 'pointer',
            }}
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function AnswerRow({ label, yours, correct, ok }: {
  label: string; yours: string; correct: string; ok: boolean;
}) {
  return (
    <tr>
      <td style={{ padding: '3px 0', color: '#7f8c8d' }}>{label}</td>
      <td style={{
        padding: '3px 8px',
        color: ok ? '#27ae60' : '#e74c3c',
        fontWeight: 'bold',
      }}>
        {yours} {ok ? '○' : '×'}
      </td>
      <td style={{ padding: '3px 0', color: '#2c3e50' }}>
        {!ok && `→ ${correct}`}
      </td>
    </tr>
  );
}

function formatUserScore(s1: string, s2: string, isTsumo: boolean, isDealer: boolean): string {
  if (!isTsumo) return `${s1}点`;
  if (isDealer) return `${s1}点 オール`;
  return `${s1}/${s2}点`;
}

function scoreIsCorrect(answer: ScoreResult, s1: string, s2: string): boolean {
  if (answer.agariType === 'ron') return Number(s1) === answer.ronPayment;
  if (answer.isDealer) return Number(s1) === answer.tsumoAllPayment;
  return Number(s1) === answer.tsumoChildPayment && Number(s2) === answer.tsumoDealerPayment;
}
