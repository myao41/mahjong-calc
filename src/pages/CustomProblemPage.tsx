import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Tile, Mentsu, AgariCondition, QuizQuestion, ScoreResult } from '../types';
import { TilePalette } from '../components/TilePalette';
import { MeldInput } from '../components/MeldInput';
import { ConditionInput } from '../components/ConditionInput';
import { HandDisplay } from '../components/HandDisplay';
import { QuizSolver } from '../components/QuizSolver';
import { calculateScore } from '../utils/score';
import { recordQuizAnswer } from '../utils/learningLog';
import {
  type SavedProblem,
  loadProblems,
  saveProblem,
  deleteProblem,
  generateId,
} from '../utils/storage';

type View =
  | { type: 'list' }
  | { type: 'editor'; initial: SavedProblem | null }
  | { type: 'solve'; problem: SavedProblem };

export function CustomProblemPage() {
  const [view, setView] = useState<View>({ type: 'list' });
  const [problems, setProblems] = useState<SavedProblem[]>([]);

  useEffect(() => {
    setProblems(loadProblems());
  }, []);

  const refresh = useCallback(() => {
    setProblems(loadProblems());
  }, []);

  if (view.type === 'editor') {
    return (
      <CustomProblemEditor
        initial={view.initial}
        onCancel={() => setView({ type: 'list' })}
        onSaved={() => { refresh(); setView({ type: 'list' }); }}
        onSolve={(p) => setView({ type: 'solve', problem: p })}
      />
    );
  }

  if (view.type === 'solve') {
    const answer = calculateScore(
      view.problem.closedTiles,
      view.problem.openMelds,
      view.problem.condition,
    );
    if (!answer) {
      return (
        <div style={{ padding: 16 }}>
          <div style={{ color: '#c0392b', marginBottom: 12 }}>
            この問題は計算できません（役なし、または不正な手牌）。
          </div>
          <button
            onClick={() => setView({ type: 'list' })}
            style={listBtnStyle('primary')}
          >一覧に戻る</button>
        </div>
      );
    }
    const question: QuizQuestion = {
      closedTiles: view.problem.closedTiles,
      openMelds: view.problem.openMelds,
      condition: view.problem.condition,
      answer,
    };
    return (
      <QuizSolver
        question={question}
        onNext={() => setView({ type: 'list' })}
        onSkip={() => setView({ type: 'list' })}
        nextLabel="一覧に戻る"
        title={view.problem.name}
        onAnswered={(user) => {
          recordQuizAnswer(question, user, 'custom', view.problem.id);
        }}
      />
    );
  }

  // list view
  return (
    <CustomProblemList
      problems={problems}
      onCreate={() => setView({ type: 'editor', initial: null })}
      onEdit={(p) => setView({ type: 'editor', initial: p })}
      onDuplicate={(p) => setView({ type: 'editor', initial: { ...p, id: '', name: p.name + ' のコピー' } })}
      onSolve={(p) => setView({ type: 'solve', problem: p })}
      onDelete={(p) => {
        if (confirm(`「${p.name}」を削除しますか？`)) {
          deleteProblem(p.id);
          refresh();
        }
      }}
    />
  );
}

// =========================================================================
// List view
// =========================================================================

interface ListProps {
  problems: SavedProblem[];
  onCreate: () => void;
  onEdit: (p: SavedProblem) => void;
  onDuplicate: (p: SavedProblem) => void;
  onSolve: (p: SavedProblem) => void;
  onDelete: (p: SavedProblem) => void;
}

function CustomProblemList({ problems, onCreate, onEdit, onDuplicate, onSolve, onDelete }: ListProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, color: '#2c3e50', margin: 0 }}>
          自作問題 ({problems.length})
        </h2>
        <button onClick={onCreate} style={listBtnStyle('primary')}>＋ 新規作成</button>
      </div>

      {problems.length === 0 ? (
        <div style={{
          padding: 32, textAlign: 'center', color: '#7f8c8d',
          background: '#f8f9fa', borderRadius: 8, border: '1px dashed #bdc3c7',
        }}>
          まだ保存された問題はありません。<br />
          「＋ 新規作成」から問題を作成してみましょう。
        </div>
      ) : (
        problems.map(p => (
          <ProblemCard
            key={p.id}
            problem={p}
            onSolve={() => onSolve(p)}
            onEdit={() => onEdit(p)}
            onDuplicate={() => onDuplicate(p)}
            onDelete={() => onDelete(p)}
          />
        ))
      )}
    </div>
  );
}

function ProblemCard({ problem, onSolve, onEdit, onDuplicate, onDelete }: {
  problem: SavedProblem;
  onSolve: () => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  // Try to compute summary
  const answer = useMemo(() => {
    try {
      return calculateScore(problem.closedTiles, problem.openMelds, problem.condition);
    } catch {
      return null;
    }
  }, [problem]);

  const isDealer = problem.condition.seatWind === 1;
  const agariType = problem.condition.agariType;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
      padding: 12, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 }}>
            📝 {problem.name || '(無題)'}
          </div>
          {answer ? (
            <div style={{ fontSize: 13, color: '#5d6d7e' }}>
              <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>{answer.scoreString}</span>
              {' '}
              {answer.han}翻{answer.fu}符 /
              {isDealer ? ' 親' : ' 子'}{agariType === 'tsumo' ? 'ツモ' : 'ロン'}
              <br />
              <span style={{ color: '#7f8c8d', fontSize: 12 }}>
                {answer.yaku.map(y => y.name).join('・')}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#c0392b' }}>役なし / 計算不可</div>
          )}
          <div style={{ fontSize: 11, color: '#95a5a6', marginTop: 4 }}>
            {formatDate(problem.createdAt)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <button onClick={onSolve} style={listBtnStyle('primary')} disabled={!answer}>▶ 解く</button>
        <button onClick={onEdit} style={listBtnStyle('secondary')}>✏ 編集</button>
        <button onClick={onDuplicate} style={listBtnStyle('secondary')}>📋 複製</button>
        <button onClick={onDelete} style={listBtnStyle('danger')}>🗑 削除</button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

function listBtnStyle(variant: 'primary' | 'secondary' | 'danger'): React.CSSProperties {
  const colors = {
    primary: { bg: '#3498db', color: '#fff' },
    secondary: { bg: '#ecf0f1', color: '#34495e' },
    danger: { bg: '#fff', color: '#e74c3c', border: '1px solid #e74c3c' },
  }[variant];
  return {
    padding: '6px 12px', fontSize: 13, fontWeight: 'bold',
    background: colors.bg, color: colors.color,
    border: 'border' in colors ? colors.border : 'none',
    borderRadius: 4, cursor: 'pointer',
  };
}

// =========================================================================
// Editor view
// =========================================================================

const defaultConditionFields: Omit<AgariCondition, 'agariTile'> = {
  agariType: 'ron',
  seatWind: 1,
  roundWind: 1,
  isRiichi: false,
  isDoubleRiichi: false,
  isIppatsu: false,
  isRinshan: false,
  isChankan: false,
  isHaitei: false,
  isHoutei: false,
  isTenhou: false,
  isChihou: false,
  doraCount: 0,
  uraDoraCount: 0,
  redDoraCount: 0,
};

const dummyTile: Tile = { suit: 'm', num: 1 };

interface EditorProps {
  initial: SavedProblem | null;
  onCancel: () => void;
  onSaved: () => void;
  onSolve: (p: SavedProblem) => void;
}

function CustomProblemEditor({ initial, onCancel, onSaved, onSolve }: EditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [closedTiles, setClosedTiles] = useState<Tile[]>(initial?.closedTiles ?? []);
  const [openMelds, setOpenMelds] = useState<Mentsu[]>(initial?.openMelds ?? []);
  const [conditionFields, setConditionFields] = useState<Omit<AgariCondition, 'agariTile'>>(
    initial
      ? (() => {
          const { agariTile: _omit, ...rest } = initial.condition;
          return rest;
        })()
      : defaultConditionFields
  );
  const [agariTileIndex, setAgariTileIndex] = useState<number | null>(() => {
    if (!initial) return null;
    const at = initial.condition.agariTile;
    return initial.closedTiles.findIndex(t => t.suit === at.suit && t.num === at.num);
  });
  const [calcResult, setCalcResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tileCounts = useMemo(() => {
    const counts = new Map<string, number>();
    closedTiles.forEach(t => {
      const k = `${t.suit}${t.num}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    openMelds.forEach(m => m.tiles.forEach(t => {
      const k = `${t.suit}${t.num}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }));
    return counts;
  }, [closedTiles, openMelds]);

  const totalTiles = closedTiles.length + openMelds.reduce((s, m) => s + m.tiles.length, 0);

  const handleAddTile = (tile: Tile) => {
    if (totalTiles >= 14) return;
    setClosedTiles(prev => [...prev, tile]);
    setError(null);
    setCalcResult(null);
  };

  const handleRemoveTile = (idx: number) => {
    setClosedTiles(prev => prev.filter((_, i) => i !== idx));
    if (agariTileIndex === idx) setAgariTileIndex(null);
    else if (agariTileIndex !== null && agariTileIndex > idx) {
      setAgariTileIndex(agariTileIndex - 1);
    }
    setError(null);
    setCalcResult(null);
  };

  const handleAddMeld = (meld: Mentsu) => {
    if (totalTiles + meld.tiles.length > 14) return;
    setOpenMelds(prev => [...prev, meld]);
    setError(null);
    setCalcResult(null);
  };

  const handleRemoveMeld = (idx: number) => {
    setOpenMelds(prev => prev.filter((_, i) => i !== idx));
    setError(null);
    setCalcResult(null);
  };

  const buildCondition = (): AgariCondition | null => {
    if (agariTileIndex === null) return null;
    const agariTile = closedTiles[agariTileIndex];
    if (!agariTile) return null;
    return { ...conditionFields, agariTile };
  };

  const validate = (): { ok: false; error: string } | { ok: true; condition: AgariCondition } => {
    if (totalTiles !== 14) {
      return { ok: false, error: `手牌が14枚揃っていません (現在: ${totalTiles}枚)` };
    }
    if (agariTileIndex === null) {
      return { ok: false, error: '門前手牌から「アガリ牌」を1つ指定してください' };
    }
    const condition = buildCondition();
    if (!condition) {
      return { ok: false, error: 'アガリ牌が指定されていません' };
    }
    return { ok: true, condition };
  };

  const handleCalculate = () => {
    setCalcResult(null);
    const v = validate();
    if (!v.ok) {
      setError(v.error);
      return;
    }
    const result = calculateScore(closedTiles, openMelds, v.condition);
    if (!result) {
      setError('役がありません。この手牌・条件ではアガれません。');
      return;
    }
    setError(null);
    setCalcResult(result);
  };

  const handleSave = (alsoSolve: boolean) => {
    const v = validate();
    if (!v.ok) {
      setError(v.error);
      return;
    }
    if (!name.trim()) {
      setError('問題名を入力してください');
      return;
    }
    const result = calculateScore(closedTiles, openMelds, v.condition);
    if (!result) {
      setError('役がありません。役のある手牌のみ保存できます。');
      return;
    }
    const now = new Date().toISOString();
    const saved: SavedProblem = {
      id: initial?.id || generateId(),
      name: name.trim(),
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      closedTiles,
      openMelds,
      condition: v.condition,
    };
    saveProblem(saved);
    if (alsoSolve) {
      onSolve(saved);
    } else {
      onSaved();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, color: '#2c3e50', margin: 0 }}>
          {initial ? '問題を編集' : '新規問題作成'}
        </h2>
        <button onClick={onCancel} style={listBtnStyle('secondary')}>← 一覧に戻る</button>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>問題名</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例: ピンフ三色テスト"
          style={{
            width: '100%', padding: '8px 10px', fontSize: 14,
            border: '1px solid #bdc3c7', borderRadius: 4, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tile palette */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
          牌パレット（クリックで手牌に追加）
        </div>
        <TilePalette onSelect={handleAddTile} tileCounts={tileCounts} />
      </div>

      {/* Hand display */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <HandDisplay
          closedTiles={closedTiles}
          openMelds={openMelds}
          agariTileIndex={agariTileIndex}
          onRemoveTile={handleRemoveTile}
          onSetAgariTile={setAgariTileIndex}
          onRemoveMeld={handleRemoveMeld}
        />
      </div>

      {/* Meld input */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <MeldInput
          onAddMeld={handleAddMeld}
          tileCounts={tileCounts}
        />
      </div>

      {/* Condition */}
      <ConditionInput
        condition={{ ...conditionFields, agariTile: dummyTile }}
        onChange={(c) => {
          const { agariTile: _omit, ...rest } = c;
          setConditionFields(rest);
          setError(null);
          setCalcResult(null);
        }}
      />

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={handleCalculate} style={{
          flex: '1 1 30%', padding: '12px', fontSize: 15, fontWeight: 'bold',
          background: '#95a5a6', color: '#fff', border: 'none', borderRadius: 6,
          cursor: 'pointer',
        }}>
          🔍 計算してみる
        </button>
        <button onClick={() => handleSave(false)} style={{
          flex: '1 1 30%', padding: '12px', fontSize: 15, fontWeight: 'bold',
          background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6,
          cursor: 'pointer',
        }}>
          💾 保存
        </button>
        <button onClick={() => handleSave(true)} style={{
          flex: '1 1 30%', padding: '12px', fontSize: 15, fontWeight: 'bold',
          background: '#3498db', color: '#fff', border: 'none', borderRadius: 6,
          cursor: 'pointer',
        }}>
          💾 保存して解く
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fdf2f2', border: '1px solid #e74c3c',
          borderRadius: 6, padding: 12, color: '#c0392b', fontSize: 14, marginBottom: 14,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Calc result */}
      {calcResult && !error && (
        <div style={{
          background: '#f0fff4', border: '1px solid #27ae60',
          borderRadius: 6, padding: 16, marginBottom: 14,
        }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#27ae60', marginBottom: 8 }}>
            ✓ 計算結果
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#2c3e50' }}>
            {calcResult.scoreString}
          </div>
          <div style={{ fontSize: 16, color: '#e67e22', fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
            {calcResult.payments}
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#7f8c8d', marginBottom: 10 }}>
            {calcResult.han}翻 / {calcResult.fu}符（繰り上がり前: {calcResult.rawFu}）/
            {calcResult.isDealer ? ' 親' : ' 子'} / {calcResult.agariType === 'tsumo' ? 'ツモ' : 'ロン'}
          </div>
          <div style={{ fontSize: 13, color: '#2c3e50' }}>
            <b>役:</b> {calcResult.yaku.map(y => `${y.name}(${y.han})`).join(' / ')}
          </div>
        </div>
      )}
    </div>
  );
}
