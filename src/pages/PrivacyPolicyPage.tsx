const headingStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 'bold', color: '#2c3e50',
  marginTop: 24, marginBottom: 8,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: 13, color: '#34495e', lineHeight: 1.9,
  margin: '0 0 8px 0',
};

const listStyle: React.CSSProperties = {
  fontSize: 13, color: '#34495e', lineHeight: 1.9,
  margin: '4px 0 8px 0', paddingLeft: 20,
};

import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div>
      <Link
        to="/settings"
        style={{
          display: 'inline-block',
          fontSize: 14, color: '#2e7d32', padding: '4px 0', marginBottom: 8,
          textDecoration: 'none',
        }}
      >
        ← 設定に戻る
      </Link>

      <h2 style={{ fontSize: 18, color: '#2c3e50', marginBottom: 4 }}>プライバシーポリシー</h2>
      <p style={{ fontSize: 12, color: '#7f8c8d', marginBottom: 20 }}>最終更新日: 2026年5月26日</p>

      <div style={{
        background: '#fff', borderRadius: 8, padding: 16,
        border: '1px solid #e0e0e0',
      }}>
        <div style={headingStyle}>第1条（個人情報）</div>
        <p style={paragraphStyle}>「個人情報」とは、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）に定める「個人情報」を指し、生存する個人に関する情報であって、当該情報に含まれる氏名、メールアドレス、その他の記述等により特定の個人を識別できるもの、または個人識別符号が含まれるものを指します。</p>

        <div style={headingStyle}>第2条（個人情報の収集方法）</div>
        <p style={paragraphStyle}>当方は、以下の方法により個人情報を取得します。</p>
        <ol style={listStyle}>
          <li>ユーザーがXアカウントまたはGoogleアカウントを利用して本サービスに登録する際に、各認証サービスから提供される情報（表示名、メールアドレス、プロフィール画像URL、認証用ID等）</li>
          <li>ユーザーが問い合わせフォーム等を通じて自ら提供する情報</li>
          <li>ユーザーが本サービスを利用する過程で自動的に収集される情報（アクセスログ、Cookie、利用履歴等）</li>
        </ol>

        <div style={headingStyle}>第3条（個人情報を収集・利用する目的）</div>
        <p style={paragraphStyle}>当方が個人情報を収集・利用する目的は、以下のとおりです。</p>
        <ol style={listStyle}>
          <li>本サービスの提供・運営のため</li>
          <li>ユーザーからのお問い合わせに回答するため</li>
          <li>ユーザーの本人確認を行うため</li>
          <li>有料サービスの利用料金を請求するため</li>
          <li>メンテナンス、重要なお知らせなど必要に応じた連絡のため</li>
          <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、利用をお断りするため</li>
          <li>本サービスの改善、新機能の開発のため</li>
          <li>利用状況の統計・分析のため（個人を特定しない形で行います）</li>
          <li>上記の利用目的に付随する目的のため</li>
        </ol>

        <div style={headingStyle}>第4条（利用目的の変更）</div>
        <ol style={listStyle}>
          <li>当方は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
          <li>利用目的の変更を行った場合には、変更後の目的について、本サービス上への掲載その他の適切な方法により、ユーザーに通知するものとします。</li>
        </ol>

        <div style={headingStyle}>第5条（個人情報の第三者提供）</div>
        <ol style={listStyle}>
          <li>当方は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
            <ol type="a" style={listStyle}>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
            </ol>
          </li>
          <li>前項の定めにかかわらず、以下の場合には当該情報の提供先は第三者に該当しないものとします。
            <ol type="a" style={listStyle}>
              <li>当方が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
              <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
            </ol>
          </li>
        </ol>

        <div style={headingStyle}>第6条（外部サービスとの連携）</div>
        <ol style={listStyle}>
          <li>本サービスは、ユーザーの認証のためにXおよびGoogleの認証サービスを利用します。</li>
          <li>各認証サービスを通じて当方が取得する情報は以下のとおりです。
            <ul style={listStyle}>
              <li><b>X</b>: ユーザーID、表示名、プロフィール画像URL</li>
              <li><b>Google</b>: メールアドレス、表示名、プロフィール画像URL</li>
            </ul>
          </li>
          <li>当方は、各認証サービスから取得した情報を、本サービスにおけるアカウント管理および本人確認の目的にのみ利用します。</li>
          <li>各認証サービスにおける個人情報の取り扱いについては、それぞれのサービスのプライバシーポリシーをご確認ください。</li>
        </ol>

        <div style={headingStyle}>第7条（個人情報の開示）</div>
        <ol style={listStyle}>
          <li>当方は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
            <ol type="a" style={listStyle}>
              <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
              <li>当方の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
              <li>その他法令に違反することとなる場合</li>
            </ol>
          </li>
          <li>前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。</li>
        </ol>

        <div style={headingStyle}>第8条（個人情報の訂正および削除）</div>
        <ol style={listStyle}>
          <li>ユーザーは、当方の保有する自己の個人情報が誤った情報である場合には、当方が定める手続きにより、当方に対して個人情報の訂正、追加または削除（以下「訂正等」といいます。）を請求することができます。</li>
          <li>当方は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行います。</li>
          <li>当方は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。</li>
        </ol>

        <div style={headingStyle}>第9条（個人情報の利用停止等）</div>
        <ol style={listStyle}>
          <li>当方は、本人から、個人情報が利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。</li>
          <li>前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。</li>
          <li>当方は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。</li>
        </ol>

        <div style={headingStyle}>第10条（Cookieおよびアクセス解析）</div>
        <ol style={listStyle}>
          <li>本サービスは、ユーザーの利便性向上およびサービス改善の目的で、Cookieを使用する場合があります。</li>
          <li>本サービスは、アクセス解析ツールを使用する場合があります。アクセス解析ツールはCookieを使用してユーザーのアクセス情報を収集しますが、個人を特定する情報は含まれません。</li>
          <li>ユーザーは、ブラウザの設定によりCookieの受け入れを拒否することができます。ただし、Cookieを無効にした場合、本サービスの一部の機能が利用できなくなる場合があります。</li>
        </ol>

        <div style={headingStyle}>第11条（プライバシーポリシーの変更）</div>
        <ol style={listStyle}>
          <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。</li>
          <li>当方が別途定める場合を除いて、変更後のプライバシーポリシーは、本サービス上に掲載したときから効力を生じるものとします。</li>
        </ol>

        <div style={headingStyle}>第12条（お問い合わせ窓口）</div>
        <p style={paragraphStyle}>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。</p>
        <p style={paragraphStyle}>
          <a
            href="https://forms.gle/pTpx1BNHx8J8PVDW8"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2e7d32' }}
          >
            https://forms.gle/pTpx1BNHx8J8PVDW8
          </a>
        </p>

        <p style={{ textAlign: 'right', fontSize: 13, color: '#34495e', marginTop: 32, marginBottom: 0 }}>
          以上
        </p>
        <p style={{ textAlign: 'right', fontSize: 13, color: '#7f8c8d', marginTop: 8, marginBottom: 0 }}>
          2026年5月26日 制定
        </p>
      </div>
    </div>
  );
}
