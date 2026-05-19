import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // only-warn plugin を無効化
    plugins: { 'only-warn': { rules: {} } },
  },
  {
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // graphql() でラップされていないテンプレートリテラルに GraphQL 定義を書くのを禁止
          selector:
            ":not(CallExpression[callee.name='graphql']) > TemplateLiteral[quasis.0.value.raw=/(query|mutation|subscription)\\s+\\w+/]",
          message:
            'GraphQL の operation は `graphql()` (src/gql) でラップしてください。そうしないと Codegen が拾えず型が生成されません。',
        },
        {
          // string literal で書くのも禁止 ('mutation Login ...' など)
          selector: 'Literal[value=/(query|mutation|subscription)\\s+\\w+\\s*[\\(\\{]/]',
          message:
            'GraphQL の operation を文字列リテラルで書かないでください。`graphql()` (src/gql) を使ってください。',
        },
        {
          // fetch の body に { query: ... } を渡すパターン
          selector:
            "Property[key.name='query'][value.type=/TemplateLiteral|Literal|Identifier/]:has(~ Property[key.name='variables'])",
          message:
            'GraphQL リクエストを fetch で手組みしないでください。生成された Document と graphql-request などのクライアントを使ってください。',
        },
        {
          // /graphql エンドポイントへの直接 fetch を禁止
          selector: "CallExpression[callee.name='fetch'][arguments.0.value=/\\/graphql/]",
          message:
            '/graphql への fetch 直呼びは禁止です。Codegen 生成 Document と GraphQL クライアントを使ってください。',
        },
      ],

      // 生成物ディレクトリ以外からの import を強制したいなら
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['graphql-tag', '@apollo/client/core'],
              message: "gql タグは使わず、`graphql()` from '@/gql' を使ってください。",
            },
          ],
        },
      ],
    },
  },
  {
    // Codegen の生成物自体は対象外
    ignores: ['src/gql/**'],
  },
];
