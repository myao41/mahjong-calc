import { supabase } from './supabase';
import { showToast } from '../components/Toast';
import type { AnswerRecord } from './learningLog';
import type { SavedProblem } from './storage';
import type { CertRecord } from './certification';
import type { Settings } from './settings';
import type { StreakData } from './streak';

let syncErrorShown = false;

function notifySyncError() {
  if (syncErrorShown) return;
  syncErrorShown = true;
  showToast('クラウド同期に失敗しました。データはローカルに保存されています。', 'error');
  setTimeout(() => { syncErrorShown = false; }, 30000);
}

// =============================================
// Auth helper
// =============================================

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// =============================================
// Learning Records
// =============================================

export async function pushLearningRecord(record: AnswerRecord): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('learning_records').upsert({
    user_id: userId,
    local_id: record.id,
    timestamp: record.timestamp,
    source: record.source,
    difficulty: record.difficulty ?? null,
    custom_problem_id: record.customProblemId ?? null,
    question: record.question,
    correct: record.correct,
    user_answer: record.user,
    errors: record.errors,
    is_correct: record.isCorrect,
    category: record.category ?? null,
  }, { onConflict: 'user_id,local_id' });

  if (error) {
    console.error('[cloud] pushLearningRecord error:', error);
    notifySyncError();
  }
}

export async function pullLearningRecords(): Promise<AnswerRecord[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('learning_records')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.local_id,
    timestamp: row.timestamp,
    source: row.source,
    difficulty: row.difficulty ?? undefined,
    customProblemId: row.custom_problem_id ?? undefined,
    question: row.question,
    correct: row.correct,
    user: row.user_answer,
    errors: row.errors,
    isCorrect: row.is_correct,
    category: row.category ?? null,
  }));
}

export async function deleteAllLearningRecords(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from('learning_records').delete().eq('user_id', userId);
}

// =============================================
// Custom Problems
// =============================================

export async function pushCustomProblem(problem: SavedProblem): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('custom_problems').upsert({
    id: problem.id,
    user_id: userId,
    name: problem.name,
    closed_tiles: problem.closedTiles,
    open_melds: problem.openMelds,
    condition: problem.condition,
    created_at: problem.createdAt,
    updated_at: problem.updatedAt,
  }, { onConflict: 'user_id,id' });

  if (error) { console.error('[cloud] pushCustomProblem error:', error); notifySyncError(); }
}

export async function pullCustomProblems(): Promise<SavedProblem[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('custom_problems')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    name: row.name,
    closedTiles: row.closed_tiles,
    openMelds: row.open_melds,
    condition: row.condition,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteCustomProblemCloud(problemId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from('custom_problems').delete().match({ user_id: userId, id: problemId });
}

// =============================================
// Cert Records
// =============================================

export async function pushCertRecord(record: CertRecord): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('cert_records').insert({
    user_id: userId,
    level_id: record.levelId,
    date: record.date,
    correct: record.correct,
    total: record.total,
    passed: record.passed,
  });

  if (error) { console.error('[cloud] pushCertRecord error:', error); notifySyncError(); }
}

export async function pullCertRecords(): Promise<CertRecord[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('cert_records')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map(row => ({
    levelId: row.level_id,
    date: row.date,
    correct: row.correct,
    total: row.total,
    passed: row.passed,
  }));
}

// =============================================
// User Settings
// =============================================

export async function pushSettings(settings: Settings): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    answer_mode: settings.answerMode,
    time_limit: settings.timeLimit,
    honba: settings.honba,
    updated_at: new Date().toISOString(),
  });

  if (error) { console.error('[cloud] pushSettings error:', error); notifySyncError(); }
}

export async function pullSettings(): Promise<Settings | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    answerMode: data.answer_mode,
    timeLimit: data.time_limit,
    honba: data.honba,
  };
}

// =============================================
// Streak
// =============================================

export async function pushStreak(data: StreakData): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('user_streak').upsert({
    user_id: userId,
    current: data.current,
    best: data.best,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) { console.error('[cloud] pushStreak error:', error); notifySyncError(); }
}

export async function pullStreak(): Promise<StreakData | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_streak')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return { current: data.current, best: data.best };
}

// =============================================
// Delete All User Data (withdraw)
// =============================================

export async function deleteAllCloudData(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await Promise.all([
    supabase.from('learning_records').delete().eq('user_id', userId),
    supabase.from('custom_problems').delete().eq('user_id', userId),
    supabase.from('cert_records').delete().eq('user_id', userId),
    supabase.from('user_settings').delete().eq('user_id', userId),
    supabase.from('user_streak').delete().eq('user_id', userId),
  ]);
}

// =============================================
// Full Sync (on login)
// =============================================

export async function syncOnLogin(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  try {
    await Promise.all([
      syncLearningRecords(),
      syncCustomProblems(),
      syncCertRecords(),
      syncSettings(),
      syncStreak(),
    ]);
  } catch (e) {
    console.error('[cloud] syncOnLogin error:', e);
  }
}

async function syncLearningRecords(): Promise<void> {
  const { getAllRecords } = await import('./learningLog');
  const localRecords = getAllRecords();
  const cloudRecords = await pullLearningRecords();

  // Merge: cloud records not in local
  const localIds = new Set(localRecords.map(r => r.id));
  const newFromCloud = cloudRecords.filter(r => !localIds.has(r.id));

  if (newFromCloud.length > 0) {
    const merged = [...localRecords, ...newFromCloud]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 500);
    localStorage.setItem('mahjong-learning-records-v1', JSON.stringify(merged));
  }

  // Push: local records not in cloud
  const cloudIds = new Set(cloudRecords.map(r => r.id));
  const localOnly = localRecords.filter(r => !cloudIds.has(r.id));
  for (const record of localOnly) {
    await pushLearningRecord(record);
  }
}

async function syncCustomProblems(): Promise<void> {
  const { loadProblems, saveAllProblems } = await import('./storage');
  const localProblems = loadProblems();
  const cloudProblems = await pullCustomProblems();

  // Merge: cloud problems not in local
  const localIds = new Set(localProblems.map(p => p.id));
  const newFromCloud = cloudProblems.filter(p => !localIds.has(p.id));

  if (newFromCloud.length > 0) {
    saveAllProblems([...localProblems, ...newFromCloud]);
  }

  // Push: local problems not in cloud
  const cloudIds = new Set(cloudProblems.map(p => p.id));
  const localOnly = localProblems.filter(p => !cloudIds.has(p.id));
  for (const problem of localOnly) {
    await pushCustomProblem(problem);
  }
}

async function syncCertRecords(): Promise<void> {
  const { loadCertRecords } = await import('./certification');
  const localRecords = loadCertRecords();
  const cloudRecords = await pullCertRecords();

  // Merge: cloud records not in local (by date+levelId)
  const localKey = (r: CertRecord) => `${r.levelId}_${r.date}`;
  const localKeys = new Set(localRecords.map(localKey));
  const newFromCloud = cloudRecords.filter(r => !localKeys.has(localKey(r)));

  if (newFromCloud.length > 0) {
    const merged = [...localRecords, ...newFromCloud];
    localStorage.setItem('mahjong-cert-v1', JSON.stringify(merged));
  }

  // Push: local records not in cloud
  const cloudKey = (r: CertRecord) => `${r.levelId}_${r.date}`;
  const cloudKeys = new Set(cloudRecords.map(cloudKey));
  const localOnly = localRecords.filter(r => !cloudKeys.has(cloudKey(r)));
  for (const record of localOnly) {
    await pushCertRecord(record);
  }
}

async function syncSettings(): Promise<void> {
  const { loadSettings, saveSettings } = await import('./settings');
  const cloudSettings = await pullSettings();

  if (cloudSettings) {
    // Cloud wins: overwrite local
    saveSettings(cloudSettings);
  } else {
    // No cloud settings: push local to cloud
    const local = loadSettings();
    await pushSettings(local);
  }
}

async function syncStreak(): Promise<void> {
  const { loadStreakFromStorage, saveStreakDirect } = await import('./streak');
  const local = loadStreakFromStorage();
  const cloud = await pullStreak();

  if (cloud) {
    const merged = {
      current: Math.max(local.current, cloud.current),
      best: Math.max(local.best, cloud.best),
    };
    saveStreakDirect(merged);
    if (merged.best !== cloud.best || merged.current !== cloud.current) {
      await pushStreak(merged);
    }
  } else {
    if (local.best > 0 || local.current > 0) {
      await pushStreak(local);
    }
  }
}
