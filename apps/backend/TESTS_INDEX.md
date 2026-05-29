# 📋 Backend 全テスト設計・構成目次

> 💡 このファイルは `generate-all-tests-index.ts` によって自動生成されています。
> 単体テスト(spec)、統合テスト(integration)、E2Eテスト(e2e-spec)の実態と100%連動しています。

## 📄 auth.service.spec.ts
📂 `/src/auth/auth.service.spec.ts`

- 📁 **AuthService**
  - 📁 **signUp**
  - 📁 **signUp**
    - 📄 新規ユーザーが作成される
    - 📄 User / Tenant / Membership の3つが保存される
    - 📄 個人テナントの slug は username と同じ
    - 📄 displayName が指定された場合、Tenant.name に反映される
    - 📄 Membership は OWNER ロールで作成される
    - 📄 パスワードはbcryptでハッシュ化されてから保存される
    - 📄 bcryptのcost factor(salt rounds)は10以上である
    - 📄 既存のユーザー名なら ConflictException
    - 📄 予約slugなユーザー名はConflictExceptionで弾かれる
  - 📁 **login**
    - 📁 **正常系**
      - 📄 正しい認証情報で access/refresh の両トークンを返す
      - 📄 login成功時にRefreshTokenがDBに保存される
      - 📄 DB保存される tokenHash は生のJWTではなくハッシュ値である
      - 📄 保存される RefreshToken は revoked=false, userId が正しい
      - 📄 RefreshToken.expiresAt は現在時刻+1日 にセットされる
    - 📁 **JWT 発行の設定**
      - 📄 access_token は SECRET_KEY で署名され、有効期限 15m
      - 📄 refresh_token は REFRESH_KEY で署名され、有効期限 1d
      - 📄 access_token / refresh_token は別の secret で署名される
      - 📄 JWT payload には password が含まれない
      - 📄 JWT payload には sub(userId) と username が含まれる
    - 📁 **セキュリティ(エラー処理)**
      - 📄 ユーザーが存在しない場合 UnauthorizedException
      - 📄 パスワードが違う場合 UnauthorizedException
      - 📄 User Enumeration対策: ユーザー不存在とパスワード違いで同じメッセージ
      - 📄 タイミング攻撃対策: ユーザー不存在でも bcrypt.compare が実行される
  - 📁 **refresh**
    - 📁 **正常系**
      - 📄 有効なトークンで新しいトークンペアが返る
      - 📄 ローテーション: 古いトークンが revoked=true で更新される
      - 📄 ローテーション: 新しいトークンがDBに保存される
      - 📄 クロスユーザー: userA のトークンで refresh しても userA の access が返る
    - 📁 **セキュリティ(エラー処理)**
      - 📄 JWT署名が無効なら UnauthorizedException
      - 📄 JWT は有効だが DB に存在しないトークンは拒否される(盗難検知)
      - 📄 既に revoked されたトークンは拒否される
      - 📄 期限切れトークンは拒否される(jwt側のエラー)
  - 📁 **logout**
    - 📄 該当トークンが revoked=true に更新される
    - 📄 更新対象は tokenHash でマッチするトークンに限定される
    - 📄 DBに存在しないトークンを渡してもエラーにならない(冪等性)

---

## 📄 sign-up.input.spec.ts
📂 `/src/auth/dto/sign-up.input.spec.ts`

- 📁 **SignUpInput バリデーション**
  - 📁 **username**
    - 📄 3文字未満は拒否される
    - 📄 50文字超は拒否される
    - 📄 文字列以外は拒否される
    - 📄 適切な長さ(3〜50文字)なら通る
  - 📁 **password**
    - 📄 8文字未満は拒否される
    - 📄 72文字超は拒否される(bcrypt制限)
    - 📄 英字のみ(数字なし)は拒否される
    - 📄 数字のみ(英字なし)は拒否される
    - 📄 英字+数字を含めば通る
    - 📄 英字+数字+記号でも通る
- 📁 **PASSWORD_REGEX**
  - 📁 **SignUpInput バリデーション**
  - 📄 大文字を含むユーザー名は拒否される(slug 互換性のため)
  - 📄 ハイフン以外の記号を含むユーザー名は拒否される
  - 📄 ハイフンで開始するユーザー名は拒否される
  - 📁 **SignUpInput バリデーション**
  - 📁 **displayName**
    - 📄 省略可能
    - 📄 日本語を含んでもOK
    - 📄 100文字超は拒否される
  - 📁 **PASSWORD_REGEX**
  - 📁 **USERNAME_REGEX**

---

## 📄 hash-token.spec.ts
📂 `/src/auth/helpers/hash-token.spec.ts`

- 📁 **hashToken**
  - 📄 同じ入力からは常に同じハッシュが返る(冪等性)
  - 📄 違う入力からは違うハッシュが返る
  - 📄 SHA-256のhex形式(64文字、a-f0-9のみ)で返る
  - 📄 空文字でもハッシュが生成される
  - 📄 日本語など多バイト文字でも正常に動作する

---

## 📄 survey-mapper.spec.ts
📂 `/src/survey/helpers/survey-mapper.spec.ts`

- 📁 **buildTokenEntities**
  - 📄 PUBLIC のときは空配列
  - 📄 PRIVATE でも tokens が 0 なら空配列
  - 📄 PRIVATE で tokens > 0 なら指定数の空オブジェクト
  - 📄 PRIVATE で tokens が負数なら空配列
- 📁 **mapQuestionInputs**
  - 📄 options が undefined のときは空配列
  - 📄 options に order が index で付与される

---

## 📄 answer.validator.spec.ts
📂 `/src/survey/validators/answer.validator.spec.ts`

- 📁 **AnswerValidator**
  - 📁 **共通: 質問IDの整合性**
    - 📄 回答が参照する質問IDが存在しないとエラー
    - 📄 質問があっても回答がなければスキップされる(任意質問)
  - 📁 **TEXT 質問**
    - 📄 必須でテキストありなら成功
    - 📄 必須でテキスト未入力ならエラー
    - 📄 必須で空白のみのテキストはエラー(trim判定)
    - 📄 任意ならテキスト未入力でも成功
    - 📄 テキスト質問に選択肢を送るとエラー
  - 📁 **SINGLE 質問**
    - 📄 1つだけ選択すれば成功
    - 📄 必須で未選択ならエラー
    - 📄 複数選択するとエラー
    - 📄 存在しない選択肢IDを送るとエラー
    - 📄 選択式なのにtextを送るとエラー
  - 📁 **MULTIPLE 質問**
    - 📄 複数選択できる
    - 📄 1つだけの選択でも成功
    - 📄 必須で未選択ならエラー
    - 📄 重複選択するとエラー
    - 📄 存在しない選択肢IDを送るとエラー
  - 📁 **複合シナリオ**
    - 📄 TEXT + SINGLE + MULTIPLE をまとめて正しく回答できる
    - 📄 1つでも違反があれば全体がエラーで止まる

---

## 📄 create-tenant.input.spec.ts
📂 `/src/tenant/dto/create-tenant.input.spec.ts`

- 📁 **CreateTenantInput バリデーション**
  - 📁 **slug**
    - 📄 3文字未満は拒否される
    - 📄 64文字以上は拒否される
    - 📄 大文字を含む場合は拒否される
    - 📄 ハイフン以外の記号を含む場合は拒否される
    - 📄 ハイフンで開始する場合は拒否される
    - 📄 ハイフンで終了する場合は拒否される
    - 📄 英小文字・数字・ハイフンの組み合わせなら通る
  - 📁 **name**
    - 📄 空文字は拒否される
    - 📄 100文字超は拒否される
    - 📄 日本語を含んでも通る
- 📁 **SLUG_REGEX**

---

## 📄 username-to-slug.spec.ts
📂 `/src/tenant/helpers/username-to-slug.spec.ts`

- 📁 **usernameToSlug**
  - 📄 大文字を小文字に変換する
  - 📄 前後の空白を除去する
  - 📄 全角空白も除去する
  - 📄 連続するハイフンを1つにまとめる
  - 📄 先頭・末尾のハイフンを除去する
  - 📄 複数のスペースをハイフンに置換する
  - 📄 全て小文字英数字とハイフンの場合はそのまま返す
  - 📄 空文字を入れても例外を投げない(空文字を返す)

---

## 📄 tenant.integration-spec.ts
📂 `/src/tenant/tenant.integration-spec.ts`

- 📁 **TenantService**
  - 📁 **createTenant**
    - 📄 正常入力でテナントが作成される
    - 📄 同じ slug が既に存在する場合 ConflictException
  - 📁 **findBySlug**
    - 📄 存在する slug でテナントが取得できる
    - 📄 存在しない slug は null を返す
    - 📄 大文字・小文字が混ざった slug を指定しても、正しくテナントが取得できる
  - 📁 **findById**
    - 📄 存在するIDでテナントが取得できる
    - 📄 存在しないIDは null を返す
  - 📁 **MembershipService**
    - 📁 **findByUserAndTenant**
      - 📄 該当する Membership があれば返す
      - 📄 該当する Membership がなければ null を返す
    - 📁 **listByUser**
      - 📄 ユーザーの所属する Membership 一覧を返す(tenant 同梱)
      - 📄 所属がなければ空配列を返す
    - 📁 **listByTenant**
      - 📄 テナントのメンバー一覧を返す(user 同梱)

---

## 📄 auth.e2e-spec.ts
📂 `/test/auth.e2e-spec.ts`

- 📁 **Auth GraphQL API (e2e)**
  - 📁 **ログイン**
    - 📄 access_token(Body)とrefresh_token(Cookie)が発行される
    - 📄 間違ったパスワードでログインできない
    - 📄 存在しないユーザーでログインできない
    - 📄 エラーメッセージから「ユーザー存在/不存在」が判別できないこと
  - 📁 **リフレッシュ機能 (refresh)**
    - 📄 有効なrefresh_token Cookieで新しいaccess_tokenを取得できる
    - 📄 refresh時に新しい refresh_token Cookie がセットされる(ローテーション)
    - 📄 ローテーション: 同じrefresh_tokenを2回使うとエラーになる
    - 📄 ローテーション: 新しいCookieを使えば連続してrefreshできる
    - 📄 Cookieなしでrefreshを呼ぶとエラーになる
    - 📄 不正な値のrefresh_tokenでrefreshを呼ぶとエラーになる
    - 📄 別のsecretで署名されたトークンを送ってもrefreshできない
    - 📄 JWT署名は有効だがDBに登録されていないトークンはrefreshできない(盗難検知)
    - 📄 refreshで取得した新トークンで認証付きAPIにアクセスできる
    - 📄 refreshで取得したトークンの payload が正しい(sub に userId が入っている)
  - 📁 **ログアウト機能 (logout)**
    - 📄 logoutが成功するとtrueが返る
    - 📄 logout後はrefresh_token Cookieがクリアされる
    - 📄 logout後、古いrefresh_tokenでrefreshを呼ぶとエラー
    - 📄 Cookieなしでlogoutを呼んでも成功する(冪等性)
    - 📄 無効な値のrefresh_tokenでlogoutを呼んでも成功する(冪等性)
  - 📁 **access_tokenの検証**
    - 📄 access_tokenなしで認証必須APIにアクセスするとエラー
    - 📄 不正なaccess_tokenで認証必須APIにアクセスするとエラー
    - 📄 有効だが、別の秘密鍵で署名された偽造access_tokenは拒否される
    - 📄 【重要】ユーザーAのトークンで、ユーザーBのデータを取得・改ざんできないこと（認可の検証）
  - 📁 **signUp**
    - 📄 同じユーザー名で2回登録するとエラー
    - 📄 正常な情報でユーザー登録できる
    - 📁 **パスワード強度バリデーション**
      - 📄 短すぎるパスワード(7文字以下)は拒否される
      - 📄 英字を含まないパスワードは拒否される
      - 📄 数字を含まないパスワードは拒否される
      - 📄 英字+数字なら通る
    - 📁 **ユーザー名バリデーション**
      - 📄 短すぎるユーザー名(2文字以下)は拒否される
      - 📄 長すぎるユーザー名(51文字以上)は拒否される

---

## 📄 cross-tabulation.e2e-spec.ts
📂 `/test/cross-tabulation.e2e-spec.ts`

- 📁 **Cross Tabulation (e2e)**
  - 📁 **セキュリティ**
    - 📄 未認証なら弾かれる
    - 📄 他ユーザーのアンケートには 403 相当
    - 📄 存在しない surveyId は エラー
  - 📁 **バリデーション**
    - 📄 rowQuestionId == columnQuestionId は不正
    - 📄 TEXT 型の質問を指定するとエラー
    - 📄 別アンケートに属する質問IDを混ぜるとエラー
  - 📁 **SINGLE × SINGLE 基本集計**
    - 📄 1人だけ回答した最小ケース
    - 📄 複数人の回答を正しく集計
    - 📄 全選択肢の組合せ（直積）が必ず返る
  - 📁 **比率計算**
    - 📄 rowPercentage / columnPercentage / totalPercentage が正しい
    - 📄 rowSummary の合計が grandTotal と一致
  - 📁 **エッジケース**
    - 📄 回答0件: grandTotal=0、全セル count=0、比率は 0.0
    - 📄 行の合計が0でも rowPercentage は NaN ではなく 0.0
  - 📁 **MULTIPLE 質問**
    - 📄 MULTIPLE × SINGLE: 1人が複数選択肢を選ぶと複数行に加算される
    - 📄 rowQuestion.type が MULTIPLE と返る

---

## 📄 search.e2e-spec.ts
📂 `/test/search.e2e-spec.ts`

- 📁 **Survey Search (e2e)**
  - 📁 **セキュリティ**
    - 📄 未認証なら弾かれる
    - 📄 他ユーザーのアンケートは検索結果に含まれない
  - 📁 **キーワード検索**
    - 📄 TITLE_ONLY: タイトルに部分一致でヒット
    - 📄 TITLE_ONLY: 質問文だけマッチするキーワードはヒットしない
    - 📄 TITLE_AND_QUESTIONS: 質問文にマッチしてヒット
    - 📄 キーワードなしなら全件返る
    - 📄 キーワード100文字超はバリデーションエラー
  - 📁 **公開状態フィルタ**
    - 📄 PUBLISHED のみ
    - 📄 DRAFT のみ
    - 📄 両方指定で全件
    - 📄 指定なしで全件
  - 📁 **認証方式フィルタ**
    - 📄 PUBLIC のみ
    - 📄 PRIVATE のみ
  - 📁 **回答状態フィルタ**
    - 📄 UNANSWERED と HAS_ANSWERS が正しく分かれる
  - 📁 **範囲フィルタ**
    - 📁 **回答件数**
      - 📄 min で絞り込み(2件以上の回答があるもの)
    - 📁 **作成日時**
      - 📄 to で絞り込み(指定日時以前)
      - 📄 from で絞り込み(過去の日時を指定すると0件)
  - 📁 **並び替え**
    - 📄 TITLE ASC でアルファベット順
    - 📄 TITLE DESC で逆順
    - 📄 CREATED_AT DESC (デフォルト)で新しい順
    - 📄 SUBMISSION_COUNT DESC で回答多い順
  - 📁 **ページング**
    - 📄 limit 10 で10件返る
    - 📄 offset 20 で残り5件
    - 📄 limit が件数より多くてもエラーにならない
    - 📄 offset が件数を超えると空配列
  - 📁 **複合条件**
    - 📄 PUBLISHED + PRIVATE + キーワードを同時に適用

---

## 📄 subdomain.e2e-spec.ts
📂 `/test/subdomain.e2e-spec.ts`

- 📁 **サブドメイン機能テスト(e2e)**
  - 📁 **正常系**
    - 📄 存在するサブドメインからアクセスできる
  - 📁 **異常系**
    - 📄 存在しないサブドメインからアクセスできない

---

## 📄 survey.e2e-spec.ts
📂 `/test/survey.e2e-spec.ts`

- 📁 **Survey GraphQL API (e2e)**
  - 📁 **セキュリティチェック**
    - 📄 ログインなしのアンケート取得を弾く
    - 📄 他人のアンケート集計を取得しようとした場合、エラーで弾かれる
    - 📄 GraphQLのネストが深すぎる異常なクエリは、DoS攻撃対策として弾かれる
  - 📁 **作成 (createSurvey)**
    - 📄 タイトル(title)が空文字の場合はバリデーションエラーになる
  - 📁 **削除機能 (deleteSurvey)**
    - 📄 自分のアンケートを正常に削除できる
    - 📄 他人のアンケートを削除しようとした場合、エラーで弾かれる
    - 📄 削除したアンケートが一覧から消え、共有リンクにアクセスできない
  - 📁 **編集機能 (editSurvey)**
    - 📄 自分のアンケートを正常に編集できる
    - 📄 他人のアンケートを編集しようとした場合、エラーで弾かれる
    - 📄 質問を増やして編集すると、増えた状態で保存される
    - 📄 質問を減らして編集すると、古い質問が削除される
    - 📄 質問タイプをTEXTからSINGLEに変更し、選択肢が保存される
    - 📄 回答済みなら編集できない
    - 📁 **編集時のバリデーションエラー**
  - 📁 **togglePublished**
    - 📄 公開状態を true に変更できる
    - 📄 回答済みでも公開状態を変更できる
    - 📄 他人のアンケートの公開状態は変更できない
  - 📁 **回答送信と集計**
    - 📄 公開中のアンケートに回答を送信でき、集計結果に反映される
  - 📁 **招待制アンケート (PRIVATE)**
    - 📄 指定した数のトークンが発行される
    - 📄 作成者以外がアンケートを取得した際、トークン情報が隠蔽される
    - 📄 有効な招待トークンを使用してアンケートに回答できる
    - 📄 使用済みのトークンでは回答が拒否される
    - 📄 無効なトークンでは回答が拒否される
    - 📄 PRIVATEで作成したアンケートに、トークンなしで回答できない
    - 📄 1つの有効なトークンで同時に複数リクエストが来ても1つしか成功しない
  - 📁 **回答送信のバリデーション**
    - 📁 **SINGLE 質問**
      - 📄 1つだけ選択すれば成功
      - 📄 複数選択するとエラー
    - 📁 **MULTIPLE 質問**
      - 📄 複数選択できる
      - 📄 重複選択するとエラー
    - 📄 存在しない選択肢IDを送るとエラー
    - 📁 **必須質問**
      - 📄 必須が空だとエラー
      - 📄 任意が空でも成功
    - 📄 検証失敗時もトークンは温存される

---

