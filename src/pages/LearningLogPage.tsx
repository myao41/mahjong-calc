import { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion } from '../types';
import {
  getStats, getMistakes, getCategoryRanking, deleteRecord, clearAllRecords,
  recordQuizAnswer,
  type AnswerRecord, type Stats, type CategoryCount,
} from '../utils/learningLog';
import { calculateScore } from '../utils/score';
import { QuizSolver } from '../components/QuizSolver';
import { TileButton } from '../components/TileButton';
import type { Tile } from '../types';

type View = { type: 'list' } | { type: 'retry'; record: AnswerRecord };

export function LearningLogPage() {
  const [view, setView] = useState<View>({ type: 'list' });
  const [stats, setStats] = useState<Stats | null>(null);
  const [mistakes, setMistakes] = useState<AnswerRecord[]>([]);
  const [ranking, setRanking] = useState<CategoryCount[]>([]);

  const refresh = useCallback(() => {
    setStats(getStats());
    setMistakes(getMistakes());
    setRanking(getCategoryRanking());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (view.type === 'retry') {
    const answer = calculateScore(
      view.record.question.closedTiles,
      view.record.question.openMelds,
      view.record.question.condition,
    );
    if (!answer) {
      return (
        <div style={{ padding: 16 }}>
          <div style={{ color: '#c0392b', marginBottom: 12 }}>計算できません。</div>
          <button onClick={() => setView({ type: 'list' })} style={btnStyle('primary')}>
            一覧に戻る
          </button>
        </div>
      );
    }
    const question: QuizQuestion = {
      closedTiles: view.record.question.closedTiles,
      openMelds: view.record.question.openMelds,
      condition: view.record.question.condition,
      answer,
    };
    return (
      <QuizSolver
        question={question}
        onNext={() => { refresh(); setView({ type: 'list' }); }}
        onSkip={() => { refresh(); setView({ type: 'list' }); }}
        nextLabel="一覧に戻る"
        title={`📝 復習: ${view.record.category ? view.record.category : ''}`}
        onAnswered={(user) => { recordQuizAnswer(question, user, 'retry'); }}
      />
    );
  }

  if (!stats) return null;

  if (stats.total === 0) {
    return (
      <div>
        <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 12 }}>📊 学習履歴</h2>
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
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 12 }}>📊 学習履歴</h2>

      {/* 総合サマリー */}
      <SummarySection stats={stats} />

      {/* 苦手分野ランキング */}
      {ranking.length > 0 && <RankingSection ranking={ranking} />}

      {/* 間違えた問題 */}
      {mistakes.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h3 style={sectionTitle}>📝 間違えた問題（{mistakes.length}件）</h3>
          {mistakes.slice(0, 20).map(m => (
            <MistakeCard
              key={m.id}
              record={m}
              onRetry={() => setView({ type: 'retry', record: m })}
              onDelete={() => {
                if (confirm('この履歴を削除しますか？')) {
                  deleteRecord(m.id);
                  refresh();
                }
              }}
            />
          ))}
          {mistakes.length > 20 && (
            <div style={{ fontSize: 12, color: '#7f8c8d', textAlign: 'center', marginTop: 8 }}>
              ※ 直近20件を表示中（全{mistakes.length}件）
            </div>
          )}
        </section>
      )}

      {/* リセット */}
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
          🗑 履歴を全リセット
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// Sections
// =========================================================================

const sectionTitle: React.CSSProperties = {
  fontSize: 15, color: '#2e7d32', marginBottom: 8,
  padding: '6px 12px', background: '#e8f5e9', borderRadius: 4,
  fontWeight: 'bold',
};

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

function RankingSection({ ranking }: { ranking: CategoryCount[] }) {
  const top = ranking.slice(0, 5);
  const max = top[0]?.count ?? 1;

  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={sectionTitle}>🎯 苦手分野ランキング</h3>

      {top[0] && (
        <div style={{
          background: '#fff8e1', border: '1px solid #ffe082',
          borderRadius: 6, padding: 12, marginBottom: 10,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>💡</span>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#5d4037' }}>
            最も苦手なのは <b>{top[0].label}</b> です（{top[0].count}回ミス）。
            符計算ルール・点数計算ルールのページで確認してみましょう。
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
    </section>
  );
}

// =========================================================================
// Mistake Card
// =========================================================================

function MistakeCard({ record, onRetry, onDelete }: {
  record: AnswerRecord;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const { question, correct, user, errors } = record;
  const isDealer = question.condition.seatWind === 1;
  const agariType = question.condition.agariType;
  const tilesPreview: Tile[] = [
    ...question.closedTiles,
    ...question.openMelds.flatMap(m => m.tiles),
  ].slice(0, 14);

  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
      padding: 12, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: '#7f8c8d' }}>
          {formatDateTime(record.timestamp)}
          {record.source === 'retry' && <span style={{ marginLeft: 6, padding: '1px 6px', background: '#9b59b6', color: '#fff', borderRadius: 3, fontSize: 10 }}>復習</span>}
          {record.source === 'custom' && <span style={{ marginLeft: 6, padding: '1px 6px', background: '#3498db', color: '#fff', borderRadius: 3, fontSize: 10 }}>自作</span>}
        </div>
        {record.category && (
          <div style={{
            fontSize: 11, padding: '2px 8px',
            background: '#fff3e0', color: '#e65100',
            border: '1px solid #ffcc80', borderRadius: 12, fontWeight: 'bold',
          }}>
            {labelOf(record.category)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap', marginBottom: 8 }}>
        {tilesPreview.map((t, i) => (
          <TileButton key={i} tile={t} size="small" />
        ))}
      </div>

      <div style={{ fontSize: 13, color: '#2c3e50', marginBottom: 4 }}>
        <b>正解:</b> {correct.scoreString} / {correct.han}翻{correct.rawFu}符 /
        {isDealer ? ' 親' : ' 子'}{agariType === 'tsumo' ? 'ツモ' : 'ロン'}
      </div>
      <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 8 }}>
        <b>あなたの回答:</b>
        {' '}翻数 {user.han}{errors.han ? '✗' : '✓'}
        {' / '}符 {user.fu}{errors.fu ? '✗' : '✓'}
        {' / '}点数 {errors.score ? '✗' : '✓'}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onRetry} style={btnStyle('primary')}>▶ もう一度解く</button>
        <button onClick={onDelete} style={btnStyle('secondary')}>× 削除</button>
      </div>
    </div>
  );
}

function labelOf(category: import('../utils/learningLog').ErrorCategory): string {
  const labels: Record<string, string> = {
    missed_yaku: '役の見落とし',
    extra_yaku: '役の数えすぎ',
    pinfu_tsumo_fu: 'ピンフツモの符',
    pinfu_ron_fu: 'ピンフロンの符',
    chiitoitsu_fu: '七対子の符',
    wait_fu: '待ち符',
    yakuhai_koutsu_fu: '役牌刻子',
    renfu_jantai_fu: '連風雀頭',
    open_min30_fu: '副露30符',
    kantsu_fu: '槓子の符',
    open_yaku: '鳴き役の誤算入',
    kazoe_yakuman: '数え役満',
    kiriage_mangan: '切り上げ満貫',
    score_lookup: '点数表',
    other_fu: '符ミス',
    other: 'その他',
  };
  return labels[category] || category;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

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
