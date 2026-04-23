'use client';
import { useRouter } from 'next/navigation';

export function useAuthfetch() {
  const router = useRouter();

  // リフレッシュトークンでアクセストークンを再取得
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ← Cookie を送信
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

      return null;
    } catch {
      return null;
    }
  };

  // GraphQL リクエストを実行（リフレッシュ付き）
  const authFetch = async (query: string, variables?: any) => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      // トークンなし → リフレッシュを試みる
      const newToken = await refreshAccessToken();
      if (!newToken) {
        alert('ログインが必要です');
        router.push('/login');
        return null;
      }
      // リフレッシュ成功 → 新しいトークンでリクエスト
      return await sendRequest(query, variables, newToken);
    }

    return await sendRequest(query, variables, token);
  };

  // 実際の fetch 処理
  const sendRequest = async (query: string, variables: any, token: string) => {
    try {
      const response = await fetch('http://localhost:3001/graphql', {
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
          // アクセストークン期限切れ → リフレッシュ試行
          const newToken = await refreshAccessToken();

          if (newToken) {
            // リフレッシュ成功 → リトライ
            const retryResponse = await fetch('http://localhost:3001/graphql', {
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

          // リフレッシュも失敗 → ログインページへ
          localStorage.removeItem('access_token');
          alert('セッションの有効期限が切れました。再度ログインしてください。');
          router.push('/login');
          return null;
        }

        // 認証以外のエラー
        alert(`バックエンドエラー: ${result.errors[0].message}`);
        return null;
      }

      return result;
    } catch (error) {
      console.error('🚨 Network/Server Error:', error);
      alert('サーバーに接続できません。');
      return null;
    }
  };

  return { authFetch };
}
