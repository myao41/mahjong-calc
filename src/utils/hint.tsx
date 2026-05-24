import type { ReactNode } from 'react';
import type { QuizQuestion, Tile, WaitType } from '../types';
import { TileButton } from '../components/TileButton';

export interface UserInputs {
  han: string;
  fu: string;
  score1: string;
  score2: string;
}

function InlineTile({ tile }: { tile: Tile }) {
  return (
    <span style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 1px' }}>
      <TileButton tile={tile} size="small" />
    </span>
  );
}

const WAIT_NAMES: Record<WaitType, string> = {
  ryanmen: '両面',
  kanchan: 'カンチャン',
  penchan: 'ペンチャン',
  shanpon: 'シャンポン',
  tanki: '単騎',
};

/**
 * 不正解時に表示する一言ヒントを生成する。
 * 該当ルールが複数ある場合は優先度順に最初に当たったものを返す。
 */
export function generateHint(
  question: QuizQuestion,
  inputs: UserInputs,
): ReactNode | null {
  const { condition, answer, openMelds } = question;
  const userHan = Number(inputs.han);
  const userFu = Number(inputs.fu);
  const userScore1 = Number(inputs.score1);
  const userScore2 = Number(inputs.score2);
  const isOpen = openMelds.length > 0;
  const yakuNames = answer.yaku.map(y => y.name);
  const yakumanCount = answer.yaku.filter(y => y.isYakuman).length;

  const hanWrong = userHan !== answer.han;
  const fuWrong = userFu !== answer.rawFu;

  let scoreWrong = false;
  if (answer.agariType === 'ron') {
    scoreWrong = userScore1 !== answer.ronPayment;
  } else if (answer.isDealer) {
    scoreWrong = userScore1 !== answer.tsumoAllPayment;
  } else {
    scoreWrong = userScore1 !== answer.tsumoChildPayment ||
                 userScore2 !== answer.tsumoDealerPayment;
  }

  // === 特殊役の符（優先度: 高） ===
  if (yakuNames.includes('国士無双')) {
    return (
      <span>
        <b>国士無双は役満</b>。13種の么九牌（
        <InlineTile tile={{ suit: 'm', num: 1 }} />
        <InlineTile tile={{ suit: 'm', num: 9 }} />
        <InlineTile tile={{ suit: 'p', num: 1 }} />
        <InlineTile tile={{ suit: 'p', num: 9 }} />
        <InlineTile tile={{ suit: 's', num: 1 }} />
        <InlineTile tile={{ suit: 's', num: 9 }} />
        <InlineTile tile={{ suit: 'z', num: 1 }} />
        <InlineTile tile={{ suit: 'z', num: 2 }} />
        ...）を各1枚＋1枚で構成。
      </span>
    );
  }

  if (yakuNames.includes('七対子') && fuWrong) {
    return (
      <span>
        <b>七対子は25符固定</b>。待ち符や対子の符など他の符は加算されません。
      </span>
    );
  }

  if (yakuNames.includes('平和') && condition.agariType === 'tsumo' && fuWrong) {
    return (
      <span>
        <b>平和ツモは20符固定</b>。ツモ符（+2符）は加算しません。
      </span>
    );
  }

  if (yakuNames.includes('平和') && condition.agariType === 'ron' && fuWrong) {
    return (
      <span>
        <b>平和ロンは30符固定</b>（副底20 + 門前ロン10）。他の符はゼロ。
      </span>
    );
  }

  // === 点数のみ違う場合の特例 ===
  if (!hanWrong && !fuWrong && scoreWrong) {
    if (answer.han >= 11 && yakumanCount === 0) {
      return (
        <span>
          <b>11翻以上の通常役は三倍満どまり</b>（M-Leagueは数え役満なし）。
          子24,000 / 親36,000点。
        </span>
      );
    }
    if ((answer.han === 4 && answer.rawFu === 30) ||
        (answer.han === 3 && answer.rawFu === 60)) {
      return (
        <span>
          <b>{answer.rawFu}符{answer.han}翻は切り上げ満貫</b>扱い。
          基準点1,920を満貫(2,000)に切り上げます。
        </span>
      );
    }
    return (
      <span>
        翻と符は正解です。
        <b>{answer.isDealer ? '親' : '子'}の{answer.agariType === 'tsumo' ? 'ツモ' : 'ロン'}</b>
        の列で点数を確認しましょう。
      </span>
    );
  }

  // === 符が違う ===
  if (fuWrong) {
    // 待ち符
    const wait = answer.fuCalc.waitType;
    if (wait === 'kanchan' || wait === 'penchan' || wait === 'tanki') {
      const example = (() => {
        if (wait === 'kanchan') {
          return (
            <>
              <InlineTile tile={{ suit: 's', num: 3 }} />
              <InlineTile tile={{ suit: 's', num: 5 }} />
              {' → '}
              <InlineTile tile={{ suit: 's', num: 4 }} />
              待ち
            </>
          );
        }
        if (wait === 'penchan') {
          return (
            <>
              <InlineTile tile={{ suit: 'm', num: 1 }} />
              <InlineTile tile={{ suit: 'm', num: 2 }} />
              {' → '}
              <InlineTile tile={{ suit: 'm', num: 3 }} />
              待ち
            </>
          );
        }
        return (
          <>
            雀頭の1枚で
            <InlineTile tile={{ suit: 'z', num: 1 }} />
            待ち
          </>
        );
      })();

      return (
        <span>
          <b>{WAIT_NAMES[wait]}待ち</b>は <b style={{ color: '#c62828' }}>+2符</b>。
          例: {example}
        </span>
      );
    }

    // 副露時の30符切り上げ
    if (isOpen && answer.rawFu === 20 && answer.fu === 30) {
      return (
        <span>
          <b>副露時に副底のみ（他の符が付かない）の場合は+10符</b>して30符に切り上げます。
        </span>
      );
    }

    // 連風牌の雀頭
    if (condition.roundWind === condition.seatWind) {
      const wind = condition.roundWind;
      const windTile: Tile = { suit: 'z', num: wind };
      // 雀頭が連風牌か簡易判定（rawFu に「連風牌」が含まれているか）
      const hasRenfuu = answer.fuCalc.details.some(d => d.name.includes('連風牌'));
      if (hasRenfuu) {
        return (
          <span>
            <b>連風牌（場風＝自風）の雀頭は +2符</b>（+4符ではありません）。
            <InlineTile tile={windTile} />
            <InlineTile tile={windTile} />
          </span>
        );
      }
    }

    // 役牌（三元牌・場風・自風）の暗刻/明刻
    const hasYakuhaiKoutsu = answer.fuCalc.details.some(d =>
      (d.name.includes('暗刻') || d.name.includes('明刻')) &&
      (d.name.includes('白') || d.name.includes('發') || d.name.includes('中') ||
       d.name.includes('東') || d.name.includes('南') || d.name.includes('西') || d.name.includes('北'))
    );
    if (hasYakuhaiKoutsu) {
      return (
        <span>
          <b>役牌（字牌）の刻子</b>は中張牌の倍の符： 明刻 <b>+4符</b> / 暗刻 <b>+8符</b>。
          <InlineTile tile={{ suit: 'z', num: 5 }} />
          <InlineTile tile={{ suit: 'z', num: 5 }} />
          <InlineTile tile={{ suit: 'z', num: 5 }} />
        </span>
      );
    }

    // 暗槓・明槓
    const hasKantsu = answer.fuCalc.details.some(d => d.name.includes('槓'));
    if (hasKantsu) {
      return (
        <span>
          <b>槓子の符</b>: 明槓 8/16符・暗槓 16/32符（中張/老頭・字牌）。
          刻子の4倍と覚えると簡単。
        </span>
      );
    }

    // 一般的な符のヒント
    return (
      <span>
        符計算を見直しましょう：副底20 + 門前ロン10 + ツモ2 + 面子の符 + 雀頭の符 + 待ち符。
      </span>
    );
  }

  // === 翻が違う ===
  if (hanWrong) {
    if (isOpen && userHan > answer.han) {
      return (
        <span>
          <b>副露している（鳴きあり）</b>と
          「立直」「平和」「門前清自摸和」「一盃口」などの<b>門前限定役</b>は付きません。
        </span>
      );
    }
    if (userHan < answer.han) {
      const missing = answer.yaku.filter(y => !y.name.includes('ドラ')).slice(0, 3);
      return (
        <span>
          役の見落としに注意。この手の役は<b>
            {missing.map(y => y.name).join('・')}
          </b>{missing.length < answer.yaku.length ? ' 等' : ''}です。
        </span>
      );
    }
    return (
      <span>
        役を数えすぎていませんか？同じ要素から複数の役を重複カウントしないように注意。
      </span>
    );
  }

  return null;
}
