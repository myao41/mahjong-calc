import { useState, useRef, useEffect } from 'react';
import type { Tile, QuizQuestion } from '../types';
import { TileButton } from '../components/TileButton';
import { generateFromYaku } from '../utils/quiz';
import { useViewport } from '../utils/useViewport';

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15, color: '#2e7d32', marginBottom: 8,
  padding: '6px 12px', background: '#e8f5e9', borderRadius: 4,
  fontWeight: 'bold',
};

interface YakuEntry {
  name: string;
  han: number | string;
  kuisagari?: number;
  menzenOnly?: boolean;
  desc: string;
  quiz?: boolean;
  strategy?: string;
}

const YAKU_DATA: { section: string; yaku: YakuEntry[] }[] = [
  {
    section: '1翻',
    yaku: [
      { name: '立直', han: 1, menzenOnly: true, desc: '門前でテンパイ時に1000点を供託して宣言', quiz: true },
      { name: '一発', han: 1, menzenOnly: true, desc: '立直宣言後、1巡以内に和了', quiz: true },
      { name: '門前清自摸和', han: 1, menzenOnly: true, desc: '門前でツモ和了', quiz: true },
      { name: '断么九', han: 1, desc: '2〜8の数牌のみで構成（喰いタンあり）', quiz: true, strategy: 'tanyao' },
      { name: '平和', han: 1, menzenOnly: true, desc: '順子のみ・役牌以外の雀頭・両面待ち', quiz: true, strategy: 'pinfu' },
      { name: '一盃口', han: 1, menzenOnly: true, desc: '同種同数の順子が2組', quiz: true },
      { name: '役牌（三元牌）', han: 1, desc: '白・發・中の刻子または槓子', quiz: true },
      { name: '役牌（風牌）', han: 1, desc: '場風または自風の刻子または槓子', quiz: true },
      { name: '嶺上開花', han: 1, desc: '槓をした後の嶺上牌でツモ和了', quiz: true },
      { name: '槍槓', han: 1, desc: '他家の加槓した牌でロン和了' },
      { name: '海底摸月', han: 1, desc: '最後のツモ牌で和了' },
      { name: '河底撈魚', han: 1, desc: '最後の捨て牌でロン和了' },
    ],
  },
  {
    section: '2翻',
    yaku: [
      { name: '三色同順', han: 2, kuisagari: 1, desc: '3色で同じ数の順子', quiz: true, strategy: 'sanshoku' },
      { name: '一気通貫', han: 2, kuisagari: 1, desc: '同じ色で1-2-3、4-5-6、7-8-9の順子', quiz: true, strategy: 'ittsu' },
      { name: '対々和', han: 2, desc: '刻子（または槓子）のみで構成', quiz: true, strategy: 'toitoi' },
      { name: '三暗刻', han: 2, desc: '暗刻が3つ', quiz: true, strategy: 'sananko' },
      { name: '三色同刻', han: 2, desc: '3色で同じ数の刻子', quiz: true, strategy: 'sanshoku_doko' },
      { name: '小三元', han: 2, desc: '三元牌のうち2つが刻子、1つが雀頭', quiz: true, strategy: 'shosangen' },
      { name: '混全帯么九', han: 2, kuisagari: 1, desc: '全ての面子と雀頭に么九牌・字牌を含む（順子あり）', quiz: true, strategy: 'chanta' },
      { name: '七対子', han: 2, menzenOnly: true, desc: '7つの対子で構成（25符固定）', quiz: true, strategy: 'chiitoitsu' },
      { name: 'ダブル立直', han: 2, menzenOnly: true, desc: '第1巡目にテンパイして立直を宣言' },
      { name: '混老頭', han: 2, desc: '么九牌と字牌のみで構成', strategy: 'honroutou' },
      { name: '三槓子', han: 2, desc: '槓子が3つ', strategy: 'sankantsu' },
    ],
  },
  {
    section: '3翻',
    yaku: [
      { name: '二盃口', han: 3, menzenOnly: true, desc: '一盃口が2組', strategy: 'ryanpeikou' },
      { name: '純全帯么九', han: 3, kuisagari: 2, desc: '全ての面子と雀頭に么九牌を含む（字牌なし・順子あり）', quiz: true, strategy: 'junchan' },
      { name: '混一色', han: 3, kuisagari: 2, desc: '1種類の数牌と字牌のみで構成', quiz: true, strategy: 'honitsu' },
    ],
  },
  {
    section: '6翻',
    yaku: [
      { name: '清一色', han: 6, kuisagari: 5, desc: '1種類の数牌のみで構成', quiz: true, strategy: 'chinitsu' },
    ],
  },
  {
    section: '役満',
    yaku: [
      { name: '四暗刻', han: '役満', menzenOnly: true, desc: '暗刻が4つ', quiz: true, strategy: 'suuanko' },
      { name: '大三元', han: '役満', desc: '三元牌すべてが刻子または槓子', quiz: true, strategy: 'daisangen' },
      { name: '字一色', han: '役満', desc: '字牌のみで構成', quiz: true, strategy: 'tsuuiiso' },
      { name: '国士無双', han: '役満', menzenOnly: true, desc: '么九牌・字牌13種を各1枚＋いずれか1枚', strategy: 'kokushi' },
      { name: '緑一色', han: '役満', desc: '緑色の牌（2,3,4,6,8索・發）のみで構成', strategy: 'ryuuiiso' },
      { name: '清老頭', han: '役満', desc: '么九牌のみで構成（字牌なし）', strategy: 'chinroutou' },
      { name: '大四喜', han: '役満', desc: '風牌すべてが刻子または槓子', strategy: 'daisuushii' },
      { name: '小四喜', han: '役満', desc: '風牌のうち3つが刻子、1つが雀頭', strategy: 'shousuushii' },
      { name: '九蓮宝燈', han: '役満', menzenOnly: true, desc: '同色で1112345678999＋同色1枚', strategy: 'chuurenpoutou' },
      { name: '四槓子', han: '役満', desc: '槓子が4つ', strategy: 'suukantsu' },
      { name: '天和', han: '役満', menzenOnly: true, desc: '親の配牌で和了' },
      { name: '地和', han: '役満', menzenOnly: true, desc: '子の第1ツモで和了' },
    ],
  },
  {
    section: 'その他',
    yaku: [
      { name: 'ドラ', han: 1, desc: 'ドラ表示牌の次の牌' },
      { name: '裏ドラ', han: 1, menzenOnly: true, desc: '立直和了時、ドラ表示牌の下の牌の次の牌' },
      { name: '赤ドラ', han: 1, desc: '赤い五萬・五筒・五索' },
    ],
  },
];

function RotatedTile({ tile, widthPx }: { tile: Tile; widthPx: number }) {
  const tileH = Math.round(widthPx * 75 / 56);
  return (
    <div style={{
      width: tileH, height: widthPx,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ transform: 'rotate(-90deg)' }}>
        <TileButton tile={tile} size="normal" widthPx={widthPx} />
      </div>
    </div>
  );
}

function HandExample({ question }: { question: QuizQuestion }) {
  const { isMobile } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const measure = () => {
      const s = getComputedStyle(el);
      setContainerW(el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { closedTiles, openMelds, condition } = question;

  let agariIdx = -1;
  for (let j = 0; j < closedTiles.length; j++) {
    if (closedTiles[j].suit === condition.agariTile.suit &&
        closedTiles[j].num === condition.agariTile.num) {
      agariIdx = j;
    }
  }
  const mainHand = closedTiles.filter((_, i) => i !== agariIdx);
  const agariTile = agariIdx >= 0 ? closedTiles[agariIdx] : null;
  const hasMelds = openMelds.length > 0;

  const ROTATE_RATIO = 75 / 56;
  let tileUnits = mainHand.length + (agariTile ? 1 : 0);
  for (const m of openMelds) {
    const isAnkan = m.type === 'kantsu' && !m.isOpen;
    if (isAnkan) {
      tileUnits += m.tiles.length;
    } else {
      tileUnits += ROTATE_RATIO + (m.tiles.length - 1);
    }
  }
  const spacerCount = (hasMelds ? 1 : 0) + (agariTile ? 1 : 0);
  const spacerW = isMobile ? 8 : 12;
  const meldGapCount = hasMelds ? Math.max(0, openMelds.length - 1) : 0;

  const defaultTileW = isMobile ? 24 : 38;
  const cw = containerW ?? 999;
  const availableW = cw - spacerCount * spacerW - meldGapCount * 4;
  const fittedTileW = Math.floor(availableW / Math.max(tileUnits, 1));
  const tw = Math.max(16, Math.min(defaultTileW, fittedTileW));
  const badgeScale = Math.min(1, tw / defaultTileW);
  const badgeFontSize = Math.max(9, Math.round((isMobile ? 11 : 12) * badgeScale));

  return (
    <div ref={containerRef} style={{ padding: '0 4px' }}>
      <div style={{
        display: 'flex', flexWrap: 'nowrap',
        alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {mainHand.map((tile, i) => (
          <div key={i} style={{ flexShrink: 0 }}>
            <TileButton tile={tile} widthPx={tw} />
          </div>
        ))}

        {hasMelds && (
          <>
            <div style={{ width: spacerW, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'flex-end' }}>
              {openMelds.map((meld, mi) => {
                const isAnkan = meld.type === 'kantsu' && !meld.isOpen;
                return (
                  <div key={`m-${mi}`} style={{
                    display: 'flex', alignItems: 'flex-end',
                    marginLeft: mi > 0 ? 4 : 0, flexShrink: 0,
                  }}>
                    {meld.tiles.map((tile, ti) => {
                      if (isAnkan && (ti === 0 || ti === 3)) {
                        const h = Math.round(tw * 75 / 56);
                        return (
                          <div key={ti} style={{
                            width: tw, height: h, flexShrink: 0,
                            borderRadius: 3,
                            background: '#E2B007',
                            border: '1px solid #D49B00',
                            boxSizing: 'border-box',
                          }} />
                        );
                      }
                      if (!isAnkan && ti === 0) {
                        return <RotatedTile key={ti} tile={tile} widthPx={tw} />;
                      }
                      return <TileButton key={ti} tile={tile} size="normal" widthPx={tw} />;
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {agariTile && (
          <>
            <div style={{ width: spacerW, flexShrink: 0 }} />
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', flexShrink: 0,
            }}>
              <div style={{
                fontSize: badgeFontSize, color: '#fff', fontWeight: 'bold',
                background: condition.agariType === 'tsumo' ? '#16a085' : '#e74c3c',
                padding: '1px 4px', borderRadius: 3,
                lineHeight: 1.3, marginBottom: Math.round(4 * badgeScale + 2),
              }}>
                {condition.agariType === 'tsumo' ? 'ツモ' : 'ロン'}
              </div>
              <TileButton tile={agariTile} widthPx={tw} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function YakuListPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [examples, setExamples] = useState<Record<string, QuizQuestion>>({});

  const toggle = (name: string, strategy: string) => {
    if (expanded === name) {
      setExpanded(null);
      return;
    }
    setExpanded(name);
    if (!examples[name]) {
      const q = generateFromYaku(strategy);
      if (q) setExamples(prev => ({ ...prev, [name]: q }));
    }
  };

  const regenerate = (name: string, strategy: string) => {
    const q = generateFromYaku(strategy);
    if (q) setExamples(prev => ({ ...prev, [name]: q }));
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 16 }}>役一覧</h2>

      {YAKU_DATA.map((group) => (
        <div key={group.section} style={{ marginBottom: 20 }}>
          <div style={sectionTitleStyle}>{group.section}</div>
          <div style={{
            background: '#fff', borderRadius: 6, overflow: 'hidden',
            border: '1px solid #e0e0e0',
          }}>
            {group.yaku.map((y, i) => {
              const isExpanded = expanded === y.name;
              const example = examples[y.name];
              return (
                <div key={y.name}>
                  <div
                    onClick={() => y.strategy && toggle(y.name, y.strategy)}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderTop: i > 0 ? '1px solid #f0f0f0' : 'none',
                      alignItems: 'flex-start',
                      cursor: y.strategy ? 'pointer' : 'default',
                      background: isExpanded ? '#f8fdf8' : 'transparent',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 'bold', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {y.name}
                        {y.strategy && (
                          <span style={{ fontSize: 11, color: '#aaa', fontWeight: 'normal' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 2, lineHeight: 1.5 }}>
                        {y.desc}
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right', flexShrink: 0, marginLeft: 12,
                      minWidth: 60,
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100' }}>
                        {typeof y.han === 'number' ? `${y.han}翻` : y.han}
                      </div>
                      {y.kuisagari !== undefined && (
                        <div style={{ fontSize: 11, color: '#7f8c8d', marginTop: 1 }}>
                          鳴き: {y.kuisagari}翻
                        </div>
                      )}
                      {y.menzenOnly && (
                        <div style={{ fontSize: 11, color: '#7f8c8d', marginTop: 1 }}>
                          門前のみ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 例の手牌 */}
                  {isExpanded && y.strategy && (
                    <div style={{
                      padding: '8px 12px 12px',
                      borderTop: '1px dashed #d5e8d4',
                      background: '#f8fdf8',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 6,
                      }}>
                        <span style={{ fontSize: 11, color: '#7f8c8d' }}>和了例</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            regenerate(y.name, y.strategy!);
                          }}
                          style={{
                            fontSize: 11, color: '#2e7d32', background: 'none',
                            border: '1px solid #c8e6c9', borderRadius: 4,
                            padding: '2px 8px', cursor: 'pointer',
                          }}
                        >
                          別の例
                        </button>
                      </div>
                      {example ? (
                        <HandExample question={example} />
                      ) : (
                        <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
                          生成できませんでした
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
