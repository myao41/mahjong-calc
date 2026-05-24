import type { HandDecomposition, AgariCondition, WaitType, Tile, FuCalculation, FuDetail } from '../types';
import { isTerminalOrHonor } from './tiles';

export function detectWaitType(
  decomp: HandDecomposition,
  agariTile: Tile,
  isChiitoitsu: boolean
): WaitType {
  if (isChiitoitsu) return 'tanki';

  if (agariTile.suit === decomp.jantai.tiles[0].suit &&
      agariTile.num === decomp.jantai.tiles[0].num) {
    return 'tanki';
  }

  for (const m of decomp.mentsu) {
    if (m.type === 'koutsu' || m.type === 'kantsu') {
      if (m.tiles[0].suit === agariTile.suit && m.tiles[0].num === agariTile.num) {
        return 'shanpon';
      }
    }
    if (m.type === 'shuntsu') {
      const nums = m.tiles.map(t => t.num).sort((a, b) => a - b);
      if (m.tiles[0].suit !== agariTile.suit) continue;
      if (!nums.includes(agariTile.num)) continue;

      if (agariTile.num === nums[1]) return 'kanchan';
      if (nums[0] === 1 && agariTile.num === 3) return 'penchan';
      if (nums[2] === 9 && agariTile.num === 7) return 'penchan';
      return 'ryanmen';
    }
  }

  return 'ryanmen';
}

const waitNames: Record<WaitType, string> = {
  ryanmen: '両面待ち',
  shanpon: 'シャボ待ち',
  kanchan: 'カンチャン待ち',
  penchan: 'ペンチャン待ち',
  tanki: '単騎待ち',
};

export function calculateFuDetailed(
  decomp: HandDecomposition,
  condition: AgariCondition,
  isChiitoitsu: boolean,
  isPinfu: boolean,
): FuCalculation {
  if (isChiitoitsu) {
    return {
      details: [{ name: '七対子', fu: 25 }],
      rawTotal: 25,
      roundedTotal: 25,
      waitType: 'tanki',
    };
  }

  if (isPinfu && condition.agariType === 'tsumo') {
    return {
      details: [{ name: 'ピンフツモ', fu: 20 }],
      rawTotal: 20,
      roundedTotal: 20,
      waitType: 'ryanmen',
    };
  }

  const details: FuDetail[] = [];
  let fu = 20;
  details.push({ name: '副底', fu: 20 });

  const menzen = decomp.mentsu.every(m => !m.isOpen);
  if (menzen && condition.agariType === 'ron') {
    details.push({ name: '門前ロン', fu: 10 });
    fu += 10;
  }

  if (condition.agariType === 'tsumo' && !isPinfu) {
    details.push({ name: 'ツモ', fu: 2 });
    fu += 2;
  }

  for (const m of decomp.mentsu) {
    const tile = m.tiles[0];
    const isYaochu = isTerminalOrHonor(tile);
    const tileLabel = tileDesc(tile);

    if (m.type === 'koutsu') {
      let mentsuFu = isYaochu ? 4 : 2;
      if (!m.isOpen) mentsuFu *= 2;
      const label = `${m.isOpen ? '明' : '暗'}刻（${tileLabel}）`;
      details.push({ name: label, fu: mentsuFu });
      fu += mentsuFu;
    } else if (m.type === 'kantsu') {
      let mentsuFu = isYaochu ? 16 : 8;
      if (!m.isOpen) mentsuFu *= 2;
      const label = `${m.isOpen ? '明' : '暗'}槓（${tileLabel}）`;
      details.push({ name: label, fu: mentsuFu });
      fu += mentsuFu;
    }
  }

  const jt = decomp.jantai.tiles[0];
  if (jt.suit === 'z') {
    if (jt.num >= 5) {
      const names = ['', '', '', '', '', '白', '發', '中'];
      details.push({ name: `雀頭（${names[jt.num]}）`, fu: 2 });
      fu += 2;
    } else if (jt.num === condition.roundWind && jt.num === condition.seatWind) {
      details.push({ name: '雀頭（連風牌）', fu: 2 });
      fu += 2;
    } else if (jt.num === condition.roundWind) {
      const windNames = ['', '東', '南', '西', '北'];
      details.push({ name: `雀頭（場風 ${windNames[jt.num]}）`, fu: 2 });
      fu += 2;
    } else if (jt.num === condition.seatWind) {
      const windNames = ['', '東', '南', '西', '北'];
      details.push({ name: `雀頭（自風 ${windNames[jt.num]}）`, fu: 2 });
      fu += 2;
    }
  }

  const waitType = detectWaitType(decomp, condition.agariTile, isChiitoitsu);
  if (waitType === 'kanchan' || waitType === 'penchan' || waitType === 'tanki') {
    details.push({ name: waitNames[waitType], fu: 2 });
    fu += 2;
  }

  const rawTotal = fu;

  if (!menzen && fu === 20) {
    fu = 30;
  }

  const roundedTotal = Math.ceil(fu / 10) * 10;

  return { details, rawTotal, roundedTotal, waitType };
}

function tileDesc(tile: Tile): string {
  if (tile.suit === 'z') {
    const names = ['', '東', '南', '西', '北', '白', '發', '中'];
    return names[tile.num];
  }
  const suitNames: Record<string, string> = { m: '萬', p: '筒', s: '索' };
  const numNames = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return numNames[tile.num] + suitNames[tile.suit];
}
