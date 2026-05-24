import type { AgariCondition, Wind } from '../types';

interface Props {
  condition: AgariCondition;
  onChange: (condition: AgariCondition) => void;
}

export function ConditionInput({ condition, onChange }: Props) {
  const update = (partial: Partial<AgariCondition>) => {
    onChange({ ...condition, ...partial });
  };

  const toggleStyle = (active: boolean) => ({
    padding: '6px 12px',
    borderRadius: 4,
    border: active ? '2px solid #3498db' : '1px solid #bdc3c7',
    background: active ? '#ebf5fb' : '#fff',
    cursor: 'pointer' as const,
    fontSize: 13,
    fontWeight: active ? 'bold' as const : 'normal' as const,
  });

  const selectStyle = {
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #bdc3c7',
    fontSize: 13,
  };

  const numInputStyle = {
    width: 50,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #bdc3c7',
    fontSize: 13,
    textAlign: 'center' as const,
  };

  return (
    <div style={{
      marginBottom: 16, padding: 12,
      background: '#f8f9fa', borderRadius: 8,
    }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>和了条件</div>

      {/* ツモ/ロン */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          style={toggleStyle(condition.agariType === 'tsumo')}
          onClick={() => update({ agariType: 'tsumo' })}
        >
          ツモ
        </button>
        <button
          style={toggleStyle(condition.agariType === 'ron')}
          onClick={() => update({ agariType: 'ron' })}
        >
          ロン
        </button>
      </div>

      {/* 場風・自風 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          場風:
          <select
            value={condition.roundWind}
            onChange={e => update({ roundWind: Number(e.target.value) as Wind })}
            style={selectStyle}
          >
            <option value={1}>東</option>
            <option value={2}>南</option>
            <option value={3}>西</option>
            <option value={4}>北</option>
          </select>
        </label>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          自風:
          <select
            value={condition.seatWind}
            onChange={e => update({ seatWind: Number(e.target.value) as Wind })}
            style={selectStyle}
          >
            <option value={1}>東</option>
            <option value={2}>南</option>
            <option value={3}>西</option>
            <option value={4}>北</option>
          </select>
        </label>
      </div>

      {/* リーチ系 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'isRiichi', label: '立直' },
          { key: 'isDoubleRiichi', label: 'ダブル立直' },
          { key: 'isIppatsu', label: '一発' },
        ].map(({ key, label }) => (
          <button
            key={key}
            style={toggleStyle(condition[key as keyof AgariCondition] as boolean)}
            onClick={() => {
              const val = !condition[key as keyof AgariCondition];
              const updates: Partial<AgariCondition> = { [key]: val };
              if (key === 'isRiichi' && val) updates.isDoubleRiichi = false;
              if (key === 'isDoubleRiichi' && val) {
                updates.isRiichi = false;
              }
              if (key === 'isIppatsu' && val) {
                if (!condition.isRiichi && !condition.isDoubleRiichi) {
                  updates.isRiichi = true;
                }
              }
              update(updates);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* その他の条件 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'isRinshan', label: '嶺上開花' },
          { key: 'isChankan', label: '槍槓' },
          { key: 'isHaitei', label: '海底摸月' },
          { key: 'isHoutei', label: '河底撈魚' },
          { key: 'isTenhou', label: '天和' },
          { key: 'isChihou', label: '地和' },
        ].map(({ key, label }) => (
          <button
            key={key}
            style={toggleStyle(condition[key as keyof AgariCondition] as boolean)}
            onClick={() => update({
              [key]: !condition[key as keyof AgariCondition],
            })}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ドラ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          ドラ:
          <input
            type="number"
            min={0}
            max={16}
            value={condition.doraCount}
            onChange={e => update({ doraCount: Number(e.target.value) })}
            style={numInputStyle}
          />
        </label>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          裏ドラ:
          <input
            type="number"
            min={0}
            max={16}
            value={condition.uraDoraCount}
            onChange={e => update({ uraDoraCount: Number(e.target.value) })}
            style={numInputStyle}
          />
        </label>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          赤ドラ:
          <input
            type="number"
            min={0}
            max={3}
            value={condition.redDoraCount}
            onChange={e => update({ redDoraCount: Number(e.target.value) })}
            style={numInputStyle}
          />
        </label>
      </div>
    </div>
  );
}
