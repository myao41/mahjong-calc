import { useState, useEffect, useCallback } from 'react';
import {
  getStats, getCategoryRanking, clearAllRecords, getTodayStats,
  getWeeklyStats, getStatsByDifficulty,
  type Stats, type CategoryCount, type WeeklyData,
} from '../utils/learningLog';

interface Props {
  onStartWeakness: () => void;
}

export function LearningLogPage({ onStartWeakness }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayStats, setTodayStats] = useState<Stats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData[]>([]);
  const [ranking, setRanking] = useState<CategoryCount[]>([]);
  const [diffStats, setDiffStats] = useState<Record<string, Stats>>({});

  const refresh = useCallback(() => {
    setStats(getStats());
    setTodayStats(getTodayStats());
    setWeekly(getWeeklyStats(8));
    setRanking(getCategoryRanking());
    setDiffStats(getStatsByDifficulty());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!stats) return null;

  if (stats.total === 0) {
    return (
      <div>
        <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 12 }}>学習履歴</h2>
        <div style={{
          padding: 32, textAlign: 'center', color: '#7f8c8d',
          background: '#f8f9fa', borderRadius: 8, border: '1px dashed #bdc3c7',
        }}>
          まだ回答した問題はありません。<br />
          クイズに挑戦すると、ここに成績が記録されます。
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 12 }}>学習履歴</h2>

      {todayStats && todayStats.total > 0 && <TodaySection stats={todayStats} />}
      <WeeklyChart data={weekly} />
      <SummarySection stats={stats} />
      <DifficultySection diffStats={diffStats} />
      {ranking.length > 0 && (
        <RankingSection ranking={ranking} onStartWeakness={onStartWeakness} />
      )}

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <button
          onClick={() => {
            if (confirm('全ての学習履歴を削除しますか？この操作は取り消せません。')) {
              clearAllRecords();
              refresh();
            }
          }}
          style={btnStyle('danger')}
        >
          履歴を全リセット
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// Shared styles
// =========================================================================

const sectionTitle: React.CSSProperties = {
  fontSize: 15, color: '#2e7d32', marginBottom: 8,
  padding: '6px 12px', background: '#e8f5e9', borderRadius: 4,
  fontWeight: 'bold',
};

function btnStyle(variant: 'primary' | 'secondary' | 'danger'): React.CSSProperties {
  const c = {
    primary: { bg: '#3498db', color: '#fff', border: 'none' },
    secondary: { bg: '#ecf0f1', color: '#34495e', border: 'none' },
    danger: { bg: '#fff', color: '#e74c3c', border: '1px solid #e74c3c' },
  }[variant];
  return {
    padding: '6px 12px', fontSize: 13, fontWeight: 'bold',
    background: c.bg, color: c.color, border: c.border,
    borderRadius: 4, cursor: 'pointer',
  };
}

// =========================================================================
// Today
// =========================================================================

function TodaySection({ stats }: { stats: Stats }) {
  const pct = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
  const hanPct = stats.total === 0 ? 0 : Math.round((stats.hanCorrect / stats.total) * 100);
  const fuPct = stats.total === 0 ? 0 : Math.round((stats.fuCorrect / stats.total) * 100);
  const scorePct = stats.total === 0 ? 0 : Math.round((stats.scoreCorrect / stats.total) * 100);

  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={sectionTitle}>今日の成績</h3>
      <div style={{
        background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ textAlign: 'center', minWidth: 70 }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{pct}%</div>
          <div style={{ fontSize: 11, color: '#7f8c8d' }}>
            {stats.correct}/{stats.total}問正解
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <MiniRate label="翻" pct={hanPct} />
          <MiniRate label="符" pct={fuPct} />
          <MiniRate label="点" pct={scorePct} />
        </div>
      </div>
    </section>
  );
}

function MiniRate({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 70 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#e74c3c';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
      <span style={{ fontSize: 12, color: '#2c3e50', width: 20 }}>{label}</span>
      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', height: 10 }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%' }} />
      </div>
      <span style={{ fontSize: 11, color: '#7f8c8d', width: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// =========================================================================
// Weekly Chart
// =========================================================================

function WeeklyChart({ data }: { data: WeeklyData[] }) {
  const hasAnyData = data.some(w => w.total > 0);
  if (!hasAnyData) return null;

  const barHeight = 100;

  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={sectionTitle}>週別推移</h3>
      <div style={{
        background: '#fff', borderRadius: 8, padding: '14px 10px 10px', border: '1px solid #e0e0e0',
      }}>
        <div style={{
          position: 'relative', height: barHeight,
          borderBottom: '1px solid #e0e0e0',
        }}>
          {/* Y-axis labels */}
          {[100, 50, 0].map(v => (
            <div key={v} style={{
              position: 'absolute',
              left: 0, bottom: `${v}%`,
              fontSize: 9, color: '#bdc3c7',
              transform: 'translateY(50%)',
              width: 24, textAlign: 'right',
            }}>
              {v}
            </div>
          ))}
          {/* Gridline */}
          <div style={{
            position: 'absolute', left: 28, right: 0,
            bottom: '50%',
            borderBottom: '1px dashed #f0f0f0',
          }} />

          {/* Bars */}
          <div style={{
            position: 'absolute', left: 30, right: 0, top: 0, bottom: 0,
            display: 'flex', gap: 3, alignItems: 'flex-end',
          }}>
            {data.map((w, i) => (
              <div key={i} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                height: '100%',
              }}>
                {w.total > 0 && (
                  <div style={{ fontSize: 9, color: '#7f8c8d', marginBottom: 1 }}>
                    {w.rate}%
                  </div>
                )}
                <div style={{
                  width: '70%',
                  height: w.total > 0 ? `${Math.max(w.rate, 3)}%` : '0%',
                  background: w.total > 0
                    ? (w.rate >= 70 ? '#4caf50' : w.rate >= 50 ? '#ff9800' : '#ef5350')
                    : 'transparent',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s',
                  flexShrink: 0,
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* X-axis labels */}
        <div style={{ display: 'flex', marginLeft: 30, gap: 3, marginTop: 4 }}>
          {data.map((w, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', fontSize: 9, color: '#7f8c8d',
              lineHeight: 1.3,
            }}>
              <div>{w.weekLabel}</div>
              <div style={{ fontSize: 8, color: '#bdc3c7' }}>{w.total}問</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================================
// Summary
// =========================================================================

function SummarySection({ stats }: { stats: Stats }) {
  const pct = (n: number, d: number) => d === 0 ? 0 : Math.round((n / d) * 100);

  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={sectionTitle}>総合成績</h3>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, marginBottom: 12,
      }}>
        <StatCard value={`${pct(stats.correct, stats.total)}%`} label="正解率" highlight />
        <StatCard value={`${stats.total}`} label="累計問題" />
        <StatCard value={`${stats.mistakeCount}`} label="不正解" />
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: '#2c3e50' }}>
          項目別 正解率
        </div>
        <ItemRate label="翻数" correct={stats.hanCorrect} total={stats.total} />
        <ItemRate label="符" correct={stats.fuCorrect} total={stats.total} />
        <ItemRate label="点数" correct={stats.scoreCorrect} total={stats.total} />
      </div>
    </section>
  );
}

function StatCard({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? '#e8f5e9' : '#fff',
      border: `1px solid ${highlight ? '#a5d6a7' : '#e0e0e0'}`,
      borderRadius: 8, padding: 12, textAlign: 'center',
    }}>
      <div style={{
        fontSize: 24, fontWeight: 'bold',
        color: highlight ? '#2e7d32' : '#2c3e50',
      }}>{value}</div>
      <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ItemRate({ label, correct, total }: { label: string; correct: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const barColor = pct >= 70 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#e74c3c';
  return (
    <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 50, fontSize: 13, color: '#2c3e50' }}>{label}:</div>
      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height: 16 }}>
        <div style={{
          width: `${pct}%`, background: barColor, height: '100%',
          transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: '#7f8c8d' }}>
        {pct}% ({correct}/{total})
      </div>
    </div>
  );
}

// =========================================================================
// Difficulty Stats
// =========================================================================

const DIFF_LABELS: Record<string, string> = {
  easy: '初級',
  normal: '中級',
  hard: '上級',
  unknown: '―',
};

function DifficultySection({ diffStats }: { diffStats: Record<string, Stats> }) {
  const keys = ['easy', 'normal', 'hard'].filter(k => diffStats[k] && diffStats[k].total > 0);
  if (keys.length === 0) return null;

  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={sectionTitle}>難易度別</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${keys.length}, 1fr)`,
        gap: 8,
      }}>
        {keys.map(key => {
          const s = diffStats[key];
          const pct = s.total === 0 ? 0 : Math.round((s.correct / s.total) * 100);
          const color = pct >= 70 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#c62828';
          return (
            <div key={key} style={{
              background: '#fff', border: '1px solid #e0e0e0',
              borderRadius: 8, padding: 14, textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2c3e50', marginBottom: 6 }}>
                {DIFF_LABELS[key]}
              </div>
              <div style={{ fontSize: 26, fontWeight: 'bold', color }}>{pct}%</div>
              <div style={{ fontSize: 11, color: '#7f8c8d', marginTop: 2 }}>
                {s.correct}/{s.total}問
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// =========================================================================
// Ranking + Weakness Practice
// =========================================================================

function RankingSection({ ranking, onStartWeakness }: { ranking: CategoryCount[]; onStartWeakness: () => void }) {
  const top = ranking.slice(0, 5);
  const max = top[0]?.count ?? 1;

  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={sectionTitle}>苦手分野ランキング</h3>

      {top[0] && (
        <div style={{
          background: '#fff8e1', border: '1px solid #ffe082',
          borderRadius: 6, padding: 12, marginBottom: 10,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>!</span>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#5d4037', flex: 1 }}>
            最も苦手なのは <b>{top[0].label}</b> です（{top[0].count}回ミス）。
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #e0e0e0' }}>
        {top.map((c, i) => (
          <div key={c.category} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0',
            borderBottom: i < top.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}>
            <div style={{ width: 20, fontSize: 13, fontWeight: 'bold', color: '#7f8c8d' }}>{i + 1}.</div>
            <div style={{ flex: 1, fontSize: 13, color: '#2c3e50' }}>{c.label}</div>
            <div style={{
              width: 100, height: 12, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden',
            }}>
              <div style={{
                width: `${(c.count / max) * 100}%`, background: '#e67e22', height: '100%',
              }} />
            </div>
            <div style={{ width: 36, textAlign: 'right', fontSize: 12, color: '#e67e22', fontWeight: 'bold' }}>
              {c.count}回
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onStartWeakness}
        style={{
          width: '100%', marginTop: 10, padding: '12px',
          borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 'bold',
          background: '#e67e22', color: '#fff', cursor: 'pointer',
        }}
      >
        苦手を練習する
      </button>
    </section>
  );
}
