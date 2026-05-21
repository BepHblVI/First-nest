// utils/authfetch.ts
'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { TypedDocumentString } from '../src/gql/graphql';
import { RefreshMutation } from '../src/queries/auth';
import { graphqlFetch, type GraphQLResponse } from './gqlFetch';

export function useAuthfetch() {
  const router = useRouter();

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const result = await graphqlFetch(RefreshMutation);
      const newToken = result.data?.refresh?.access_token;
      if (newToken) {
        localStorage.setItem('access_token', newToken);
        return newToken;
      }
      console.log('refresh failed:', result);
      return null;
    } catch (error) {
      console.error('refresh error:', error);
      return null;
    }
  }, []);

  const sendRequest = useCallback(
    async <TResult, TVariables>(
      query: TypedDocumentString<TResult, TVariables>,
      variables: TVariables | undefined,
      token: string,
    ): Promise<GraphQLResponse<TResult> | null> => {
      try {
        const result = await graphqlFetch(query, variables, token);

        if (result.errors) {
          const isUnauthorized = result.errors.some(
            (err) =>
              err.message.includes('Unauthorized') || err.extensions?.code === 'UNAUTHENTICATED',
          );

          if (isUnauthorized) {
            const newToken = await refreshAccessToken();

            if (newToken) {
              const retry = await graphqlFetch(query, variables, newToken);
              if (retry.errors) {
                alert(`エラー: ${retry.errors[0]?.message}`);
                return null;
              }
              return retry;
            }

            localStorage.removeItem('access_token');
            alert('セッションの有効期限が切れました。再度ログインしてください。');
            router.push('/login');
            return null;
          }

          alert(`バックエンドエラー: ${result.errors[0]?.message}`);
          return null;
        }

        return result;
      } catch (error) {
        console.error('🚨 Network/Server Error:', error);
        alert('サーバーに接続できません。');
        return null;
      }
    },
    [refreshAccessToken, router],
  );

  const authFetch = useCallback(
    async <TResult, TVariables>(
      query: TypedDocumentString<TResult, TVariables>,
      ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
    ): Promise<GraphQLResponse<TResult> | null> => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          alert('ログインが必要です');
          router.push('/login');
          return null;
        }
        return sendRequest(query, variables, newToken);
      }

      return sendRequest(query, variables, token);
    },
    [refreshAccessToken, sendRequest, router],
  );

  return { authFetch };
}
