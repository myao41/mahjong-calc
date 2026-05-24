import type { Tile, Mentsu, AgariCondition, QuizQuestion, Yaku, FuDetail } from '../types';

export type ErrorCategory =
  | 'missed_yaku'
  | 'extra_yaku'
  | 'pinfu_tsumo_fu'
  | 'pinfu_ron_fu'
  | 'chiitoitsu_fu'
  | 'wait_fu'
  | 'yakuhai_koutsu_fu'
  | 'renfu_jantai_fu'
  | 'open_min30_fu'
  | 'kantsu_fu'
  | 'open_yaku'
  | 'kazoe_yakuman'
  | 'kiriage_mangan'
  | 'score_lookup'
  | 'other_fu'
  | 'other';

export const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  missed_yaku: '役の見落とし',
  extra_yaku: '役の数えすぎ',
  pinfu_tsumo_fu: 'ピンフツモの符',
  pinfu_ron_fu: 'ピンフロンの符',
  chiitoitsu_fu: '七対子の符',
  wait_fu: '待ち符（カンチャン/ペンチャン/単騎）',
  yakuhai_koutsu_fu: '役牌刻子の符',
  renfu_jantai_fu: '連風雀頭の符',
  open_min30_fu: '副露時30符切り上げ',
  kantsu_fu: '槓子の符',
  open_yaku: '鳴き時の門前限定役の誤算入',
  kazoe_yakuman: '数え役満との混同',
  kiriage_mangan: '切り上げ満貫の見落とし',
  score_lookup: '点数表の引き間違い',
  other_fu: 'その他の符ミス',
  other: 'その他',
};

export interface UserAnswer {
  han: number;
  fu: number;
  score1: number;
  score2: number;
}

export interface AnswerErrors {
  han: boolean;
  fu: boolean;
  score: boolean;
}

export interface AnswerRecord {
  id: string;
  timestamp: string;
  source: 'quiz' | 'custom' | 'retry';
  customProblemId?: string;

  question: {
    closedTiles: Tile[];
    openMelds: Mentsu[];
    condition: AgariCondition;
  };
  correct: {
    han: number;
    rawFu: number;
    fu: number;
    yaku: Yaku[];
    fuDetails: FuDetail[];
    payments: string;
    scoreString: string;
    isYakuman: boolean;
  };
  user: UserAnswer;
  errors: AnswerErrors;
  isCorrect: boolean;
  category: ErrorCategory | null;
}

const RECORDS_KEY = 'mahjong-learning-records-v1';
const MAX_RECORDS = 500;

export function getAllRecords(): AnswerRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data as AnswerRecord[];
  } catch {
    return [];
  }
}

function saveAllRecords(records: AnswerRecord[]) {
  const sorted = [...records].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const capped = sorted.slice(0, MAX_RECORDS);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(capped));
}

function generateId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function deleteRecord(id: string): void {
  saveAllRecords(getAllRecords().filter(r => r.id !== id));
}

export function clearAllRecords(): void {
  localStorage.removeItem(RECORDS_KEY);
}

// === 集計 ===

export interface Stats {
  total: number;
  correct: number;
  correctRate: number;
  hanCorrect: number;
  fuCorrect: number;
  scoreCorrect: number;
  mistakeCount: number;
}

export function getStats(): Stats {
  const all = getAllRecords();
  const total = all.length;
  const correct = all.filter(r => r.isCorrect).length;
  return {
    total,
    correct,
    correctRate: total === 0 ? 0 : correct / total,
    hanCorrect: all.filter(r => !r.errors.han).length,
    fuCorrect: all.filter(r => !r.errors.fu).length,
    scoreCorrect: all.filter(r => !r.errors.score).length,
    mistakeCount: total - correct,
  };
}

export function getMistakes(): AnswerRecord[] {
  return getAllRecords().filter(r => !r.isCorrect);
}

export interface CategoryCount {
  category: ErrorCategory;
  count: number;
  label: string;
}

export function getCategoryRanking(): CategoryCount[] {
  const mistakes = getMistakes();
  const counts = new Map<ErrorCategory, number>();
  for (const m of mistakes) {
    if (m.category) {
      counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      count,
      label: CATEGORY_LABELS[category],
    }))
    .sort((a, b) => b.count - a.count);
}

// === 自動分類 ===

function classifyMistake(
  question: { closedTiles: Tile[]; openMelds: Mentsu[]; condition: AgariCondition },
  correct: AnswerRecord['correct'],
  user: UserAnswer,
  errors: AnswerErrors,
): ErrorCategory | null {
  if (!errors.han && !errors.fu && !errors.score) return null;

  const { condition, openMelds } = question;
  const isOpen = openMelds.length > 0;
  const yakuNames = correct.yaku.map(y => y.name);

  // 特殊役の符 (優先)
  if (yakuNames.includes('七対子') && errors.fu) return 'chiitoitsu_fu';
  if (yakuNames.includes('平和') && condition.agariType === 'tsumo' && errors.fu) return 'pinfu_tsumo_fu';
  if (yakuNames.includes('平和') && condition.agariType === 'ron' && errors.fu) return 'pinfu_ron_fu';

  // 点数のみ違う
  if (!errors.han && !errors.fu && errors.score) {
    if (correct.han >= 11 && !correct.isYakuman) return 'kazoe_yakuman';
    if ((correct.han === 4 && correct.rawFu === 30) ||
        (correct.han === 3 && correct.rawFu === 60)) {
      return 'kiriage_mangan';
    }
    return 'score_lookup';
  }

  // 符が違う
  if (errors.fu) {
    const hasWaitFu = correct.fuDetails.some(d =>
      d.name.includes('カンチャン') || d.name.includes('ペンチャン') || d.name.includes('単騎')
    );
    if (hasWaitFu) return 'wait_fu';

    if (isOpen && correct.rawFu === 20 && correct.fu === 30) return 'open_min30_fu';

    const hasRenfu = correct.fuDetails.some(d => d.name.includes('連風牌'));
    if (hasRenfu) return 'renfu_jantai_fu';

    const yakuhaiKoutsu = correct.fuDetails.some(d =>
      (d.name.includes('暗刻') || d.name.includes('明刻')) &&
      (d.name.includes('白') || d.name.includes('發') || d.name.includes('中') ||
       d.name.includes('東') || d.name.includes('南') || d.name.includes('西') || d.name.includes('北'))
    );
    if (yakuhaiKoutsu) return 'yakuhai_koutsu_fu';

    const hasKantsu = correct.fuDetails.some(d => d.name.includes('槓'));
    if (hasKantsu) return 'kantsu_fu';

    return 'other_fu';
  }

  // 翻が違う
  if (errors.han) {
    if (isOpen && user.han > correct.han) return 'open_yaku';
    if (user.han < correct.han) return 'missed_yaku';
    return 'extra_yaku';
  }

  return 'other';
}

// === 回答時に呼ぶ統合ヘルパー ===

export function recordQuizAnswer(
  question: QuizQuestion,
  user: UserAnswer,
  source: AnswerRecord['source'],
  customProblemId?: string,
): AnswerRecord {
  const { answer } = question;

  const scoreOk = (() => {
    if (answer.agariType === 'ron') return user.score1 === answer.ronPayment;
    if (answer.isDealer) return user.score1 === answer.tsumoAllPayment;
    return user.score1 === answer.tsumoChildPayment && user.score2 === answer.tsumoDealerPayment;
  })();

  const errors: AnswerErrors = {
    han: user.han !== answer.han,
    fu: user.fu !== answer.rawFu,
    score: !scoreOk,
  };
  const isCorrect = !errors.han && !errors.fu && !errors.score;

  const correct: AnswerRecord['correct'] = {
    han: answer.han,
    rawFu: answer.rawFu,
    fu: answer.fu,
    yaku: answer.yaku,
    fuDetails: answer.fuCalc.details,
    payments: answer.payments,
    scoreString: answer.scoreString,
    isYakuman: answer.yaku.some(y => y.isYakuman),
  };

  const category = classifyMistake(
    { closedTiles: question.closedTiles, openMelds: question.openMelds, condition: question.condition },
    correct,
    user,
    errors,
  );

  const record: AnswerRecord = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    source,
    customProblemId,
    question: {
      closedTiles: question.closedTiles,
      openMelds: question.openMelds,
      condition: question.condition,
    },
    correct,
    user,
    errors,
    isCorrect,
    category,
  };

  const all = getAllRecords();
  all.push(record);
  saveAllRecords(all);

  return record;
}
