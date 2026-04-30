// apps/frontend/src/app/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import CreateSurvey from '../components/CreateSurvey';
import SurveyList from '../components/SurveyList';
import EditSurveyModal from '../components/EditSurveyModal';
import { useRouter } from 'next/navigation';
import { useAuthfetch } from '../utils/authfetch';
import { GetSurveysQuery } from '../src/queries/GetSurveys';
import type { GetSurveysQuery as GetSurveysQueryType } from '../src/gql/graphql';

// ★ 自動生成された型から Survey 型を抽出
type Survey = GetSurveysQueryType['getSurvey'][number];

export default function Home() {
  const { authFetch } = useAuthfetch();
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    // ★ 文字列化したクエリを渡す（Phase 3でauthFetch改修後は .toString() 不要）
    const result = await authFetch(GetSurveysQuery);

    if (result?.data) {
      setSurveys(result.data.getSurvey);
    }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

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
          onEdit={setEditingSurvey}
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
