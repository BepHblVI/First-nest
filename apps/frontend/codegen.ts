// apps/frontend/codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:3001/graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*'],
  generates: {
    './src/gql/': {
      // ★ 戻す
      preset: 'client',
      config: {
        documentMode: 'string',
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
