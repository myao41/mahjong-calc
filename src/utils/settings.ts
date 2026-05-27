export type AnswerMode = 'simple' | 'normal' | 'fu-detail';

export interface Settings {
  answerMode: AnswerMode;
  timeLimit: number; // 0, 10, 30, 60
  honba: boolean;
}

const STORAGE_KEY = 'mahjong-settings-v1';

export const DEFAULT_SETTINGS: Settings = {
  answerMode: 'normal',
  timeLimit: 0,
  honba: false,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      answerMode: parsed.answerMode === 'simple' ? 'simple' : parsed.answerMode === 'fu-detail' ? 'fu-detail' : 'normal',
      timeLimit: [0, 15, 30, 60].includes(parsed.timeLimit) ? parsed.timeLimit : 0,
      honba: typeof parsed.honba === 'boolean' ? parsed.honba : false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  import('./cloudSync').then(m => m.pushSettings(settings)).catch(() => {});
}
