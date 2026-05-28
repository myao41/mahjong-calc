import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { QuizQuestion, ScoreResult, FuDetail } from '../types';
import { windName } from '../utils/tiles';
import { TileButton } from './TileButton';
import { DetailScoreTable } from './DetailScoreTable';
import { generateHint } from '../utils/hint';
import type { UserAnswer } from '../utils/learningLog';
import { useViewport } from '../utils/useViewport';
import type { Tile } from '../types';
import type { CertAnswerMode } from '../utils/certification';
import { recordStreakResult, getStreak, getStreakMilestone, getStreakBreakMessage, type StreakData } from '../utils/streak';

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

const YAKUMAN_NAMES = [
  '四暗刻', '大三元', '国士無双', '字一色', '緑一色',
  '清老頭', '大四喜', '小四喜', '九蓮宝燈', '四槓子',
];

function generateYakumanChoices(correctYakuName: string): string[] {
  const distractors = YAKUMAN_NAMES.filter(n => n !== correctYakuName);
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }
  const choices = [correctYakuName, ...distractors.slice(0, 3)];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function generateFuOnlyChoices(correctFu: number): number[] {
  const allFu = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
  const choices = new Set<number>([correctFu]);
  const nearby = allFu.filter(f => Math.abs(f - correctFu) <= 20 && f !== correctFu);
  for (const f of nearby) {
    if (choices.size >= 4) break;
    choices.add(f);
  }
  for (const f of allFu) {
    if (choices.size >= 4) break;
    choices.add(f);
  }
  return Array.from(choices).sort((a, b) => a - b);
}

interface Props {
  question: QuizQuestion;
  onNext: () => void;
  nextLabel?: string;
  title?: string;
  onAnswered?: (user: UserAnswer, isCorrect: boolean) => void;
  onSkip?: () => void;
  timeLimit?: number;
  answerMode?: CertAnswerMode;
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
      ><span style={{ fontSize: 9 }}>−100</span></button>
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
      ><span style={{ fontSize: 9 }}>+100</span></button>
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

function isSpecialFu(fuDetails: FuDetail[]): 'chiitoitsu' | 'pinfu-tsumo' | null {
  if (fuDetails.length === 1 && fuDetails[0].name === '七対子') return 'chiitoitsu';
  if (fuDetails.length === 1 && fuDetails[0].name === 'ピンフツモ') return 'pinfu-tsumo';
  return null;
}

function getMentsuTotal(fuDetails: FuDetail[]): number {
  return fuDetails
    .filter(d => d.name.includes('刻') || d.name.includes('槓'))
    .reduce((s, d) => s + d.fu, 0);
}

function generateMentsuChoices(correct: number): number[] {
  const candidates = new Set<number>();
  candidates.add(correct);

  const allValues = [0, 2, 4, 8, 16, 32];
  for (const v of allValues) {
    if (candidates.size >= 6) break;
    candidates.add(v);
  }
  // Add some sums that are plausible mistakes
  for (const v of [correct + 2, correct - 2, correct * 2, Math.floor(correct / 2)]) {
    if (v >= 0 && v <= 128) candidates.add(v);
  }

  const arr = Array.from(candidates).filter(v => v !== correct);
  // Pick 3 distractors that are closest to the correct answer
  arr.sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct));
  const distractors = arr.slice(0, 3);
  const choices = [correct, ...distractors];
  choices.sort((a, b) => a - b);
  return choices;
}

function generateSpecialFuChoices(correct: number): number[] {
  if (correct === 25) return [20, 25, 30, 40];
  if (correct === 20) return [20, 22, 25, 30];
  return [20, 25, 30, 40];
}

const FU_BTN_WIDTH = 52;

const fuBtnStyle = (selected: boolean): React.CSSProperties => ({
  width: FU_BTN_WIDTH,
  minHeight: 44,
  borderRadius: 6,
  border: selected ? '2px solid #3498db' : '1px solid #bdc3c7',
  background: selected ? '#3498db' : '#fff',
  color: selected ? '#fff' : '#2c3e50',
  fontSize: 16,
  fontWeight: 'bold',
  cursor: 'pointer',
});

const fuRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const fuLabelStyle: React.CSSProperties = {
  width: '4.5em',
  flexShrink: 0,
  fontSize: 14,
  color: '#2c3e50',
};

const fuBtnsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
};

export function QuizSolver({ question, onNext, nextLabel = '次の問題', title, onAnswered, onSkip, timeLimit = 0, answerMode = 'normal', honba = 0 }: Props) {
  const { isMobile } = useViewport();
  const [phase, setPhase] = useState<Phase>('answering');
  const [inputHan, setInputHan] = useState('0');
  const [inputFu, setInputFu] = useState('20');
  const [inputScore1, setInputScore1] = useState('0');
  const [inputScore2, setInputScore2] = useState('0');
  const [showTenpaneHelp, setShowTenpaneHelp] = useState(false);
  const [fuAgari, setFuAgari] = useState<number | null>(null);
  const [fuWait, setFuWait] = useState<number | null>(null);
  const [fuHead, setFuHead] = useState<number | null>(null);
  const [fuMentsu, setFuMentsu] = useState<number | null>(null);
  const [fuSpecial, setFuSpecial] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const handleSubmitRef = useRef<() => void>(() => {});
  const handRef = useRef<HTMLDivElement>(null);
  const [handWidth, setHandWidth] = useState<number | undefined>(undefined);
  const [selectedYaku, setSelectedYaku] = useState<string | null>(null);
  const [selectedFuOnly, setSelectedFuOnly] = useState<number | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const prevStreakRef = useRef(getStreak().current);

  // Reset when question changes
  useEffect(() => {
    setPhase('answering');
    setInputHan('0');
    setInputFu('20');
    setInputScore1('0');
    setInputScore2('0');
    setShowTenpaneHelp(false);
    setFuAgari(null);
    setFuWait(null);
    setFuHead(null);
    setFuMentsu(null);
    setFuSpecial(null);
    setTimedOut(false);
    setRemainingTime(timeLimit);
    setSelectedYaku(null);
    setSelectedFuOnly(null);
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
  const isFuDetail = answerMode === 'fu-detail';
  const isYakuName = answerMode === 'yaku-name';
  const isFuOnly = answerMode === 'fu-only';

  const yakumanChoices = useMemo(() => {
    if (!isYakuName) return [];
    const yakumanYaku = answer.yaku.find(y => y.isYakuman);
    return generateYakumanChoices(yakumanYaku?.name ?? '');
  }, [isYakuName, answer]);

  const correctYakumanName = useMemo(() => {
    return answer.yaku.find(y => y.isYakuman)?.name ?? '';
  }, [answer]);

  const fuOnlyChoices = useMemo(() => {
    if (!isFuOnly) return [];
    return generateFuOnlyChoices(answer.fu);
  }, [isFuOnly, answer]);

  const specialFuType = useMemo(() => isSpecialFu(answer.fuCalc.details), [answer]);
  const correctMentsuTotal = useMemo(() => getMentsuTotal(answer.fuCalc.details), [answer]);
  const mentsuChoices = useMemo(() => generateMentsuChoices(correctMentsuTotal), [correctMentsuTotal]);
  const specialFuChoices = useMemo(
    () => specialFuType ? generateSpecialFuChoices(answer.fuCalc.roundedTotal) : [],
    [specialFuType, answer],
  );

  const correctFuAgari = useMemo(() => {
    const d = answer.fuCalc.details;
    const menzenRon = d.find(x => x.name === '門前ロン');
    if (menzenRon) return 10;
    const tsumo = d.find(x => x.name === 'ツモ');
    if (tsumo) return 2;
    return 0;
  }, [answer]);

  const correctFuWait = useMemo(() => {
    const d = answer.fuCalc.details;
    const wait = d.find(x =>
      x.name.includes('待ち') && !x.name.includes('副底'),
    );
    return wait ? wait.fu : 0;
  }, [answer]);

  const correctFuHead = useMemo(() => {
    const d = answer.fuCalc.details;
    const head = d.find(x => x.name.includes('雀頭'));
    return head ? head.fu : 0;
  }, [answer]);

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
    prevStreakRef.current = getStreak().current;
    const a = answer;

    if (isYakuName) {
      const allCorrect = selectedYaku === correctYakumanName;
      const user: UserAnswer = { han: 0, fu: 0, score1: 0, score2: 0 };
      setPhase(allCorrect ? 'correct' : 'wrong');
      setStreakData(recordStreakResult(allCorrect));
      onAnswered?.(user, allCorrect);
      return;
    }

    if (isFuOnly) {
      const allCorrect = selectedFuOnly === a.fu;
      const user: UserAnswer = { han: 0, fu: selectedFuOnly ?? 0, score1: 0, score2: 0 };
      setPhase(allCorrect ? 'correct' : 'wrong');
      setStreakData(recordStreakResult(allCorrect));
      onAnswered?.(user, allCorrect);
      return;
    }

    let derivedFu = Number(inputFu);
    if (isFuDetail) {
      if (specialFuType) {
        derivedFu = fuSpecial ?? 0;
      } else {
        derivedFu = 20 + (fuAgari ?? 0) + (fuWait ?? 0) + (fuHead ?? 0) + (fuMentsu ?? 0);
      }
    }

    const user: UserAnswer = {
      han: Number(inputHan),
      fu: derivedFu,
      score1: Number(inputScore1),
      score2: Number(inputScore2),
    };
    const hanOk = user.han === a.han;
    const fuOk = user.fu === a.rawFu;

    let fuDetailOk = true;
    if (isFuDetail) {
      if (specialFuType) {
        fuDetailOk = fuSpecial === a.rawFu;
      } else {
        fuDetailOk = fuAgari === correctFuAgari
          && fuWait === correctFuWait
          && fuHead === correctFuHead
          && fuMentsu === correctMentsuTotal;
      }
    }

    let scoreOk = false;
    if (a.agariType === 'ron') {
      scoreOk = user.score1 === expectedRon;
    } else if (a.isDealer) {
      scoreOk = user.score1 === expectedTsumoAll;
    } else {
      scoreOk = user.score1 === expectedTsumoChild &&
                user.score2 === expectedTsumoDealer;
    }

    const allCorrect = isSimple
      ? scoreOk
      : isFuDetail
        ? (hanOk && fuDetailOk && scoreOk)
        : (hanOk && fuOk && scoreOk);
    setPhase(allCorrect ? 'correct' : 'wrong');
    setStreakData(recordStreakResult(allCorrect));
    onAnswered?.(user, allCorrect);
  }, [phase, answer, inputHan, inputFu, inputScore1, inputScore2, onAnswered, isSimple, isFuDetail, isYakuName, isFuOnly, selectedYaku, selectedFuOnly, correctYakumanName, specialFuType, fuAgari, fuWait, fuHead, fuMentsu, fuSpecial, correctFuAgari, correctFuWait, correctFuHead, correctMentsuTotal, expectedRon, expectedTsumoAll, expectedTsumoChild, expectedTsumoDealer]);

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
        {condition.isDoubleRiichi && <span style={{
          background: '#2980b9', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>ダブル立直</span>}
        {condition.isRiichi && <span style={{
          background: '#3498db', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>立直</span>}
        {condition.isIppatsu && <span style={{
          background: '#8e44ad', color: '#fff', padding: '2px 10px',
          borderRadius: 3, fontWeight: 'bold', fontSize: 14,
        }}>一発</span>}
        {!condition.isRiichi && !condition.isDoubleRiichi && !question.openMelds.some(m => m.isOpen) && <span style={{
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

          // Always single row: compute tile width to fit everything
          // Rotated tiles in open melds are wider (75/56 ratio), so count in
          // "equivalent tile units" where 1 unit = normal tile width
          const ROTATE_RATIO = 75 / 56; // ≈ 1.339
          let tileUnits = mainHand.length + (agariTile ? 1 : 0);
          for (const m of question.openMelds) {
            const isAnkan = m.type === 'kantsu' && !m.isOpen;
            if (isAnkan) {
              tileUnits += m.tiles.length; // all normal width
            } else {
              tileUnits += ROTATE_RATIO + (m.tiles.length - 1); // 1 rotated + rest normal
            }
          }
          const hasMelds = question.openMelds.length > 0;
          const spacerCount = (hasMelds ? 1 : 0) + (agariTile ? 1 : 0);
          const spacerW = isMobile ? 8 : 12;
          const meldGapCount = hasMelds ? Math.max(0, question.openMelds.length - 1) : 0;

          const defaultTileW = isMobile ? 24 : 38;
          const containerW = handWidth ?? 999;
          const availableW = containerW - spacerCount * spacerW - meldGapCount * 4;
          const fittedTileW = Math.floor(availableW / Math.max(tileUnits, 1));
          const tw = Math.max(16, Math.min(defaultTileW, fittedTileW));

          const meldsEl = hasMelds && (
            <div style={{
              display: 'flex', flexWrap: 'nowrap',
              alignItems: 'flex-end',
            }}>
              {question.openMelds.map((meld, mi) => {
                const isAnkan = meld.type === 'kantsu' && !meld.isOpen;
                const meldTw = tw;
                return (
                  <div key={`meld-${mi}`} style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    marginLeft: mi > 0 ? 4 : 0,
                    flexShrink: 0,
                  }}>
                    {meld.tiles.map((tile, ti) => {
                      if (isAnkan && (ti === 0 || ti === 3)) {
                        const h = Math.round(meldTw * 75 / 56);
                        return (
                          <div key={ti} style={{
                            width: meldTw, height: h, flexShrink: 0,
                            borderRadius: 3,
                            background: '#E2B007',
                            border: '1px solid #D49B00',
                            boxSizing: 'border-box',
                          }} />
                        );
                      }
                      if (!isAnkan && ti === 0) {
                        return <RotatedTile key={ti} tile={tile} isMobile={isMobile} widthPx={meldTw} />;
                      }
                      return <TileButton key={ti} tile={tile} size="normal" widthPx={meldTw} />;
                    })}
                  </div>
                );
              })}
            </div>
          );

          // Scale badge font size proportionally to tile width
          const badgeScale = Math.min(1, tw / defaultTileW);
          const badgeFontSize = Math.max(9, Math.round((isMobile ? 11 : 12) * badgeScale));

          return (
            <div style={{
              display: 'flex', flexWrap: 'nowrap',
              alignItems: 'flex-end', justifyContent: 'center',
            }}>
              {mainHand.map((tile, i) => (
                <div key={i} style={{ flexShrink: 0 }}>
                  <TileButton tile={tile} widthPx={tw} />
                </div>
              ))}

              {hasMelds && (
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
                      fontSize: badgeFontSize,
                      color: '#fff', fontWeight: 'bold',
                      background: isTsumo ? '#16a085' : '#e74c3c',
                      padding: '1px 4px',
                      borderRadius: 3,
                      lineHeight: 1.3, marginBottom: Math.round(4 * badgeScale + 2),
                    }}>
                      {isTsumo ? 'ツモ' : 'ロン'}
                    </div>
                    <TileButton tile={agariTile} widthPx={tw} />
                  </div>
                </>
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

      {/* Answer input: yaku-name mode */}
      {phase === 'answering' && isYakuName && (
        <div style={{
          background: '#fff', borderRadius: 8,
          padding: isMobile ? 12 : 16,
          marginBottom: 14,
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 }}>
            この役満は？
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {yakumanChoices.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedYaku(name)}
                style={{
                  padding: '14px 8px', borderRadius: 8,
                  border: selectedYaku === name ? '2px solid #3498db' : '1px solid #bdc3c7',
                  background: selectedYaku === name ? '#ebf5fb' : '#fff',
                  color: '#2c3e50', fontSize: 15, fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!selectedYaku}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 8, border: 'none', fontSize: 18, fontWeight: 'bold',
              background: selectedYaku ? '#3498db' : '#bdc3c7',
              color: '#fff', cursor: selectedYaku ? 'pointer' : 'default',
            }}
          >
            回答する
          </button>
        </div>
      )}

      {/* Answer input: fu-only mode */}
      {phase === 'answering' && isFuOnly && (
        <div style={{
          background: '#fff', borderRadius: 8,
          padding: isMobile ? 12 : 16,
          marginBottom: 14,
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 }}>
            この手は何符？（テンパネ後）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            {fuOnlyChoices.map(fu => (
              <button
                key={fu}
                type="button"
                onClick={() => setSelectedFuOnly(fu)}
                style={{
                  padding: '14px 8px', borderRadius: 8,
                  border: selectedFuOnly === fu ? '2px solid #3498db' : '1px solid #bdc3c7',
                  background: selectedFuOnly === fu ? '#ebf5fb' : '#fff',
                  color: '#2c3e50', fontSize: 16, fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {fu}符
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={selectedFuOnly === null}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 8, border: 'none', fontSize: 18, fontWeight: 'bold',
              background: selectedFuOnly !== null ? '#3498db' : '#bdc3c7',
              color: '#fff', cursor: selectedFuOnly !== null ? 'pointer' : 'default',
            }}
          >
            回答する
          </button>
        </div>
      )}

      {/* Answer input: standard modes */}
      {phase === 'answering' && !isYakuName && !isFuOnly && (
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

                {isFuDetail ? (
                  <>
                    {specialFuType ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                        </div>
                        {showTenpaneHelp && (
                          <div style={{
                            fontSize: 12, color: '#5d4037', background: '#f5f5f5',
                            padding: '6px 10px', borderRadius: 4, lineHeight: 1.6,
                          }}>
                            テンパネ＝符を10の位に切り上げること（例: 32符→40符）
                          </div>
                        )}
                        <div style={{
                          fontSize: 13, color: '#e65100', background: '#fff8e1',
                          padding: '6px 10px', borderRadius: 4,
                        }}>
                          この手は特殊な符計算です
                        </div>
                        <div style={fuRowStyle}>
                          <span style={fuLabelStyle}>合計符</span>
                          <div style={fuBtnsContainerStyle}>
                            {specialFuChoices.map(v => (
                              <button key={v} type="button" onClick={() => setFuSpecial(v)} style={fuBtnStyle(fuSpecial === v)}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                            {(() => {
                              const hasAny = fuAgari !== null || fuWait !== null || fuHead !== null || fuMentsu !== null;
                              const partial = 20 + (fuAgari ?? 0) + (fuWait ?? 0) + (fuHead ?? 0) + (fuMentsu ?? 0);

                              return (
                                <div style={{
                                  width: 140, height: 40, textAlign: 'center',
                                  fontSize: hasAny ? 16 : 13,
                                  fontWeight: hasAny ? 'bold' : 'normal',
                                  border: '1px solid #bdc3c7', borderRadius: 4,
                                  background: '#f5f5f5',
                                  color: hasAny ? '#2c3e50' : '#7f8c8d',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {hasAny ? partial : '自動計算'}
                                </div>
                              );
                            })()}
                            <span style={{ color: '#7f8c8d', minWidth: 20 }}>符</span>
                          </div>
                        </div>
                        {showTenpaneHelp && (
                          <div style={{
                            fontSize: 12, color: '#5d4037', background: '#f5f5f5',
                            padding: '6px 10px', borderRadius: 4, lineHeight: 1.6,
                          }}>
                            テンパネ＝符を10の位に切り上げること（例: 32符→40符）
                          </div>
                        )}
                        <div style={fuRowStyle}>
                          <span style={fuLabelStyle}>副底</span>
                          <div style={fuBtnsContainerStyle}>
                            <div style={{ width: FU_BTN_WIDTH, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#7f8c8d' }}>
                              20符
                            </div>
                          </div>
                        </div>
                        <div style={fuRowStyle}>
                          <span style={fuLabelStyle}>アガリ方</span>
                          <div style={fuBtnsContainerStyle}>
                            {[0, 2, 10].map(v => (
                              <button key={v} type="button" onClick={() => setFuAgari(v)} style={fuBtnStyle(fuAgari === v)}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={fuRowStyle}>
                          <span style={fuLabelStyle}>待ち</span>
                          <div style={fuBtnsContainerStyle}>
                            {[0, 2].map(v => (
                              <button key={v} type="button" onClick={() => setFuWait(v)} style={fuBtnStyle(fuWait === v)}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={fuRowStyle}>
                          <span style={fuLabelStyle}>雀頭</span>
                          <div style={fuBtnsContainerStyle}>
                            {[0, 2].map(v => (
                              <button key={v} type="button" onClick={() => setFuHead(v)} style={fuBtnStyle(fuHead === v)}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={fuRowStyle}>
                          <span style={fuLabelStyle}>面子</span>
                          <div style={fuBtnsContainerStyle}>
                            {mentsuChoices.map(v => (
                              <button key={v} type="button" onClick={() => setFuMentsu(v)} style={fuBtnStyle(fuMentsu === v)}>
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>

                ) : (
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
                      }}>
                        テンパネ＝符を10の位に切り上げること（例: 32符→40符）
                      </div>
                    )}
                  </div>
                )}
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
              disabled={(() => {
                const scoreEmpty = !Number(inputScore1) || (isTsumo && !isDealer && !Number(inputScore2));
                if (isSimple) return scoreEmpty;
                if (isFuDetail) {
                  const fuFilled = specialFuType
                    ? fuSpecial !== null
                    : fuAgari !== null && fuWait !== null && fuHead !== null && fuMentsu !== null;
                  return !Number(inputHan) || !fuFilled || scoreEmpty;
                }
                return !Number(inputHan) || !Number(inputFu) || scoreEmpty;
              })()}
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
            fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 4,
            color: phase === 'correct' ? '#27ae60' : '#e74c3c',
          }}>
            {phase === 'correct' ? '正解!' : '不正解'}
          </div>

          {streakData && (() => {
            if (phase === 'correct' && streakData.current >= 2) {
              const milestone = getStreakMilestone(streakData.current);
              return (
                <div style={{
                  textAlign: 'center', marginBottom: 12,
                  fontSize: milestone ? 18 : 14,
                  fontWeight: milestone ? 'bold' : 'normal',
                  color: milestone ? '#e67e22' : '#8d6e63',
                }}>
                  {milestone
                    ? `${streakData.current}連続正解達成！`
                    : `${streakData.current}連続正解中`}
                  {streakData.current === streakData.best && streakData.best >= 3 && (
                    <span style={{ fontSize: 13, color: '#e67e22', marginLeft: 6 }}>自己ベスト!</span>
                  )}
                </div>
              );
            }
            if (phase === 'wrong') {
              const msg = getStreakBreakMessage(prevStreakRef.current, streakData.best);
              if (msg) {
                return (
                  <div style={{
                    textAlign: 'center', marginBottom: 12,
                    fontSize: 13, color: '#8d6e63',
                  }}>
                    {msg}
                  </div>
                );
              }
            }
            return <div style={{ marginBottom: 8 }} />;
          })()}

          {isYakuName ? (
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 }}>
                {correctYakumanName}
              </div>
              {phase === 'wrong' && selectedYaku && (
                <div style={{ fontSize: 14, color: '#e74c3c' }}>
                  あなたの回答: {selectedYaku}
                </div>
              )}
            </div>
          ) : isFuOnly ? (
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 }}>
                {answer.fu}符（テンパネ前: {answer.rawFu}符）
              </div>
              {phase === 'wrong' && selectedFuOnly !== null && (
                <div style={{ fontSize: 14, color: '#e74c3c' }}>
                  あなたの回答: {selectedFuOnly}符
                </div>
              )}
            </div>
          ) : (
            <>
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
                {answer.han}翻 / {answer.fu}符（テンパネ前: {answer.rawFu}）/
                {answer.isDealer ? ' 親' : ' 子'} / {answer.agariType === 'tsumo' ? 'ツモ' : 'ロン'}
              </div>
            </>
          )}

          {phase === 'wrong' && !isYakuName && !isFuOnly && (
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
                        {isFuDetail ? (
                          specialFuType ? (
                            <AnswerRow label="符(合計)" yours={(fuSpecial ?? 0) + '符'} correct={answer.rawFu + '符'} ok={fuSpecial === answer.rawFu} />
                          ) : (
                            <>
                              <AnswerRow label="アガリ方" yours={(fuAgari ?? 0) + '符'} correct={correctFuAgari + '符'} ok={fuAgari === correctFuAgari} />
                              <AnswerRow label="待ち" yours={(fuWait ?? 0) + '符'} correct={correctFuWait + '符'} ok={fuWait === correctFuWait} />
                              <AnswerRow label="雀頭" yours={(fuHead ?? 0) + '符'} correct={correctFuHead + '符'} ok={fuHead === correctFuHead} />
                              <AnswerRow label="面子" yours={(fuMentsu ?? 0) + '符'} correct={correctMentsuTotal + '符'} ok={fuMentsu === correctMentsuTotal} />
                            </>
                          )
                        ) : (
                          <AnswerRow label="符" yours={inputFu + '符'} correct={answer.rawFu + '符'} ok={Number(inputFu) === answer.rawFu} />
                        )}
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

          {/* Yaku list */}
          {!isFuOnly && (
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
          )}

          {/* Fu breakdown */}
          {!isYakuName && (
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
                  <span>合計（テンパネ前）</span>
                  <span style={{ fontWeight: 'bold' }}>{answer.rawFu}符</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d' }}>
                  <span>テンパネ後</span>
                  <span>{answer.fu}符</span>
                </div>
              </div>
            </div>
          )}

          {/* Detail score table */}
          {!isYakuName && !isFuOnly && (
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
          )}

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
