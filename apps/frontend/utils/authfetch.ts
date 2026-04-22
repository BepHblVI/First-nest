import { useRouter } from 'next/navigation';
export function useAuthfetch() {
  const router = useRouter();

  const authFetch = async (query: string, variables?: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('ログインが必要です');
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        const isUnauthorized = result.errors.some(
          (err: any) =>
            err.message.includes('Unauthorized') || err.extensions?.code === 'UNAUTHENTICATED',
        );

        if (isUnauthorized) {
          alert('セッションの有効期限が切れました。再度ログインしてください。');
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }

        alert(`バックエンドエラー: ${result.errors[0].message}`);
        return;
      }
      return result;
    } catch (error) {
      console.error('🚨 Network/Server Error:', error);
      alert('サーバーに接続できません。');
    }
  };
  return { authFetch };
}
