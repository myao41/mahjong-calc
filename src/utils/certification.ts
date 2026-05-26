import type { Difficulty } from '../types';
import type { AnswerMode } from './settings';

export interface CertLevel {
  id: string;
  label: string;
  desc: string;
  difficulty: Difficulty;
  timeLimit: number;
  answerMode: AnswerMode;
  totalQuestions: number;
  passCount: number;
}

export const CERT_LEVELS: CertLevel[] = [
  { id: 'grade1', label: '1級', desc: '基本役', difficulty: 'easy', timeLimit: 30, answerMode: 'simple', totalQuestions: 5, passCount: 5 },
  { id: 'grade2', label: '2級', desc: '全役', difficulty: 'normal', timeLimit: 30, answerMode: 'simple', totalQuestions: 5, passCount: 5 },
  { id: 'grade3', label: '3級', desc: 'プロ試験', difficulty: 'hard', timeLimit: 30, answerMode: 'simple', totalQuestions: 5, passCount: 5 },
  { id: 'dan1', label: '初段', desc: 'プロ試験(15秒)', difficulty: 'hard', timeLimit: 15, answerMode: 'simple', totalQuestions: 5, passCount: 5 },
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
