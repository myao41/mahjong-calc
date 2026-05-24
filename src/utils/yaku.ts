import type { Tile, HandDecomposition, AgariCondition, Yaku, Wind } from '../types';
import { isTerminal, isTerminalOrHonor, isSimple, isGreen } from './tiles';

function allTilesInDecomp(d: HandDecomposition): Tile[] {
  const tiles: Tile[] = [];
  for (const m of d.mentsu) tiles.push(...m.tiles);
  tiles.push(...d.jantai.tiles);
  return tiles;
}

function isMenzen(d: HandDecomposition): boolean {
  return d.mentsu.every(m => !m.isOpen);
}

function isYakuhai(tile: Tile, roundWind: Wind, seatWind: Wind): boolean {
  if (tile.suit !== 'z') return false;
  if (tile.num >= 5) return true; // 白發中
  if (tile.num === roundWind) return true;
  if (tile.num === seatWind) return true;
  return false;
}

function countSuits(tiles: Tile[]): { suits: Set<string>; hasHonor: boolean } {
  const suits = new Set<string>();
  let hasHonor = false;
  for (const t of tiles) {
    if (t.suit === 'z') hasHonor = true;
    else suits.add(t.suit);
  }
  return { suits, hasHonor };
}

export function detectYaku(
  decomp: HandDecomposition,
  condition: AgariCondition,
  isChiitoitsu: boolean,
  isKokushi: boolean,
  overrideTiles?: Tile[],
): Yaku[] {
  const yaku: Yaku[] = [];
  const menzen = isMenzen(decomp);
  const allTiles = overrideTiles ?? allTilesInDecomp(decomp);
  const { suits, hasHonor } = countSuits(allTiles);

  // --- Yakuman ---
  if (isKokushi) {
    yaku.push({ name: '国士無双', han: 13, isYakuman: true });
    return yaku;
  }

  if (condition.isTenhou) {
    yaku.push({ name: '天和', han: 13, isYakuman: true });
    return yaku;
  }
  if (condition.isChihou) {
    yaku.push({ name: '地和', han: 13, isYakuman: true });
    return yaku;
  }

  // 四暗刻
  if (menzen && decomp.mentsu.filter(m => m.type === 'koutsu' || m.type === 'kantsu').length === 4) {
    yaku.push({ name: '四暗刻', han: 13, isYakuman: true });
    return yaku;
  }

  // 大三元
  const sangenpai = [5, 6, 7];
  const sangenMentsu = decomp.mentsu.filter(
    m => (m.type === 'koutsu' || m.type === 'kantsu') && m.tiles[0].suit === 'z' && sangenpai.includes(m.tiles[0].num)
  );
  if (sangenMentsu.length === 3) {
    yaku.push({ name: '大三元', han: 13, isYakuman: true });
    return yaku;
  }

  // 字一色
  if (allTiles.every(t => t.suit === 'z')) {
    yaku.push({ name: '字一色', han: 13, isYakuman: true });
    return yaku;
  }

  // 緑一色
  if (allTiles.every(t => isGreen(t))) {
    yaku.push({ name: '緑一色', han: 13, isYakuman: true });
    return yaku;
  }

  // 清老頭
  if (allTiles.every(t => isTerminal(t))) {
    yaku.push({ name: '清老頭', han: 13, isYakuman: true });
    return yaku;
  }

  // 四喜和
  const windMentsu = decomp.mentsu.filter(
    m => (m.type === 'koutsu' || m.type === 'kantsu') && m.tiles[0].suit === 'z' && m.tiles[0].num <= 4
  );
  const windJantai = decomp.jantai.tiles[0].suit === 'z' && decomp.jantai.tiles[0].num <= 4;
  if (windMentsu.length === 4) {
    yaku.push({ name: '大四喜', han: 13, isYakuman: true });
    return yaku;
  }
  if (windMentsu.length === 3 && windJantai) {
    yaku.push({ name: '小四喜', han: 13, isYakuman: true });
    return yaku;
  }

  // 九蓮宝燈
  if (menzen && suits.size === 1 && !hasHonor) {
    const suit = allTiles[0].suit;
    const counts = new Map<number, number>();
    for (const t of allTiles) {
      if (t.suit === suit) counts.set(t.num, (counts.get(t.num) || 0) + 1);
    }
    const req = [3, 1, 1, 1, 1, 1, 1, 1, 3];
    let isChuren = true;
    for (let i = 1; i <= 9; i++) {
      if ((counts.get(i) || 0) < req[i - 1]) { isChuren = false; break; }
    }
    if (isChuren) {
      yaku.push({ name: '九蓮宝燈', han: 13, isYakuman: true });
      return yaku;
    }
  }

  // 四槓子
  if (decomp.mentsu.filter(m => m.type === 'kantsu').length === 4) {
    yaku.push({ name: '四槓子', han: 13, isYakuman: true });
    return yaku;
  }

  // --- Regular yaku ---

  // リーチ
  if (condition.isDoubleRiichi) {
    yaku.push({ name: 'ダブル立直', han: 2 });
  } else if (condition.isRiichi) {
    yaku.push({ name: '立直', han: 1 });
  }

  // 一発
  if (condition.isIppatsu) {
    yaku.push({ name: '一発', han: 1 });
  }

  // 門前清自摸和
  if (menzen && condition.agariType === 'tsumo') {
    yaku.push({ name: '門前清自摸和', han: 1 });
  }

  // タンヤオ (喰いタンあり in M-League)
  if (allTiles.every(t => isSimple(t))) {
    yaku.push({ name: '断么九', han: 1 });
  }

  // ピンフ
  if (menzen && !isChiitoitsu) {
    const allShuntsu = decomp.mentsu.every(m => m.type === 'shuntsu');
    const jt = decomp.jantai.tiles[0];
    const notYakuhai = !isYakuhai(jt, condition.roundWind, condition.seatWind);
    if (allShuntsu && notYakuhai) {
      // Check for ryanmen wait
      const agari = condition.agariTile;
      const hasRyanmen = decomp.mentsu.some(m => {
        if (m.type !== 'shuntsu') return false;
        const nums = m.tiles.map(t => t.num).sort((a, b) => a - b);
        if (m.tiles[0].suit !== agari.suit) return false;
        // agari is first tile and it's not 7,8,9 start → ryanmen left
        if (agari.num === nums[0] && nums[0] !== 7) return true;
        // agari is last tile and it's not 1,2,3 end → ryanmen right
        if (agari.num === nums[2] && nums[2] !== 3) return true;
        return false;
      });
      if (hasRyanmen) {
        yaku.push({ name: '平和', han: 1 });
      }
    }
  }

  // 一盃口
  if (menzen && !isChiitoitsu) {
    const shuntsuKeys = decomp.mentsu
      .filter(m => m.type === 'shuntsu')
      .map(m => `${m.tiles[0].suit}${m.tiles[0].num}`);
    const pairCount = new Map<string, number>();
    for (const k of shuntsuKeys) pairCount.set(k, (pairCount.get(k) || 0) + 1);
    const pairs = Array.from(pairCount.values()).filter(c => c >= 2).length;
    if (pairs >= 2) {
      yaku.push({ name: '二盃口', han: 3 });
    } else if (pairs === 1) {
      yaku.push({ name: '一盃口', han: 1 });
    }
  }

  // 役牌
  for (const m of decomp.mentsu) {
    if ((m.type === 'koutsu' || m.type === 'kantsu') && m.tiles[0].suit === 'z') {
      const num = m.tiles[0].num;
      if (num === 5) yaku.push({ name: '役牌 白', han: 1 });
      else if (num === 6) yaku.push({ name: '役牌 發', han: 1 });
      else if (num === 7) yaku.push({ name: '役牌 中', han: 1 });
      else {
        if (num === condition.roundWind) yaku.push({ name: `場風 ${['', '東', '南', '西', '北'][num]}`, han: 1 });
        if (num === condition.seatWind) yaku.push({ name: `自風 ${['', '東', '南', '西', '北'][num]}`, han: 1 });
      }
    }
  }

  // 嶺上開花
  if (condition.isRinshan) yaku.push({ name: '嶺上開花', han: 1 });
  // 槍槓
  if (condition.isChankan) yaku.push({ name: '槍槓', han: 1 });
  // 海底摸月
  if (condition.isHaitei) yaku.push({ name: '海底摸月', han: 1 });
  // 河底撈魚
  if (condition.isHoutei) yaku.push({ name: '河底撈魚', han: 1 });

  // 三色同順
  if (!isChiitoitsu) {
    const shuntsuByNum = new Map<number, Set<string>>();
    for (const m of decomp.mentsu) {
      if (m.type !== 'shuntsu') continue;
      const num = m.tiles[0].num;
      if (!shuntsuByNum.has(num)) shuntsuByNum.set(num, new Set());
      shuntsuByNum.get(num)!.add(m.tiles[0].suit);
    }
    for (const suits of shuntsuByNum.values()) {
      if (suits.has('m') && suits.has('p') && suits.has('s')) {
        yaku.push({ name: '三色同順', han: menzen ? 2 : 1 });
        break;
      }
    }
  }

  // 三色同刻
  if (!isChiitoitsu) {
    const koutsuByNum = new Map<number, Set<string>>();
    for (const m of decomp.mentsu) {
      if (m.type !== 'koutsu' && m.type !== 'kantsu') continue;
      if (m.tiles[0].suit === 'z') continue;
      const num = m.tiles[0].num;
      if (!koutsuByNum.has(num)) koutsuByNum.set(num, new Set());
      koutsuByNum.get(num)!.add(m.tiles[0].suit);
    }
    for (const suits of koutsuByNum.values()) {
      if (suits.has('m') && suits.has('p') && suits.has('s')) {
        yaku.push({ name: '三色同刻', han: 2 });
        break;
      }
    }
  }

  // 一気通貫
  if (!isChiitoitsu) {
    for (const suit of ['m', 'p', 's'] as const) {
      const starts = new Set(
        decomp.mentsu
          .filter(m => m.type === 'shuntsu' && m.tiles[0].suit === suit)
          .map(m => m.tiles[0].num)
      );
      if (starts.has(1) && starts.has(4) && starts.has(7)) {
        yaku.push({ name: '一気通貫', han: menzen ? 2 : 1 });
        break;
      }
    }
  }

  // 対々和
  if (!isChiitoitsu && decomp.mentsu.every(m => m.type === 'koutsu' || m.type === 'kantsu')) {
    yaku.push({ name: '対々和', han: 2 });
  }

  // 三暗刻
  if (!isChiitoitsu) {
    const anko = decomp.mentsu.filter(m => (m.type === 'koutsu' || m.type === 'kantsu') && !m.isOpen);
    if (anko.length === 3) {
      yaku.push({ name: '三暗刻', han: 2 });
    }
  }

  // 三槓子
  if (decomp.mentsu.filter(m => m.type === 'kantsu').length === 3) {
    yaku.push({ name: '三槓子', han: 2 });
  }

  // 小三元
  const sangenKoutsu = decomp.mentsu.filter(
    m => (m.type === 'koutsu' || m.type === 'kantsu') && m.tiles[0].suit === 'z' && m.tiles[0].num >= 5
  ).length;
  const sangenJantai = decomp.jantai.tiles[0].suit === 'z' && decomp.jantai.tiles[0].num >= 5;
  if (sangenKoutsu === 2 && sangenJantai) {
    yaku.push({ name: '小三元', han: 2 });
  }

  // 混全帯么九
  if (!isChiitoitsu) {
    const allMentsuHaveTermOrHonor = decomp.mentsu.every(m =>
      m.tiles.some(t => isTerminalOrHonor(t))
    );
    const jantaiTermOrHonor = isTerminalOrHonor(decomp.jantai.tiles[0]);
    if (allMentsuHaveTermOrHonor && jantaiTermOrHonor && hasHonor) {
      const hasShuntsu = decomp.mentsu.some(m => m.type === 'shuntsu');
      if (hasShuntsu) {
        yaku.push({ name: '混全帯么九', han: menzen ? 2 : 1 });
      }
    }
  }

  // 七対子
  if (isChiitoitsu) {
    yaku.push({ name: '七対子', han: 2 });
  }

  // 混老頭
  if (allTiles.every(t => isTerminalOrHonor(t)) && hasHonor && suits.size > 0) {
    yaku.push({ name: '混老頭', han: 2 });
  }

  // 純全帯么九
  if (!isChiitoitsu && !hasHonor) {
    const allMentsuHaveTerm = decomp.mentsu.every(m =>
      m.tiles.some(t => isTerminal(t))
    );
    const jantaiTerm = isTerminal(decomp.jantai.tiles[0]);
    if (allMentsuHaveTerm && jantaiTerm) {
      const hasShuntsu = decomp.mentsu.some(m => m.type === 'shuntsu');
      if (hasShuntsu) {
        yaku.push({ name: '純全帯么九', han: menzen ? 3 : 2 });
      }
    }
  }

  // 混一色
  if (suits.size === 1 && hasHonor) {
    yaku.push({ name: '混一色', han: menzen ? 3 : 2 });
  }

  // 清一色
  if (suits.size === 1 && !hasHonor) {
    yaku.push({ name: '清一色', han: menzen ? 6 : 5 });
  }

  // ドラ
  if (condition.doraCount > 0) {
    yaku.push({ name: 'ドラ', han: condition.doraCount });
  }
  if (condition.uraDoraCount > 0) {
    yaku.push({ name: '裏ドラ', han: condition.uraDoraCount });
  }
  if (condition.redDoraCount > 0) {
    yaku.push({ name: '赤ドラ', han: condition.redDoraCount });
  }

  return yaku;
}
