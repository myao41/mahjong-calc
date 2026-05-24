import type { Tile, HandDecomposition, AgariCondition, ScoreResult, Mentsu, FuCalculation } from '../types';
import { decomposeHand, isChiitoitsu, isKokushi } from './hand';
import { detectYaku } from './yaku';
import { calculateFuDetailed } from './fu';

export function calcBaseScore(han: number, fu: number, yakumanCount: number): number {
  if (yakumanCount > 0) return 8000 * yakumanCount;
  // M-League: 数え役満なし。13翻以上の通常役は三倍満で止まる。
  if (han >= 11) return 6000;
  if (han >= 8) return 4000;
  if (han >= 6) return 3000;
  if (han >= 5) return 2000;

  const base = fu * Math.pow(2, han + 2);
  // 切り上げ満貫: 30符4翻 (=1920), 60符3翻 (=1920) など
  if (base >= 1920) return 2000;
  return base;
}

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

function scoreName(han: number, fu: number, yakumanCount: number): string {
  if (yakumanCount >= 3) return 'トリプル役満';
  if (yakumanCount === 2) return 'ダブル役満';
  if (yakumanCount === 1) return '役満';
  if (han >= 11) return '三倍満';
  if (han >= 8) return '倍満';
  if (han >= 6) return '跳満';
  if (han >= 5) return '満貫';
  if (fu * Math.pow(2, han + 2) >= 1920) return '満貫';
  return `${han}翻${fu}符`;
}

function formatPayments(
  baseScore: number,
  isDealer: boolean,
  agariType: 'tsumo' | 'ron'
): string {
  if (agariType === 'ron') {
    if (isDealer) return `${roundUp100(baseScore * 6)}点`;
    return `${roundUp100(baseScore * 4)}点`;
  }
  if (isDealer) {
    const each = roundUp100(baseScore * 2);
    return `${each}点 オール`;
  }
  const fromChild = roundUp100(baseScore);
  const fromDealer = roundUp100(baseScore * 2);
  return `${fromChild}/${fromDealer}点`;
}

function totalScore(
  baseScore: number,
  isDealer: boolean,
  agariType: 'tsumo' | 'ron'
): number {
  if (agariType === 'ron') {
    if (isDealer) return roundUp100(baseScore * 6);
    return roundUp100(baseScore * 4);
  }
  if (isDealer) return roundUp100(baseScore * 2) * 3;
  return roundUp100(baseScore) * 2 + roundUp100(baseScore * 2);
}

function buildResult(
  han: number,
  fuCalc: FuCalculation,
  isDealer: boolean,
  agariType: 'tsumo' | 'ron',
  yaku: import('../types').Yaku[],
): ScoreResult {
  const fu = fuCalc.roundedTotal;
  const yakumanCount = yaku.filter(y => y.isYakuman).length;
  const base = calcBaseScore(han, fu, yakumanCount);

  const result: ScoreResult = {
    yaku,
    han,
    fu,
    rawFu: fuCalc.rawTotal,
    fuCalc,
    baseScore: base,
    isDealer,
    agariType,
    scoreString: scoreName(han, fu, yakumanCount),
    payments: formatPayments(base, isDealer, agariType),
  };

  if (agariType === 'ron') {
    result.ronPayment = isDealer ? roundUp100(base * 6) : roundUp100(base * 4);
  } else if (isDealer) {
    result.tsumoAllPayment = roundUp100(base * 2);
  } else {
    result.tsumoChildPayment = roundUp100(base);
    result.tsumoDealerPayment = roundUp100(base * 2);
  }

  return result;
}

export function calculateScore(
  closedTiles: Tile[],
  openMelds: Mentsu[],
  condition: AgariCondition
): ScoreResult | null {
  const chiitoi = openMelds.length === 0 && isChiitoitsu(closedTiles);
  const kokushi = openMelds.length === 0 && isKokushi(closedTiles);
  const isDealer = condition.seatWind === 1;

  let bestResult: ScoreResult | null = null;

  if (kokushi) {
    const emptyDecomp: HandDecomposition = {
      mentsu: [],
      jantai: { tiles: [condition.agariTile, condition.agariTile] }
    };
    const yakuList = detectYaku(emptyDecomp, condition, false, true);
    if (yakuList.some(y => y.isYakuman)) {
      const han = yakuList.reduce((sum, y) => sum + y.han, 0);
      const fuCalc: FuCalculation = {
        details: [{ name: '国士無双', fu: 0 }],
        rawTotal: 0,
        roundedTotal: 0,
        waitType: 'tanki',
      };
      return buildResult(han, fuCalc, isDealer, condition.agariType, yakuList);
    }
  }

  if (chiitoi) {
    const emptyDecomp: HandDecomposition = {
      mentsu: [],
      jantai: { tiles: [closedTiles[0], closedTiles[0]] }
    };
    const yakuList = detectYaku(emptyDecomp, condition, true, false, closedTiles);
    if (yakuList.length > 0) {
      const han = yakuList.reduce((sum, y) => sum + y.han, 0);
      if (han > 0) {
        const fuCalc: FuCalculation = {
          details: [{ name: '七対子', fu: 25 }],
          rawTotal: 25,
          roundedTotal: 25,
          waitType: 'tanki',
        };
        const result = buildResult(han, fuCalc, isDealer, condition.agariType, yakuList);
        const ts = totalScore(result.baseScore, isDealer, condition.agariType);
        if (!bestResult || ts > totalScore((bestResult as ScoreResult).baseScore, isDealer, condition.agariType)) {
          bestResult = result;
        }
      }
    }
  }

  const decomps = decomposeHand(closedTiles);

  for (const d of decomps) {
    const fullDecomp: HandDecomposition = {
      mentsu: [...d.mentsu, ...openMelds],
      jantai: d.jantai,
    };

    const yakuList = detectYaku(fullDecomp, condition, false, false);
    const nonDoraYaku = yakuList.filter(y => !y.name.includes('ドラ'));
    if (nonDoraYaku.length === 0) continue;

    const isPinfu = yakuList.some(y => y.name === '平和');
    const fuCalc = calculateFuDetailed(fullDecomp, condition, false, isPinfu);
    const han = yakuList.reduce((sum, y) => sum + y.han, 0);
    const result = buildResult(han, fuCalc, isDealer, condition.agariType, yakuList);
    const ts = totalScore(result.baseScore, isDealer, condition.agariType);

    if (!bestResult || ts > totalScore(bestResult.baseScore, isDealer, condition.agariType)) {
      bestResult = result;
    }
  }

  return bestResult;
}
