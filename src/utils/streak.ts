const STREAK_KEY = 'mahjong-streak-v1';

export interface StreakData {
  current: number;
  best: number;
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, best: 0 };
    const data = JSON.parse(raw);
    return { current: data.current ?? 0, best: data.best ?? 0 };
  } catch {
    return { current: 0, best: 0 };
  }
}

function saveStreak(data: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  import('./cloudSync').then(m => m.pushStreak(data)).catch(() => {});
}

export function recordStreakResult(isCorrect: boolean): StreakData {
  const prev = getStreak();
  const current = isCorrect ? prev.current + 1 : 0;
  const best = Math.max(prev.best, current);
  const next = { current, best };
  saveStreak(next);
  return next;
}

export function resetStreak(): void {
  localStorage.removeItem(STREAK_KEY);
}

export function loadStreakFromStorage(): StreakData {
  return getStreak();
}

export function saveStreakDirect(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function getStreakMilestone(current: number): number | null {
  const milestones = [5, 10, 15, 20, 30, 50, 100];
  return milestones.includes(current) ? current : null;
}

export function getStreakBreakMessage(prev: number, best: number): string | null {
  if (prev === 0) return null;
  if (prev >= best && prev >= 5) {
    return `${prev}連続正解の記録が途切れました。再挑戦しましょう！`;
  }
  if (prev >= 3) {
    return `${prev}連続正解でストップ。最高記録${best}まであと${best - prev}問！`;
  }
  return null;
}
