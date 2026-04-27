'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuthfetch() {
  const router = useRouter();

  // リフレッシュトークンでアクセストークンを再取得
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `
            mutation {
              refresh {
                access_token
              }
            }
          `,
        }),
      });

      const result = await response.json();

      if (result.data?.refresh?.access_token) {
        const newToken = result.data.refresh.access_token;
        localStorage.setItem('access_token', newToken);
        return newToken;
      }

      console.log('refresh failed:', result);
      return null;
    } catch (error) {
      console.error('refresh error:', error);
      return null;
    }
  }, []); // ★ 依存なし(関数内で外部の state を参照していない)

  // 実際の fetch 処理
  const sendRequest = useCallback(
    async (query: string, variables: any, token: string) => {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();

        if (result.errors) {
          const isUnauthorized = result.errors.some(
            (err: any) =>
              err.message.includes('Unauthorized') || err.extensions?.code === 'UNAUTHENTICATED',
          );

          if (isUnauthorized) {
            const newToken = await refreshAccessToken();

            if (newToken) {
              const retryResponse = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${newToken}`,
                },
                credentials: 'include',
                body: JSON.stringify({ query, variables }),
              });

              const retryResult = await retryResponse.json();

              if (retryResult.errors) {
                alert(`エラー: ${retryResult.errors[0].message}`);
                return null;
              }

              return retryResult;
            }

            localStorage.removeItem('access_token');
            alert('セッションの有効期限が切れました。再度ログインしてください。');
            router.push('/login');
            return null;
          }

          alert(`バックエンドエラー: ${result.errors[0].message}`);
          return null;
        }

        return result;
      } catch (error) {
        console.error('🚨 Network/Server Error:', error);
        alert('サーバーに接続できません。');
        return null;
      }
    },
    [refreshAccessToken, router], // ★ 依存
  );

  // GraphQL リクエストを実行(リフレッシュ付き)
  const authFetch = useCallback(
    async (query: string, variables?: any) => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          alert('ログインが必要です');
          router.push('/login');
          return null;
        }
        return await sendRequest(query, variables, newToken);
      }

      return await sendRequest(query, variables, token);
    },
    [refreshAccessToken, sendRequest, router], // ★ 依存
  );

  return { authFetch };
}
