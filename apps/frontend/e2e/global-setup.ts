import type { FullConfig } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const API_URL = 'http://localhost:3001/graphql';
const APP_URL = 'http://localhost:3000';
const USER = { username: 'e2e_user', password: 'e2e_pass' };
const AUTH_FILE = path.resolve('e2e/.auth/user.json');

async function gql<T = any>(query: string, variables: any, token?: string) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json() as Promise<{ data?: T; errors?: any }>;
}

async function waitForApi(retries = 60, intervalMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`API がタイムアウト: ${API_URL}`);
}

export default async function globalSetup(_config: FullConfig) {
  await waitForApi();

  // 1. signUp（既に居ても無視）
  const signUpRes = await gql(
    `mutation($u: String!, $p: String!) {
       signUp(username: $u, password: $p) { id }
     }`,
    { u: USER.username, p: USER.password },
  );
  if (signUpRes.errors) {
    const msg = JSON.stringify(signUpRes.errors);
    if (!/exists|duplicate|already|既に/i.test(msg)) {
      throw new Error(`signUp 失敗: ${msg}`);
    }
  }

  // 2. ログインしてトークン取得
  const loginRes = await gql<{ login: { access_token: string } }>(
    `mutation($u: String!, $p: String!) {
       login(username: $u, password: $p) { access_token }
     }`,
    { u: USER.username, p: USER.password },
  );
  const token = loginRes.data?.login?.access_token;
  if (!token) throw new Error(`ログイン失敗: ${JSON.stringify(loginRes)}`);

  // 3. アンケートをシード
  await seedSurveys(token);

  // 4. storageState を直接書き出し（ブラウザ不要）
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: APP_URL,
        localStorage: [{ name: 'access_token', value: token }],
      },
    ],
  };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
}

async function seedSurveys(token: string) {
  const surveys = [
    {
      title: 'E2E アンケートA',
      published: true,
      auth: 'PUBLIC',
      questions: [{ qtext: 'Aの質問1', type: 'TEXT', required: false }],
    },
    {
      title: 'E2E アンケートB',
      published: false,
      auth: 'PUBLIC',
      questions: [
        {
          qtext: 'Bの質問1',
          type: 'SINGLE',
          required: true,
          options: ['はい', 'いいえ'],
        },
      ],
    },
  ];

  const m = `
    mutation($input: CreateSurveyInput!) {
      createSurvey(input: $input) { id title }
    }
  `;

  for (const input of surveys) {
    const res = await gql(m, { input }, token);
    if (res.errors) {
      throw new Error(`シード失敗: ${JSON.stringify(res.errors)}`);
    }
  }
}
