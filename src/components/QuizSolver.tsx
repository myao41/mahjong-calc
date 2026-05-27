import { useState, useCallback, useEffect, useRef } from 'react';
import type { QuizQuestion, ScoreResult } from '../types';
import { windName } from '../utils/tiles';
import { TileButton } from './TileButton';
import { DetailScoreTable } from './DetailScoreTable';
import { generateHint } from '../utils/hint';
import type { UserAnswer } from '../utils/learningLog';
import { useViewport } from '../utils/useViewport';
import type { Tile } from '../types';

/** 鳴いた牌の最左を90度横向きに表示するヘルパー */
function RotatedTile({ tile, isMobile, widthPx }: { tile: Tile; isMobile: boolean; widthPx?: number }) {
  // スプライト (56:75 比率) に合わせる
  const tileW = widthPx ?? (isMobile ? 24 : 38);
  const tileH = Math.round(tileW * 75 / 56);
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
        <TileButton tile={tile} size="normal" widthPx={widthPx} />
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
  timeLimit?: number;
  answerMode?: 'simple' | 'normal';
  honba?: number;
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

function ScoreStepper({ value, onChange }: {
  value: string; onChange: (v: string) => void;
}) {
  const n = Number(value) || 0;
  const set = (v: number) => onChange(String(Math.max(0, v)));
  return (
    <div style={{ display: 'inline-flex', alignItems: 'stretch', height: 40 }}>
      <button
        type="button"
        onClick={() => set(n - 1000)}
        style={{ ...scoreStepBtnStyle, width: 38, borderRadius: '4px 0 0 4px' }}
      ><span style={{ fontSize: 9 }}>−1000</span></button>
      <button
        type="button"
        onClick={() => set(n - 100)}
        style={{ ...scoreStepBtnStyle, width: 38, borderLeft: 'none', borderRadius: 0 }}
      ><span style={{ fontSize: 10 }}>−100</span></button>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: 64, textAlign: 'center', fontSize: 16, fontWeight: 'bold',
          border: '1px solid #bdc3c7', borderLeft: 'none', borderRight: 'none',
          outline: 'none', background: '#fff',
          WebkitAppearance: 'none', MozAppearance: 'textfield',
        }}
      />
      <button
        type="button"
        onClick={() => set(n + 100)}
        style={{ ...scoreStepBtnStyle, width: 38, borderLeft: 'none', borderRadius: 0 }}
      ><span style={{ fontSize: 10 }}>+100</span></button>
      <button
        type="button"
        onClick={() => set(n + 1000)}
        style={{ ...scoreStepBtnStyle, width: 38, borderLeft: 'none', borderRadius: '0 4px 4px 0' }}
      ><span style={{ fontSize: 9 }}>+1000</span></button>
    </div>
  );
}

const scoreStepBtnStyle: React.CSSProperties = {
  border: '1px solid #bdc3c7',
  background: '#f0f0f0', cursor: 'pointer', fontWeight: 'bold',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#2c3e50', userSelect: 'none', padding: 0,
};

export function QuizSolver({ question, onNext, nextLabel = '次の問題', title, onAnswered, onSkip, timeLimit = 0, answerMode = 'normal', honba = 0 }: Props) {
  const { isMobile } = useViewport();
  const [phase, setPhase] = useState<Phase>('answering');
  const [inputHan, setInputHan] = useState('0');
  const [inputFu, setInputFu] = useState('20');
  const [inputScore1, setInputScore1] = useState('0');
  const [inputScore2, setInputScore2] = useState('0');
  const [showTenpaneHelp, setShowTenpaneHelp] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const handleSubmitRef = useRef<() => void>(() => {});
  const handRef = useRef<HTMLDivElement>(null);
  const [handWidth, setHandWidth] = useState<number | undefined>(undefined);

  // Reset when question changes
  useEffect(() => {
    setPhase('answering');
    setInputHan('0');
    setInputFu('20');
    setInputScore1('0');
    setInputScore2('0');
    setShowTenpaneHelp(false);
    setTimedOut(false);
    setRemainingTime(timeLimit);
  }, [question, timeLimit]);

  // Measure hand container width for responsive tile sizing
  useEffect(() => {
    function measure() {
      if (handRef.current) {
        const style = getComputedStyle(handRef.current);
        const pl = parseFloat(style.paddingLeft) || 0;
        const pr = parseFloat(style.paddingRight) || 0;
        setHandWidth(handRef.current.clientWidth - pl - pr);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const { condition, answer } = question;
  const isDealer = condition.seatWind === 1;
  const isTsumo = condition.agariType === 'tsumo';
  const isSimple = answerMode === 'simple';

  // Honba-adjusted expected scores
  const expectedRon = (answer.ronPayment ?? 0) + honba * 300;
  const expectedTsumoAll = (answer.tsumoAllPayment ?? 0) + honba * 100;
  const expectedTsumoChild = (answer.tsumoChildPayment ?? 0) + honba * 100;
  const expectedTsumoDealer = (answer.tsumoDealerPayment ?? 0) + honba * 100;

  const honbaPayments = (() => {
    if (honba === 0) return answer.payments;
    if (answer.agariType === 'ron') return `${expectedRon}点`;
    if (answer.isDealer) return `${expectedTsumoAll}点 オール`;
    return `${expectedTsumoChild}/${expectedTsumoDealer}点`;
  })();

  const handleSubmit = useCallback(() => {
    if (phase !== 'answering') return;
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
      scoreOk = user.score1 === expectedRon;
    } else if (a.isDealer) {
      scoreOk = user.score1 === expectedTsumoAll;
    } else {
      scoreOk = user.score1 === expectedTsumoChild &&
                user.score2 === expectedTsumoDealer;
    }

    const allCorrect = isSimple ? scoreOk : (hanOk && fuOk && scoreOk);
    setPhase(allCorrect ? 'correct' : 'wrong');
    onAnswered?.(user, allCorrect);
  }, [phase, answer, inputHan, inputFu, inputScore1, inputScore2, onAnswered, isSimple, expectedRon, expectedTsumoAll, expectedTsumoChild, expectedTsumoDealer]);

  // Keep ref updated for timer callback
  handleSubmitRef.current = handleSubmit;

  // Countdown timer
  useEffect(() => {
    if (phase !== 'answering' || !timeLimit || timeLimit <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimedOut(true);
          setTimeout(() => handleSubmitRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, timeLimit, question]);

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
        {condition.isIppatsu && <span style={{
          background: '#8e44ad', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>一発</span>}
        {!condition.isRiichi && !question.openMelds.some(m => m.isOpen) && <span style={{
          background: '#95a5a6', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>ヤミテン</span>}
        {question.openMelds.some(m => m.isOpen) && <span style={{
          background: '#e67e22', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>鳴きあり</span>}
        {condition.isRinshan && <span style={{
          background: '#1abc9c', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>嶺上</span>}
        {condition.isHaitei && <span style={{
          background: '#2c3e50', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>海底</span>}
        {condition.isHoutei && <span style={{
          background: '#2c3e50', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>河底</span>}
        {condition.doraCount > 0 && <span style={{
          background: '#c0392b', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>ドラ{condition.doraCount}</span>}
        {condition.uraDoraCount > 0 && <span style={{
          background: '#d35400', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>裏{condition.uraDoraCount}</span>}
        {honba > 0 && <span style={{
          background: '#6c5ce7', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>{honba}本場</span>}
      </div>

      {/* Hand display */}
      <div ref={handRef} style={{
        background: '#fff', borderRadius: 8,
        padding: isMobile ? '10px 12px' : '16px 16px',
        marginBottom: 14,
        border: '1px solid #e0e0e0',
      }}>
        {(() => {
          let agariIdx = -1;
          for (let j = 0; j < question.closedTiles.length; j++) {
            if (question.closedTiles[j].suit === condition.agariTile.suit &&
                question.closedTiles[j].num === condition.agariTile.num) {
              agariIdx = j;
            }
          }
          const mainHand = question.closedTiles.filter((_, i) => i !== agariIdx);
          const agariTile = agariIdx >= 0 ? question.closedTiles[agariIdx] : null;
          const hasMelds = question.openMelds.length > 0;
          const meldTileCount = question.openMelds.reduce((s, m) => s + m.tiles.length, 0);
          const splitRow = meldTileCount >= 7;

          // Count how many tiles appear on top row to compute tile width
          const topRowTileCount = mainHand.length
            + (agariTile ? 1 : 0)
            + (hasMelds && !splitRow ? meldTileCount : 0);
          // Spacers: between main/melds, between melds/agari or main/agari
          const spacerCount = (hasMelds && !splitRow ? 1 : 0) + (agariTile ? 1 : 0);
          const spacerW = isMobile ? 8 : 12;
          // Meld gaps (4px between each meld group)
          const meldGapCount = hasMelds && !splitRow ? Math.max(0, question.openMelds.length - 1) : 0;

          const defaultTileW = isMobile ? 24 : 38;
          const containerW = handWidth ?? 999;
          const availableW = containerW - spacerCount * spacerW - meldGapCount * 4;
          const fittedTileW = Math.floor(availableW / Math.max(topRowTileCount, 1));
          const tw = Math.max(16, Math.min(defaultTileW, fittedTileW));

          // Also compute for split row (melds on separate line)
          let twMeld = tw;
          if (hasMelds && splitRow) {
            const meldGaps = Math.max(0, question.openMelds.length - 1) * 4;
            const labelW = isMobile ? 18 : 24; // "副露" label + margin
            const meldAvailable = containerW - meldGaps - labelW;
            const fittedMeld = Math.floor(meldAvailable / Math.max(meldTileCount, 1));
            twMeld = Math.max(16, Math.min(defaultTileW, fittedMeld));
          }

          const meldsEl = hasMelds && (
            <div style={{
              display: 'flex', flexWrap: 'nowrap',
              alignItems: 'flex-end',
              justifyContent: splitRow ? 'center' : undefined,
            }}>
              {question.openMelds.map((meld, mi) => {
                const isAnkan = meld.type === 'kantsu' && !meld.isOpen;
                const meldTw = splitRow ? twMeld : tw;
                return (
                  <div key={`meld-${mi}`} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginLeft: mi > 0 ? 4 : 0,
                    flexShrink: 0,
                  }}>
                    {isAnkan && (
                      <div style={{
                        fontSize: isMobile ? 9 : 10,
                        color: '#7f8c8d', fontWeight: 'bold',
                        lineHeight: 1, marginBottom: 2,
                      }}>暗槓</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      {meld.tiles.map((tile, ti) => (
                        !isAnkan && ti === 0
                          ? <RotatedTile key={ti} tile={tile} isMobile={isMobile} widthPx={meldTw} />
                          : <TileButton key={ti} tile={tile} size="normal" widthPx={meldTw} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: splitRow ? 8 : 0 }}>
              <div style={{
                display: 'flex', flexWrap: 'nowrap',
                alignItems: 'flex-end', justifyContent: 'center',
              }}>
                {mainHand.map((tile, i) => (
                  <div key={i} style={{ flexShrink: 0 }}>
                    <TileButton tile={tile} widthPx={tw} />
                  </div>
                ))}

                {hasMelds && !splitRow && (
                  <>
                    <div style={{ width: spacerW, flexShrink: 0 }} />
                    {meldsEl}
                  </>
                )}

                {agariTile && (
                  <>
                    <div style={{ width: spacerW, flexShrink: 0 }} />
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', flexShrink: 0,
                    }}>
                      <div style={{
                        fontSize: isMobile ? 11 : 12,
                        color: '#fff', fontWeight: 'bold',
                        background: isTsumo ? '#16a085' : '#e74c3c',
                        padding: '1px 6px',
                        borderRadius: 3,
                        lineHeight: 1.3, marginBottom: 6,
                      }}>
                        {isTsumo ? 'ツモ' : 'ロン'}
                      </div>
                      <TileButton tile={agariTile} widthPx={tw} />
                    </div>
                  </>
                )}
              </div>

              {hasMelds && splitRow && (
                <div style={{
                  borderTop: '1px dashed #e0e0e0',
                  paddingTop: 6,
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    fontSize: isMobile ? 10 : 12,
                    color: '#7f8c8d', marginRight: 8,
                    alignSelf: 'center', fontWeight: 'bold',
                  }}>副露</div>
                  {meldsEl}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Timer bar */}
      {phase === 'answering' && timeLimit > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 4,
          }}>
            <span style={{
              fontSize: 14, fontWeight: 'bold',
              color: remainingTime <= timeLimit * 0.25 ? '#e74c3c'
                   : remainingTime <= timeLimit * 0.5 ? '#f39c12'
                   : '#27ae60',
            }}>
              残り {remainingTime}秒
            </span>
          </div>
          <div style={{
            width: '100%', height: 6, background: '#e0e0e0',
            borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              width: `${(remainingTime / timeLimit) * 100}%`,
              height: '100%',
              background: remainingTime <= timeLimit * 0.25 ? '#e74c3c'
                        : remainingTime <= timeLimit * 0.5 ? '#f39c12'
                        : '#27ae60',
              borderRadius: 3,
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Answer input */}
      {phase === 'answering' && (
        <div style={{
          background: '#fff', borderRadius: 8,
          padding: isMobile ? 12 : 16,
          marginBottom: 14,
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!isSimple && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
                  <span style={{ flex: '0 0 auto' }}>翻数:</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <Stepper value={inputHan} onChange={setInputHan} min={0} max={13} />
                    <span style={{ color: '#7f8c8d', minWidth: 20 }}>翻</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
                    <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                      符(テンパネ前):
                      <span
                        onClick={() => setShowTenpaneHelp(v => !v)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 18, height: 18, borderRadius: '50%',
                          background: showTenpaneHelp ? '#3498db' : '#bdc3c7',
                          color: '#fff', fontSize: 11, cursor: 'pointer', lineHeight: 1,
                        }}
                      >?</span>
                    </span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <Stepper value={inputFu} onChange={setInputFu} min={20} max={130} step={2} />
                      <span style={{ color: '#7f8c8d', minWidth: 20 }}>符</span>
                    </div>
                  </div>
                  {showTenpaneHelp && (
                    <div style={{
                      fontSize: 12, color: '#5d4037', background: '#f5f5f5',
                      padding: '6px 10px', borderRadius: 4, marginTop: 10, lineHeight: 1.6,
                      marginRight: 28,
                    }}>
                      テンパネ＝符を10の位に切り上げること（例: 32符→40符）
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: isTsumo && !isDealer ? 'flex-start' : 'center', fontSize: 16 }}>
              <span style={{ flex: '0 0 auto', ...(isTsumo && !isDealer ? { lineHeight: '40px' } : {}) }}>点数:</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isTsumo && !isDealer ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <span>子:</span>
                      <ScoreStepper value={inputScore1} onChange={setInputScore1} />
                      <span style={{ color: '#7f8c8d', minWidth: 20 }}>点</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <span>親:</span>
                      <ScoreStepper value={inputScore2} onChange={setInputScore2} />
                      <span style={{ color: '#7f8c8d', minWidth: 20 }}>点</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    {isTsumo && isDealer && <span>各家:</span>}
                    <ScoreStepper value={inputScore1} onChange={setInputScore1} />
                    <span style={{ color: '#7f8c8d', minWidth: 20 }}>点</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button
              onClick={handleSubmit}
              disabled={isSimple
                ? (!Number(inputScore1) || (isTsumo && !isDealer && !Number(inputScore2)))
                : (!Number(inputHan) || !Number(inputFu) || !Number(inputScore1) || (isTsumo && !isDealer && !Number(inputScore2)))}
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
          {timedOut && (
            <div style={{
              textAlign: 'center', fontSize: 14, color: '#e67e22',
              fontWeight: 'bold', marginBottom: 4,
            }}>
              ⏰ 時間切れ
            </div>
          )}
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
            {honba > 0 && <span style={{ fontSize: 14, color: '#6c5ce7', marginLeft: 8 }}>({honba}本場)</span>}
          </div>
          <div style={{
            textAlign: 'center', fontSize: 20, color: '#e67e22',
            fontWeight: 'bold', marginBottom: 12,
          }}>
            {honbaPayments}
          </div>
          <div style={{ textAlign: 'center', fontSize: 15, color: '#7f8c8d', marginBottom: 16 }}>
            {answer.han}翻 / {answer.fu}符（繰り上がり前: {answer.rawFu}）/
            {answer.isDealer ? ' 親' : ' 子'} / {answer.agariType === 'tsumo' ? 'ツモ' : 'ロン'}
          </div>

          {phase === 'wrong' && (
            <>
              {/* Hint (normal mode only) */}
              {!isSimple && (() => {
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
                    {!isSimple && (
                      <>
                        <AnswerRow label="翻数" yours={inputHan + '翻'} correct={answer.han + '翻'} ok={Number(inputHan) === answer.han} />
                        <AnswerRow label="符" yours={inputFu + '符'} correct={answer.rawFu + '符'} ok={Number(inputFu) === answer.rawFu} />
                      </>
                    )}
                    <AnswerRow
                      label="点数"
                      yours={formatUserScore(inputScore1, inputScore2, isTsumo, isDealer)}
                      correct={honbaPayments}
                      ok={scoreIsCorrect(answer, inputScore1, inputScore2, honba)}
                    />
                  </tbody>
                </table>
              </div>

            </>
          )}

          {/* Yaku list - shown on both correct and wrong */}
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

          {/* Fu breakdown - shown on both correct and wrong */}
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

function scoreIsCorrect(answer: ScoreResult, s1: string, s2: string, honba: number = 0): boolean {
  if (answer.agariType === 'ron') return Number(s1) === (answer.ronPayment ?? 0) + honba * 300;
  if (answer.isDealer) return Number(s1) === (answer.tsumoAllPayment ?? 0) + honba * 100;
  return Number(s1) === (answer.tsumoChildPayment ?? 0) + honba * 100 &&
         Number(s2) === (answer.tsumoDealerPayment ?? 0) + honba * 100;
}
