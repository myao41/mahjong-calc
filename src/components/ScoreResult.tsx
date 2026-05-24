import type { ScoreResult as ScoreResultType } from '../types';

interface Props {
  result: ScoreResultType | null;
  error: string | null;
}

export function ScoreResult({ result, error }: Props) {
  if (error) {
    return (
      <div style={{
        padding: 16, background: '#fdf2f2', border: '1px solid #e74c3c',
        borderRadius: 8, color: '#c0392b', fontSize: 14,
      }}>
        {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div style={{
      padding: 16, background: '#f0fff4', border: '1px solid #27ae60',
      borderRadius: 8,
    }}>
      <div style={{
        fontSize: 28, fontWeight: 'bold', color: '#2c3e50',
        marginBottom: 8, textAlign: 'center',
      }}>
        {result.scoreString}
      </div>

      <div style={{
        fontSize: 22, color: '#e67e22', fontWeight: 'bold',
        textAlign: 'center', marginBottom: 16,
      }}>
        {result.payments}
      </div>

      <div style={{
        fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginBottom: 12,
      }}>
        {result.han}翻 {result.fu > 0 ? `${result.fu}符` : ''}
        {' / '}
        {result.isDealer ? '親' : '子'}
        {' / '}
        {result.agariType === 'tsumo' ? 'ツモ' : 'ロン'}
      </div>

      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>役一覧</div>
        {result.yaku.map((y, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '3px 0', fontSize: 14,
          }}>
            <span style={{ color: y.isYakuman ? '#c0392b' : '#2c3e50' }}>
              {y.name}
            </span>
            <span style={{ color: '#7f8c8d', fontWeight: 'bold' }}>
              {y.isYakuman ? '役満' : `${y.han}翻`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
