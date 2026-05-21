// utils/graphqlFetch.ts
import type { TypedDocumentString } from '../src/gql/graphql';

export type GraphQLResponse<TResult> = {
  data?: TResult;
  errors?: {
    message: string;
    extensions?: { code?: string };
  }[];
};

export async function graphqlFetch<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  variables?: TVariables,
  token?: string,
): Promise<GraphQLResponse<TResult>> {
  // eslint-disable-next-line no-restricted-syntax -- 認可レイヤの実装のため許可
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ query: query.toString(), variables }),
  });

  return response.json();
}
