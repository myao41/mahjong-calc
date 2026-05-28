import type { Difficulty } from '../types';
import type { AnswerMode } from './settings';

export type CertAnswerMode = AnswerMode | 'yaku-name' | 'fu-only';

export interface CertCategory {
  id: string;
  label: string;
}

export const CERT_CATEGORIES: CertCategory[] = [
  { id: 'yaku', label: '役' },
  { id: 'fu', label: '符' },
  { id: 'score_ko_ron', label: '点数・子ロン' },
  { id: 'score_ko_tsumo', label: '点数・子ツモ' },
  { id: 'score_oya', label: '点数・親' },
  { id: 'sogo', label: '総合' },
];

export interface QuizConstraints {
  isDealer?: boolean;
  agariType?: 'tsumo' | 'ron';
  targetFu?: number[];
  strategies?: string[];
  yakumanOnly?: boolean;
}

export interface CertLevel {
  id: string;
  label: string;
  desc: string;
  category: string;
  difficulty: Difficulty;
  timeLimit: number;
  answerMode: CertAnswerMode;
  totalQuestions: number;
  passCount: number;
  unlockRequires?: string;
  quizConstraints?: QuizConstraints;
}

export const CERT_LEVELS: CertLevel[] = [
  // ── 役 ──
  {
    id: 'yaku_basic', label: '基本役マスター', desc: '基本役の識別',
    category: 'yaku', difficulty: 'easy', timeLimit: 30,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    quizConstraints: {
      strategies: ['pinfu', 'tanyao', 'ittsu', 'sanshoku', 'honitsu', 'chiitoitsu', 'toitoi'],
    },
  },
  {
    id: 'yaku_yakuman', label: '役満マスター', desc: '役満の識別（役名のみ）',
    category: 'yaku', difficulty: 'normal', timeLimit: 30,
    answerMode: 'yaku-name', totalQuestions: 5, passCount: 4,
    quizConstraints: { yakumanOnly: true, strategies: ['yakuman'] },
  },

  // ── 符 ──
  {
    id: 'fu_basic', label: '符計算入門', desc: '基本の符計算',
    category: 'fu', difficulty: 'easy', timeLimit: 60,
    answerMode: 'fu-detail', totalQuestions: 5, passCount: 3,
  },
  {
    id: 'fu_tenpane', label: 'テンパネ判定', desc: '実践的な「何符？」の即答',
    category: 'fu', difficulty: 'normal', timeLimit: 15,
    answerMode: 'fu-only', totalQuestions: 5, passCount: 4,
    unlockRequires: 'fu_basic',
  },

  // ── 点数・子ロン ──
  {
    id: 'score_ko_ron_30', label: '子ロン30符', desc: '1〜6翻 × 30符の点数暗記',
    category: 'score_ko_ron', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    quizConstraints: { isDealer: false, agariType: 'ron', targetFu: [30] },
  },
  {
    id: 'score_ko_ron_40', label: '子ロン40符', desc: '1〜6翻 × 40符の点数暗記',
    category: 'score_ko_ron', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    unlockRequires: 'score_ko_ron_30',
    quizConstraints: { isDealer: false, agariType: 'ron', targetFu: [40] },
  },
  {
    id: 'score_ko_ron_special', label: '子ロン特殊', desc: '平和ロン(30符)・七対子(25符)',
    category: 'score_ko_ron', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    unlockRequires: 'score_ko_ron_40',
    quizConstraints: {
      isDealer: false, agariType: 'ron', targetFu: [25, 30],
      strategies: ['pinfu', 'chiitoitsu'],
    },
  },

  // ── 点数・子ツモ ──
  {
    id: 'score_ko_tsumo', label: '子ツモ30/40符', desc: '子ツモの支払いパターン',
    category: 'score_ko_tsumo', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    unlockRequires: 'score_ko_ron_special',
    quizConstraints: { isDealer: false, agariType: 'tsumo', targetFu: [30, 40] },
  },
  {
    id: 'score_ko_tsumo_special', label: '子ツモ特殊', desc: '平和ツモ(20符)・七対子(25符)',
    category: 'score_ko_tsumo', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    unlockRequires: 'score_ko_tsumo',
    quizConstraints: {
      isDealer: false, agariType: 'tsumo', targetFu: [20, 25],
      strategies: ['pinfu', 'chiitoitsu'],
    },
  },

  // ── 点数・親 ──
  {
    id: 'score_oya_ron', label: '親ロン', desc: '親ロンの点数パターン',
    category: 'score_oya', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    unlockRequires: 'score_ko_tsumo_special',
    quizConstraints: { isDealer: true, agariType: 'ron' },
  },
  {
    id: 'score_oya_tsumo', label: '親ツモ', desc: '親ツモの支払いパターン',
    category: 'score_oya', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    unlockRequires: 'score_oya_ron',
    quizConstraints: { isDealer: true, agariType: 'tsumo' },
  },

  // ── 総合 ──
  {
    id: 'score_sogo', label: '総合テスト', desc: '全パターン混合',
    category: 'sogo', difficulty: 'normal', timeLimit: 15,
    answerMode: 'simple', totalQuestions: 5, passCount: 4,
    unlockRequires: 'score_oya_tsumo',
  },
];

export interface CertRecord {
  levelId: string;
  date: string;
  correct: number;
  total: number;
  passed: boolean;
}

const STORAGE_KEY = 'mahjong-cert-v1';

export function loadCertRecords(): CertRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCertRecord(record: CertRecord): void {
  const records = loadCertRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  import('./cloudSync').then(m => m.pushCertRecord(record)).catch(() => {});
}

export function getBestRecord(levelId: string): CertRecord | null {
  const records = loadCertRecords().filter(r => r.levelId === levelId);
  if (records.length === 0) return null;
  return records.reduce((best, r) => r.correct > best.correct ? r : best);
}

export function hasPassed(levelId: string): boolean {
  return loadCertRecords().some(r => r.levelId === levelId && r.passed);
}

export function isUnlocked(level: CertLevel): boolean {
  if (!level.unlockRequires) return true;
  return hasPassed(level.unlockRequires);
}

export function getLevelsByCategory(categoryId: string): CertLevel[] {
  return CERT_LEVELS.filter(l => l.category === categoryId);
}
