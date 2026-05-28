import type { Tile, Mentsu, AgariCondition, QuizQuestion, Yaku, FuDetail, Difficulty } from '../types';

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
  source: 'quiz' | 'custom' | 'retry' | 'weakness';
  difficulty?: Difficulty;
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
  import('./cloudSync').then(m => m.deleteAllLearningRecords()).catch(() => {});
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
  return computeStats(getAllRecords());
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
  difficulty?: Difficulty,
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
    difficulty,
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

  // Cloud sync (fire and forget)
  import('./cloudSync').then(m => m.pushLearningRecord(record)).catch(e => console.error('[cloud] push learning record failed:', e));

  return record;
}

// === 今日の成績 ===

export function getTodayStats(): Stats {
  const today = new Date().toDateString();
  const records = getAllRecords().filter(r => new Date(r.timestamp).toDateString() === today);
  return computeStats(records);
}

// === 週別推移 ===

export interface WeeklyData {
  weekLabel: string;
  total: number;
  correct: number;
  rate: number;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeeklyStats(numWeeks: number = 8): WeeklyData[] {
  const all = getAllRecords();
  const currentMonday = getMonday(new Date());
  const weeks: WeeklyData[] = [];

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const records = all.filter(r => {
      const t = new Date(r.timestamp);
      return t >= weekStart && t < weekEnd;
    });

    const total = records.length;
    const correct = records.filter(r => r.isCorrect).length;
    const pad = (n: number) => String(n);
    weeks.push({
      weekLabel: `${pad(weekStart.getMonth() + 1)}/${pad(weekStart.getDate())}`,
      total,
      correct,
      rate: total === 0 ? 0 : Math.round((correct / total) * 100),
    });
  }
  return weeks;
}

// === 難易度別成績 ===

export function getStatsByDifficulty(): Record<string, Stats> {
  const all = getAllRecords();
  const groups: Record<string, AnswerRecord[]> = {};
  for (const r of all) {
    const key = r.difficulty ?? 'unknown';
    (groups[key] ??= []).push(r);
  }
  const result: Record<string, Stats> = {};
  for (const [key, records] of Object.entries(groups)) {
    result[key] = computeStats(records);
  }
  return result;
}

// === 直近の傾向分析（フィードバック用） ===

export interface FeedbackData {
  recentTotal: number;
  recentCorrectRate: number;
  strengths: string[];
  weaknesses: { label: string; category: ErrorCategory }[];
  suggestedAction: 'practice_weakness' | 'step_up' | 'keep_going' | 'need_more_data';
  suggestedMessage: string;
  ctaLabel: string;
  ctaPath: string;
}

export function getFeedback(recentN: number = 20): FeedbackData {
  const all = getAllRecords();
  const sorted = [...all].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recent = sorted.slice(0, recentN);

  if (recent.length < 10) {
    return {
      recentTotal: recent.length,
      recentCorrectRate: 0,
      strengths: [],
      weaknesses: [],
      suggestedAction: 'need_more_data',
      suggestedMessage: `まだデータが少ないので、もう少し問題を解いてみましょう！\nあと${10 - recent.length}問解くとあなたの傾向が分析できます。`,
      ctaLabel: 'クイズに挑戦',
      ctaPath: '/quiz/normal',
    };
  }

  const correctCount = recent.filter(r => r.isCorrect).length;
  const correctRate = Math.round((correctCount / recent.length) * 100);

  const categoryMistakes = new Map<ErrorCategory, number>();
  const categoryCorrects = new Map<ErrorCategory, number>();
  for (const r of recent) {
    if (!r.isCorrect && r.category) {
      categoryMistakes.set(r.category, (categoryMistakes.get(r.category) ?? 0) + 1);
    }
  }

  const scoreLookup = recent.filter(r => !r.errors.score).length;
  const hanLookup = recent.filter(r => !r.errors.han).length;
  const fuLookup = recent.filter(r => !r.errors.fu).length;

  const strengths: string[] = [];
  const scorePct = Math.round((scoreLookup / recent.length) * 100);
  const hanPct = Math.round((hanLookup / recent.length) * 100);
  const fuPct = Math.round((fuLookup / recent.length) * 100);
  if (scorePct >= 80) strengths.push(`点数計算: 正答率${scorePct}%`);
  if (hanPct >= 80) strengths.push(`翻数判定: 正答率${hanPct}%`);
  if (fuPct >= 80) strengths.push(`符計算: 正答率${fuPct}%`);

  const weaknesses = Array.from(categoryMistakes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat, count]) => ({ label: CATEGORY_LABELS[cat], category: cat }));

  if (correctRate >= 80 && weaknesses.length === 0) {
    return {
      recentTotal: recent.length,
      recentCorrectRate: correctRate,
      strengths,
      weaknesses,
      suggestedAction: 'step_up',
      suggestedMessage: `直近${recent.length}問で正答率${correctRate}%！\n${strengths.length > 0 ? strengths[0] + 'はもう安定してますね。\n' : ''}次は検定に挑戦してみては？`,
      ctaLabel: '検定に挑戦',
      ctaPath: '/quiz/cert',
    };
  }

  if (weaknesses.length > 0) {
    const topWeak = weaknesses[0];
    return {
      recentTotal: recent.length,
      recentCorrectRate: correctRate,
      strengths,
      weaknesses,
      suggestedAction: 'practice_weakness',
      suggestedMessage: `直近${recent.length}問を見ると、${strengths.length > 0 ? strengths[0] + 'はバッチリです！\n' : ''}ただ、「${topWeak.label}」で間違いが続いています。\n苦手モードで集中的に練習するのがおすすめです。`,
      ctaLabel: '苦手を練習する',
      ctaPath: '/quiz/weakness',
    };
  }

  return {
    recentTotal: recent.length,
    recentCorrectRate: correctRate,
    strengths,
    weaknesses,
    suggestedAction: 'keep_going',
    suggestedMessage: `直近${recent.length}問で正答率${correctRate}%。\nこの調子で続けていきましょう！`,
    ctaLabel: 'クイズに挑戦',
    ctaPath: '/quiz/normal',
  };
}

function computeStats(records: AnswerRecord[]): Stats {
  const total = records.length;
  const correct = records.filter(r => r.isCorrect).length;
  return {
    total,
    correct,
    correctRate: total === 0 ? 0 : correct / total,
    hanCorrect: records.filter(r => !r.errors.han).length,
    fuCorrect: records.filter(r => !r.errors.fu).length,
    scoreCorrect: records.filter(r => !r.errors.score).length,
    mistakeCount: total - correct,
  };
}
