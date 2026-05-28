import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Tile, Mentsu, AgariCondition, AgariType, Wind, QuizQuestion, ScoreResult, Suit } from '../types';
import { TilePalette } from '../components/TilePalette';
import { HandDisplay } from '../components/HandDisplay';
import { TileButton } from '../components/TileButton';
import { QuizSolver } from '../components/QuizSolver';
import { calculateScore } from '../utils/score';
import { recordQuizAnswer } from '../utils/learningLog';
import { sortTiles } from '../utils/tiles';
import { generateFromYaku } from '../utils/quiz';
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
  | { type: 'solve'; problem: SavedProblem }
  | { type: 'generate' };

export function CustomProblemPage() {
  const [view, setView] = useState<View>({ type: 'list' });
  const [problems, setProblems] = useState<SavedProblem[]>([]);

  useEffect(() => {
    setProblems(loadProblems());
  }, []);

  const refresh = useCallback(() => {
    setProblems(loadProblems());
  }, []);

  if (view.type === 'generate') {
    return (
      <YakuGenerator
        onGenerated={(p) => setView({ type: 'editor', initial: p })}
        onCancel={() => setView({ type: 'list' })}
      />
    );
  }

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
          recordQuizAnswer(question, user, 'custom', undefined, view.problem.id);
        }}
      />
    );
  }

  // list view
  return (
    <CustomProblemList
      problems={problems}
      onCreate={() => setView({ type: 'editor', initial: null })}
      onGenerate={() => setView({ type: 'generate' })}
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
  onGenerate: () => void;
  onEdit: (p: SavedProblem) => void;
  onDuplicate: (p: SavedProblem) => void;
  onSolve: (p: SavedProblem) => void;
  onDelete: (p: SavedProblem) => void;
}

function CustomProblemList({ problems, onCreate, onGenerate, onEdit, onDuplicate, onSolve, onDelete }: ListProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: 18, color: '#2c3e50', margin: 0 }}>
          自作問題 ({problems.length})
        </h2>
        <button onClick={onCreate} style={listBtnStyle('primary')}>＋ 新規作成</button>
      </div>

      <button
        onClick={onGenerate}
        style={{
          width: '100%', padding: '10px 14px', marginBottom: 16,
          borderRadius: 6, border: '1px solid #a5d6a7',
          background: '#e8f5e9', cursor: 'pointer',
          fontSize: 14, fontWeight: 'bold', color: '#2e7d32',
        }}
      >
        🎲 役から自動生成
      </button>

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

type BuildMode = 'normal' | 'chi' | 'pon' | 'minkan' | 'ankan';

const WIND_NAMES = ['', '東', '南', '西', '北'];

interface EditorProps {
  initial: SavedProblem | null;
  onCancel: () => void;
  onSaved: () => void;
  onSolve: (p: SavedProblem) => void;
}

function CustomProblemEditor({ initial, onCancel, onSaved, onSolve }: EditorProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [closedTiles, setClosedTiles] = useState<Tile[]>(
    initial ? sortTiles(initial.closedTiles) : []
  );
  const [openMelds, setOpenMelds] = useState<Mentsu[]>(initial?.openMelds ?? []);

  // 簡素化された条件: ツモ/ロン、場風、自風、立直、ダブル立直、一発のみ
  const [agariType, setAgariType] = useState<AgariType>(initial?.condition.agariType ?? 'ron');
  const [roundWind, setRoundWind] = useState<Wind>(initial?.condition.roundWind ?? 1);
  const [seatWind, setSeatWind] = useState<Wind>(initial?.condition.seatWind ?? 1);
  const [isRiichi, setIsRiichi] = useState(initial?.condition.isRiichi ?? false);
  const [isDoubleRiichi, setIsDoubleRiichi] = useState(initial?.condition.isDoubleRiichi ?? false);
  const [isIppatsu, setIsIppatsu] = useState(initial?.condition.isIppatsu ?? false);
  const [isHaitei, setIsHaitei] = useState(initial?.condition.isHaitei ?? false);
  const [isHoutei, setIsHoutei] = useState(initial?.condition.isHoutei ?? false);
  const [isChankan, setIsChankan] = useState(initial?.condition.isChankan ?? false);
  const [isTenhou, setIsTenhou] = useState(initial?.condition.isTenhou ?? false);
  const [isChihou, setIsChihou] = useState(initial?.condition.isChihou ?? false);
  const [doraCount, setDoraCount] = useState(initial?.condition.doraCount ?? 0);
  const [uraDoraCount, setUraDoraCount] = useState(initial?.condition.uraDoraCount ?? 0);
  const [redDoraCount, setRedDoraCount] = useState(initial?.condition.redDoraCount ?? 0);

  // アガリ牌は最後に追加した牌を自動指定。値ベースで保持。
  const [agariTile, setAgariTileValue] = useState<Tile | null>(
    initial ? initial.condition.agariTile : null
  );

  const [buildMode, setBuildMode] = useState<BuildMode>('normal');
  const [chiOptions, setChiOptions] = useState<{ suit: Suit; starts: number[] } | null>(null);
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
  const numKans = openMelds.filter(m => m.type === 'kantsu').length;
  const expectedTotalTiles = 14 + numKans; // 槓1つにつき+1枚必要

  const resetCalcState = () => {
    setError(null);
    setCalcResult(null);
  };

  const addTileToHand = (tile: Tile) => {
    if (totalTiles >= expectedTotalTiles) return;
    setClosedTiles(prev => sortTiles([...prev, tile]));
    setAgariTileValue(tile);
    resetCalcState();
  };

  const handleRemoveTile = (idx: number) => {
    const removed = closedTiles[idx];
    setClosedTiles(prev => prev.filter((_, i) => i !== idx));
    if (agariTile && removed && agariTile.suit === removed.suit && agariTile.num === removed.num) {
      const remaining = closedTiles.filter((_, i) => i !== idx);
      const stillHas = remaining.some(t => t.suit === agariTile.suit && t.num === agariTile.num);
      if (!stillHas) setAgariTileValue(null);
    }
    resetCalcState();
  };

  const addMeld = (meld: Mentsu) => {
    const isKan = meld.type === 'kantsu';
    const newExpected = 14 + numKans + (isKan ? 1 : 0);
    if (totalTiles + meld.tiles.length > newExpected) return;
    setOpenMelds(prev => [...prev, meld]);
    setBuildMode('normal');
    setChiOptions(null);
    resetCalcState();
  };

  const handleRemoveMeld = (idx: number) => {
    setOpenMelds(prev => prev.filter((_, i) => i !== idx));
    resetCalcState();
  };

  const handlePaletteClick = (tile: Tile) => {
    if (buildMode === 'normal') {
      addTileToHand(tile);
      return;
    }
    if (buildMode === 'chi') {
      const starts: number[] = [];
      for (const start of [tile.num - 2, tile.num - 1, tile.num]) {
        if (start < 1 || start + 2 > 9) continue;
        let canUse = true;
        for (let n = start; n <= start + 2; n++) {
          const u = tileCounts.get(`${tile.suit}${n}`) ?? 0;
          if (u >= 4) { canUse = false; break; }
        }
        if (canUse) starts.push(start);
      }
      if (starts.length === 0) return;
      if (starts.length === 1) {
        const s = starts[0];
        const tiles: Tile[] = [s, s + 1, s + 2].map(n => ({ suit: tile.suit, num: n }));
        addMeld({ type: 'shuntsu', tiles, isOpen: true });
      } else {
        setChiOptions({ suit: tile.suit, starts });
      }
      return;
    }
    if (buildMode === 'pon') {
      addMeld({ type: 'koutsu', tiles: [tile, tile, tile], isOpen: true });
      return;
    }
    if (buildMode === 'minkan') {
      addMeld({ type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: true });
      return;
    }
    if (buildMode === 'ankan') {
      addMeld({ type: 'kantsu', tiles: [tile, tile, tile, tile], isOpen: false });
      return;
    }
  };

  const paletteDisabled = (tile: Tile): boolean => {
    const used = tileCounts.get(`${tile.suit}${tile.num}`) ?? 0;
    if (buildMode === 'normal') {
      return used >= 4 || totalTiles >= expectedTotalTiles;
    }
    if (buildMode === 'chi') {
      if (tile.suit === 'z') return true;
      for (const start of [tile.num - 2, tile.num - 1, tile.num]) {
        if (start < 1 || start + 2 > 9) continue;
        let canUse = true;
        for (let n = start; n <= start + 2; n++) {
          const u = tileCounts.get(`${tile.suit}${n}`) ?? 0;
          if (u >= 4) { canUse = false; break; }
        }
        if (canUse) return totalTiles + 3 > expectedTotalTiles;
      }
      return true;
    }
    if (buildMode === 'pon') {
      return used + 3 > 4 || totalTiles + 3 > expectedTotalTiles;
    }
    if (buildMode === 'minkan' || buildMode === 'ankan') {
      // 槓を追加すると expectedTotalTiles も +1 されるので合計4枚追加できる
      return used + 4 > 4 || totalTiles + 4 > expectedTotalTiles + 1;
    }
    return false;
  };

  const buildCondition = (): AgariCondition | null => {
    if (!agariTile) return null;
    return {
      agariType, agariTile, roundWind, seatWind,
      isRiichi, isDoubleRiichi, isIppatsu,
      isRinshan: false, isChankan,
      isHaitei, isHoutei,
      isTenhou, isChihou,
      doraCount, uraDoraCount, redDoraCount,
    };
  };

  const validate = (): { ok: false; error: string } | { ok: true; condition: AgariCondition } => {
    if (totalTiles !== expectedTotalTiles) {
      return {
        ok: false,
        error: `手牌の枚数が正しくありません (現在: ${totalTiles}枚, 必要: ${expectedTotalTiles}枚${numKans > 0 ? `、槓${numKans}つにつき+1枚` : ''})`,
      };
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
    if (alsoSolve) onSolve(saved);
    else onSaved();
  };

  const isDealer = seatWind === 1;
  const buildModeLabel: Record<BuildMode, string> = {
    normal: '',
    chi: 'チー（順子）の起点をパレットから選択',
    pon: 'ポン（刻子）の牌をパレットから選択',
    minkan: '明槓の牌をパレットから選択',
    ankan: '暗槓の牌をパレットから選択',
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

      {/* Hand display */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <HandDisplay
          closedTiles={closedTiles}
          openMelds={openMelds}
          agariTile={agariTile}
          onRemoveTile={handleRemoveTile}
          onSetAgariTile={(tile) => { setAgariTileValue(tile); resetCalcState(); }}
          onRemoveMeld={handleRemoveMeld}
        />
      </div>

      {/* 副露ビルドモードボタン */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
          副露追加 <span style={{ fontSize: 12, color: '#7f8c8d', fontWeight: 'normal' }}>
            (タイプを選択→パレットから牌を選択)
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['chi', 'pon', 'minkan', 'ankan'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setBuildMode(buildMode === m ? 'normal' : m); setChiOptions(null); }}
              style={meldBtnStyle(buildMode === m)}
            >
              {m === 'chi' ? 'チー' : m === 'pon' ? 'ポン' : m === 'minkan' ? '明槓' : '暗槓'}
            </button>
          ))}
          {buildMode !== 'normal' && (
            <button
              onClick={() => { setBuildMode('normal'); setChiOptions(null); }}
              style={{
                padding: '8px 14px', fontSize: 13,
                background: '#ecf0f1', color: '#34495e',
                border: '1px solid #bdc3c7', borderRadius: 4, cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
          )}
        </div>
        {buildMode !== 'normal' && !chiOptions && (
          <div style={{
            marginTop: 8, padding: '6px 10px',
            background: '#fff8e1', borderRadius: 4,
            fontSize: 12, color: '#5d4037',
          }}>
            💡 {buildModeLabel[buildMode]}
          </div>
        )}
        {chiOptions && (
          <div style={{ marginTop: 10, padding: 10, background: '#e3f2fd', borderRadius: 4 }}>
            <div style={{ fontSize: 12, marginBottom: 6, color: '#1565c0' }}>順子の組み合わせを選択:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {chiOptions.starts.map(start => {
                const tiles: Tile[] = [start, start + 1, start + 2].map(n => ({ suit: chiOptions.suit, num: n }));
                return (
                  <button
                    key={start}
                    onClick={() => addMeld({ type: 'shuntsu', tiles, isOpen: true })}
                    style={{
                      display: 'flex', gap: 0, padding: 4,
                      background: '#fff', border: '1px solid #90caf9',
                      borderRadius: 4, cursor: 'pointer', alignItems: 'center',
                    }}
                  >
                    {tiles.map((t, i) => <TileButton key={i} tile={t} size="small" />)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 牌パレット */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
          {buildMode === 'normal' ? '牌パレット（クリックで手牌に追加）' : '牌パレット（副露用に1枚選択）'}
        </div>
        <TilePalette
          onSelect={handlePaletteClick}
          tileCounts={tileCounts}
          size="normal"
          isDisabled={paletteDisabled}
        />
      </div>

      {/* 和了条件 */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>和了条件</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#7f8c8d', marginBottom: 4 }}>アガリ方</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['ron', 'tsumo'] as const).map(at => (
              <button
                key={at}
                onClick={() => { setAgariType(at); resetCalcState(); }}
                style={toggleBtnStyle(agariType === at)}
              >
                {at === 'tsumo' ? 'ツモ' : 'ロン'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#7f8c8d', marginBottom: 4 }}>場風</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([1, 2, 3, 4] as Wind[]).map(w => (
              <button
                key={w}
                onClick={() => { setRoundWind(w); resetCalcState(); }}
                style={toggleBtnStyle(roundWind === w)}
              >
                {WIND_NAMES[w]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#7f8c8d', marginBottom: 4 }}>
            自風 {isDealer && <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>（親）</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([1, 2, 3, 4] as Wind[]).map(w => (
              <button
                key={w}
                onClick={() => { setSeatWind(w); resetCalcState(); }}
                style={toggleBtnStyle(seatWind === w)}
              >
                {WIND_NAMES[w]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#7f8c8d', marginBottom: 4 }}>特殊条件</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const next = !isRiichi;
                setIsRiichi(next);
                if (next) setIsDoubleRiichi(false);
                else setIsIppatsu(false);
                resetCalcState();
              }}
              style={toggleBtnStyle(isRiichi)}
            >
              立直
            </button>
            <button
              onClick={() => {
                const next = !isDoubleRiichi;
                setIsDoubleRiichi(next);
                if (next) setIsRiichi(false);
                else setIsIppatsu(false);
                resetCalcState();
              }}
              style={toggleBtnStyle(isDoubleRiichi)}
            >
              W立直
            </button>
            <button
              onClick={() => {
                if (isRiichi || isDoubleRiichi) {
                  setIsIppatsu(!isIppatsu);
                  resetCalcState();
                }
              }}
              style={{
                ...toggleBtnStyle(isIppatsu),
                opacity: (isRiichi || isDoubleRiichi) ? 1 : 0.35,
                cursor: (isRiichi || isDoubleRiichi) ? 'pointer' : 'default',
              }}
            >
              一発
            </button>
            <button
              onClick={() => {
                if (agariType === 'tsumo') {
                  setIsHaitei(!isHaitei);
                  if (!isHaitei) setIsHoutei(false);
                  resetCalcState();
                }
              }}
              style={{
                ...toggleBtnStyle(isHaitei),
                opacity: agariType === 'tsumo' ? 1 : 0.35,
                cursor: agariType === 'tsumo' ? 'pointer' : 'default',
              }}
            >
              海底
            </button>
            <button
              onClick={() => {
                if (agariType === 'ron') {
                  setIsHoutei(!isHoutei);
                  if (!isHoutei) setIsHaitei(false);
                  resetCalcState();
                }
              }}
              style={{
                ...toggleBtnStyle(isHoutei),
                opacity: agariType === 'ron' ? 1 : 0.35,
                cursor: agariType === 'ron' ? 'pointer' : 'default',
              }}
            >
              河底
            </button>
            <button
              onClick={() => {
                if (agariType === 'ron') {
                  setIsChankan(!isChankan);
                  resetCalcState();
                }
              }}
              style={{
                ...toggleBtnStyle(isChankan),
                opacity: agariType === 'ron' ? 1 : 0.35,
                cursor: agariType === 'ron' ? 'pointer' : 'default',
              }}
            >
              槍槓
            </button>
            <button
              onClick={() => {
                setIsTenhou(!isTenhou);
                if (!isTenhou) setIsChihou(false);
                resetCalcState();
              }}
              style={toggleBtnStyle(isTenhou)}
            >
              天和
            </button>
            <button
              onClick={() => {
                setIsChihou(!isChihou);
                if (!isChihou) setIsTenhou(false);
                resetCalcState();
              }}
              style={toggleBtnStyle(isChihou)}
            >
              地和
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#7f8c8d', marginBottom: 4 }}>ドラ</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              ドラ
              <select
                value={doraCount}
                onChange={e => { setDoraCount(Number(e.target.value)); resetCalcState(); }}
                style={{ padding: '4px 8px', fontSize: 14, borderRadius: 4, border: '1px solid #bdc3c7' }}
              >
                {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              裏ドラ
              <select
                value={uraDoraCount}
                onChange={e => { setUraDoraCount(Number(e.target.value)); resetCalcState(); }}
                style={{
                  padding: '4px 8px', fontSize: 14, borderRadius: 4, border: '1px solid #bdc3c7',
                  opacity: (isRiichi || isDoubleRiichi) ? 1 : 0.35,
                }}
                disabled={!isRiichi && !isDoubleRiichi}
              >
                {[0,1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              赤ドラ
              <select
                value={redDoraCount}
                onChange={e => { setRedDoraCount(Number(e.target.value)); resetCalcState(); }}
                style={{ padding: '4px 8px', fontSize: 14, borderRadius: 4, border: '1px solid #bdc3c7' }}
              >
                {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={handleCalculate} style={actionBtnStyle('#95a5a6')}>
          🔍 計算してみる
        </button>
        <button onClick={() => handleSave(false)} style={actionBtnStyle('#27ae60')}>
          💾 保存
        </button>
        <button onClick={() => handleSave(true)} style={actionBtnStyle('#3498db')}>
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
            {calcResult.han}翻 / {calcResult.fu}符（テンパネ前: {calcResult.rawFu}）/
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

// =========================================================================
// Yaku generator
// =========================================================================

interface YakuOption {
  label: string;
  strategy: string;
}

interface YakuGroup {
  title: string;
  yaku: YakuOption[];
}

const YAKU_GROUPS: YakuGroup[] = [
  {
    title: '1翻',
    yaku: [
      { label: '断么九', strategy: 'tanyao' },
      { label: '平和', strategy: 'pinfu' },
    ],
  },
  {
    title: '2翻',
    yaku: [
      { label: '七対子', strategy: 'chiitoitsu' },
      { label: '対々和', strategy: 'toitoi' },
      { label: '三色同順', strategy: 'sanshoku' },
      { label: '一気通貫', strategy: 'ittsu' },
      { label: '三暗刻', strategy: 'sananko' },
      { label: '三色同刻', strategy: 'sanshoku_doko' },
      { label: '小三元', strategy: 'shosangen' },
      { label: '混全帯么九', strategy: 'chanta' },
      { label: '混老頭', strategy: 'honroutou' },
    ],
  },
  {
    title: '3翻以上',
    yaku: [
      { label: '混一色', strategy: 'honitsu' },
      { label: '純全帯么九', strategy: 'junchan' },
      { label: '二盃口', strategy: 'ryanpeikou' },
      { label: '清一色', strategy: 'chinitsu' },
      { label: '三槓子', strategy: 'sankantsu' },
    ],
  },
  {
    title: '役満',
    yaku: [
      { label: '国士無双', strategy: 'kokushi' },
      { label: '四暗刻', strategy: 'suuanko' },
      { label: '大三元', strategy: 'daisangen' },
      { label: '字一色', strategy: 'tsuuiiso' },
      { label: '緑一色', strategy: 'ryuuiiso' },
      { label: '清老頭', strategy: 'chinroutou' },
      { label: '大四喜', strategy: 'daisuushii' },
      { label: '小四喜', strategy: 'shousuushii' },
      { label: '九蓮宝燈', strategy: 'chuurenpoutou' },
      { label: '四槓子', strategy: 'suukantsu' },
    ],
  },
];

function YakuGenerator({ onGenerated, onCancel }: {
  onGenerated: (p: SavedProblem) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (yaku: YakuOption) => {
    setError(null);
    const question = generateFromYaku(yaku.strategy);
    if (!question) {
      setError(`「${yaku.label}」の手牌を生成できませんでした。もう一度お試しください。`);
      return;
    }
    const now = new Date().toISOString();
    onGenerated({
      id: '',
      name: yaku.label,
      createdAt: now,
      updatedAt: now,
      closedTiles: question.closedTiles,
      openMelds: question.openMelds,
      condition: question.condition,
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, color: '#2c3e50', margin: 0 }}>役から自動生成</h2>
        <button onClick={onCancel} style={listBtnStyle('secondary')}>← 一覧に戻る</button>
      </div>

      <div style={{
        padding: '10px 14px', marginBottom: 16,
        background: '#e8f5e9', borderRadius: 8, border: '1px solid #a5d6a7',
        fontSize: 13, color: '#2e7d32', lineHeight: 1.6,
      }}>
        練習したい役を選択すると、その役を含む手牌を自動生成します。<br />
        生成後に編集・保存できます。
      </div>

      {YAKU_GROUPS.map(group => (
        <div key={group.title} style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 13, fontWeight: 'bold', color: '#7f8c8d',
            marginBottom: 6, paddingBottom: 4,
            borderBottom: '1px solid #e0e0e0',
          }}>
            {group.title}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {group.yaku.map(y => (
              <button
                key={y.label}
                onClick={() => handleSelect(y)}
                style={{
                  padding: '8px 14px', fontSize: 14,
                  background: '#fff', color: '#2c3e50',
                  border: '1px solid #bdc3c7', borderRadius: 6,
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                {y.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div style={{
          background: '#fdf2f2', border: '1px solid #e74c3c',
          borderRadius: 6, padding: 12, color: '#c0392b',
          fontSize: 14, marginTop: 14,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Editor styling helpers
// =========================================================================

function toggleBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', fontSize: 14, fontWeight: 'bold',
    border: active ? '2px solid #3498db' : '1px solid #bdc3c7',
    background: active ? '#3498db' : '#fff',
    color: active ? '#fff' : '#34495e',
    borderRadius: 4, cursor: 'pointer',
    minWidth: 44,
  };
}

function meldBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', fontSize: 14, fontWeight: 'bold',
    border: active ? '2px solid #e67e22' : '1px solid #bdc3c7',
    background: active ? '#e67e22' : '#fff',
    color: active ? '#fff' : '#34495e',
    borderRadius: 4, cursor: 'pointer',
  };
}

function actionBtnStyle(bg: string): React.CSSProperties {
  return {
    flex: '1 1 30%', padding: '12px', fontSize: 15, fontWeight: 'bold',
    background: bg, color: '#fff', border: 'none', borderRadius: 6,
    cursor: 'pointer',
  };
}

