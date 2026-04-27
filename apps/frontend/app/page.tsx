'use client';
import { useEffect, useState, useCallback } from 'react';
import CreateSurvey from '../components/CreateSurvey';
import SurveyList from '../components/SurveyList';
import EditSurveyModal from '../components/EditSurveyModal';
import { useRouter } from 'next/navigation';
import { useAuthfetch } from '../utils/authfetch';
import type { Survey } from '../types/survey';

export default function Home() {
  const { authFetch } = useAuthfetch();
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]); // ★ 型指定
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null); // ★ 型指定

  // ★ useCallback で再生成を防ぐ + ESLint警告対策
  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    const result = await authFetch(`
      query {
        getSurvey {
          id
          title
          published
          auth
          owner { username }
          shareId
          questions {
            id
            qtext
            type
            required
            options { id text }
          }
          tokens {
            token
            isUsed
            createdAt
          }
          submissions {
            id
          }
        }
      }
    `);

    if (result?.data) {
      setSurveys(result.data.getSurvey);
    }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]); // ★ fetchSurveys を依存配列に

  const handleLogout = () => {
    if (!confirm('ログアウトしますか?')) return;
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <main
      style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
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
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          ログアウト
        </button>
      </div>

      <CreateSurvey onSurveyCreated={fetchSurveys} />

      <section>
        <h2>2. あなたの作成済みアンケート</h2>
        <SurveyList
          surveys={surveys}
          loading={loading}
          onEdit={setEditingSurvey} // ★ 型が合う
          onSurveyChanged={fetchSurveys}
        />
      </section>

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
