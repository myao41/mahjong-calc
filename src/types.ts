export type Suit = 'm' | 'p' | 's' | 'z';

export interface Tile {
  suit: Suit;
  num: number;
  isRed?: boolean;
}

export type MentsuType = 'shuntsu' | 'koutsu' | 'kantsu';

export interface Mentsu {
  type: MentsuType;
  tiles: Tile[];
  isOpen: boolean;
}

export interface Jantai {
  tiles: [Tile, Tile];
}

export interface HandDecomposition {
  mentsu: Mentsu[];
  jantai: Jantai;
}

export type AgariType = 'tsumo' | 'ron';

export type Wind = 1 | 2 | 3 | 4;

export type WaitType = 'ryanmen' | 'shanpon' | 'kanchan' | 'penchan' | 'tanki';

export interface AgariCondition {
  agariType: AgariType;
  agariTile: Tile;
  seatWind: Wind;
  roundWind: Wind;
  isRiichi: boolean;
  isDoubleRiichi: boolean;
  isIppatsu: boolean;
  isRinshan: boolean;
  isChankan: boolean;
  isHaitei: boolean;
  isHoutei: boolean;
  isTenhou: boolean;
  isChihou: boolean;
  doraCount: number;
  uraDoraCount: number;
  redDoraCount: number;
}

export interface Yaku {
  name: string;
  han: number;
  isYakuman?: boolean;
}

export interface FuDetail {
  name: string;
  fu: number;
}

export interface FuCalculation {
  details: FuDetail[];
  rawTotal: number;
  roundedTotal: number;
  waitType: WaitType;
}

export interface ScoreResult {
  yaku: Yaku[];
  han: number;
  fu: number;
  rawFu: number;
  fuCalc: FuCalculation;
  baseScore: number;
  isDealer: boolean;
  agariType: AgariType;
  scoreString: string;
  payments: string;
  ronPayment?: number;
  tsumoChildPayment?: number;
  tsumoDealerPayment?: number;
  tsumoAllPayment?: number;
}

export interface QuizQuestion {
  closedTiles: Tile[];
  openMelds: Mentsu[];
  condition: AgariCondition;
  answer: ScoreResult;
}
