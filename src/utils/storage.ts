import type { Tile, Mentsu, AgariCondition } from '../types';

export interface SavedProblem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  closedTiles: Tile[];
  openMelds: Mentsu[];
  condition: AgariCondition;
}

const KEY = 'mahjong-custom-problems-v1';

export function loadProblems(): SavedProblem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data as SavedProblem[];
  } catch {
    return [];
  }
}

export function saveAllProblems(problems: SavedProblem[]): void {
  localStorage.setItem(KEY, JSON.stringify(problems));
}

export function saveProblem(p: SavedProblem): SavedProblem {
  const all = loadProblems();
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p;
  else all.push(p);
  saveAllProblems(all);
  import('./cloudSync').then(m => m.pushCustomProblem(p)).catch(() => {});
  return p;
}

export function deleteProblem(id: string): void {
  const all = loadProblems().filter(p => p.id !== id);
  saveAllProblems(all);
  import('./cloudSync').then(m => m.deleteCustomProblemCloud(id)).catch(() => {});
}

export function loadProblem(id: string): SavedProblem | null {
  return loadProblems().find(p => p.id === id) ?? null;
}

export function generateId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
