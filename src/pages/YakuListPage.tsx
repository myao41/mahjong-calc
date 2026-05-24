interface YakuInfo {
  name: string;
  closedHan: number | string;
  openHan: number | string | null;
  description: string;
}

interface YakuGroup {
  title: string;
  yaku: YakuInfo[];
}

const yakuGroups: YakuGroup[] = [
  {
    title: '1翻',
    yaku: [
      { name: '立直', closedHan: 1, openHan: null, description: '門前でテンパイ時に宣言' },
      { name: '一発', closedHan: 1, openHan: null, description: '立直後1巡以内にアガリ' },
      { name: '門前清自摸和', closedHan: 1, openHan: null, description: '門前でツモアガリ' },
      { name: '断么九', closedHan: 1, openHan: 1, description: '2〜8の数牌のみで構成' },
      { name: '平和', closedHan: 1, openHan: null, description: '全て順子、雀頭が役牌以外、両面待ち' },
      { name: '一盃口', closedHan: 1, openHan: null, description: '同じ順子が2組' },
      { name: '役牌 白', closedHan: 1, openHan: 1, description: '白の刻子または槓子' },
      { name: '役牌 發', closedHan: 1, openHan: 1, description: '發の刻子または槓子' },
      { name: '役牌 中', closedHan: 1, openHan: 1, description: '中の刻子または槓子' },
      { name: '場風牌', closedHan: 1, openHan: 1, description: '場風の刻子または槓子' },
      { name: '自風牌', closedHan: 1, openHan: 1, description: '自風の刻子または槓子' },
      { name: '嶺上開花', closedHan: 1, openHan: 1, description: '槓した後のツモでアガリ' },
      { name: '槍槓', closedHan: 1, openHan: 1, description: '他家の加槓した牌でロン' },
      { name: '海底摸月', closedHan: 1, openHan: 1, description: '最後のツモでアガリ' },
      { name: '河底撈魚', closedHan: 1, openHan: 1, description: '最後の捨て牌でロン' },
    ],
  },
  {
    title: '2翻',
    yaku: [
      { name: 'ダブル立直', closedHan: 2, openHan: null, description: '最初の巡目で立直' },
      { name: '七対子', closedHan: 2, openHan: null, description: '7つの対子で構成' },
      { name: '対々和', closedHan: 2, openHan: 2, description: '4つの刻子（槓子）と雀頭' },
      { name: '三暗刻', closedHan: 2, openHan: 2, description: '暗刻が3つ' },
      { name: '三色同順', closedHan: 2, openHan: 1, description: '3色同じ数字の順子' },
      { name: '三色同刻', closedHan: 2, openHan: 2, description: '3色同じ数字の刻子' },
      { name: '一気通貫', closedHan: 2, openHan: 1, description: '同じ色で123・456・789' },
      { name: '混全帯么九', closedHan: 2, openHan: 1, description: '全ての面子と雀頭に么九牌を含む（字牌あり）' },
      { name: '小三元', closedHan: 2, openHan: 2, description: '三元牌の刻子2つと雀頭' },
      { name: '三槓子', closedHan: 2, openHan: 2, description: '槓子が3つ' },
      { name: '混老頭', closedHan: 2, openHan: 2, description: '么九牌のみで構成' },
    ],
  },
  {
    title: '3翻',
    yaku: [
      { name: '二盃口', closedHan: 3, openHan: null, description: '同じ順子が2組×2' },
      { name: '混一色', closedHan: 3, openHan: 2, description: '1種類の数牌と字牌のみ' },
      { name: '純全帯么九', closedHan: 3, openHan: 2, description: '全ての面子と雀頭に老頭牌を含む（字牌なし）' },
    ],
  },
  {
    title: '6翻',
    yaku: [
      { name: '清一色', closedHan: 6, openHan: 5, description: '1種類の数牌のみで構成' },
    ],
  },
  {
    title: '役満',
    yaku: [
      { name: '国士無双', closedHan: '役満', openHan: null, description: '13種の么九牌を1枚ずつ＋1枚' },
      { name: '四暗刻', closedHan: '役満', openHan: null, description: '4つの暗刻' },
      { name: '大三元', closedHan: '役満', openHan: '役満', description: '三元牌3つの刻子' },
      { name: '字一色', closedHan: '役満', openHan: '役満', description: '字牌のみで構成' },
      { name: '緑一色', closedHan: '役満', openHan: '役満', description: '緑色の牌のみ（2,3,4,6,8索,發）' },
      { name: '清老頭', closedHan: '役満', openHan: '役満', description: '1,9のみで構成' },
      { name: '大四喜', closedHan: '役満', openHan: '役満', description: '風牌4種の刻子' },
      { name: '小四喜', closedHan: '役満', openHan: '役満', description: '風牌3種の刻子＋風牌の雀頭' },
      { name: '九蓮宝燈', closedHan: '役満', openHan: null, description: '1色で1112345678999＋1枚' },
      { name: '四槓子', closedHan: '役満', openHan: '役満', description: '4つの槓子' },
      { name: '天和', closedHan: '役満', openHan: null, description: '親の配牌でアガリ' },
      { name: '地和', closedHan: '役満', openHan: null, description: '子の第一ツモでアガリ' },
    ],
  },
];

const cellStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #e0e0e0',
  fontSize: 14,
};

export function YakuListPage() {
  return (
    <div>
      {yakuGroups.map((group) => (
        <div key={group.title} style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 16, fontWeight: 'bold', color: '#2e7d32',
            marginBottom: 8, padding: '6px 12px',
            background: '#e8f5e9', borderRadius: 4,
          }}>
            {group.title}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', color: '#555', fontSize: 12 }}>役名</th>
                <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>門前</th>
                <th style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>鳴き</th>
                <th style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', color: '#555', fontSize: 12 }}>条件</th>
              </tr>
            </thead>
            <tbody>
              {group.yaku.map((y) => (
                <tr key={y.name}>
                  <td style={{ ...cellStyle, fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                    {y.name}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: '#e65100', fontWeight: 'bold' }}>
                    {typeof y.closedHan === 'number' ? `${y.closedHan}翻` : y.closedHan}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: y.openHan === null ? '#ccc' : '#1565c0', fontWeight: 'bold' }}>
                    {y.openHan === null ? '−' : (typeof y.openHan === 'number' ? `${y.openHan}翻` : y.openHan)}
                  </td>
                  <td style={{ ...cellStyle, color: '#666', fontSize: 13 }}>
                    {y.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
