'use client';
import { useEffect, useState } from 'react';
import CreateSurvey from '../components/CreateSurvey';
import SurveyList from '../components/SurveyList';
import EditSurveyModal from '../components/EditSurveyModal';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<any>(null); // ← 追加

  const fetchSurveys = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');

    if (!token) {
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
          query: `
            query {
              getSurvey {
                id
                title
                owner { username }
                shareId
                questions {
                  id
                  qtext
                  type
                  options { id text }
                }
              }
            }
          `,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('❌ GraphQL Errors:', result.errors);

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

      if (result.data) {
        setSurveys(result.data.getSurvey);
      }
    } catch (error) {
      console.error('🚨 Network/Server Error:', error);
      alert('サーバーに接続できません。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <main
      style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1>📊 マイ・アンケート管理</h1>
        <button onClick={handleLogout} style={{ padding: '8px', cursor: 'pointer' }}>
          ログアウト
        </button>
      </div>

      <CreateSurvey onSurveyCreated={fetchSurveys} />

      <section>
        <h2>2. あなたの作成済みアンケート</h2>
        <SurveyList
          surveys={surveys}
          loading={loading}
          onEdit={(survey: any) => setEditingSurvey(survey)}
          // ↑ 編集ボタン押下時のコールバックを追加
        />
      </section>

      {/* 編集モーダル */}
      {editingSurvey && (
        <EditSurveyModal
          survey={editingSurvey}
          onClose={() => setEditingSurvey(null)}
          onUpdated={fetchSurveys}
        />
      )}
    </main>
  );
}
