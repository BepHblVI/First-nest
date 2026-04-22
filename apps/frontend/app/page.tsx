'use client';
import { useEffect, useState } from 'react';
import CreateSurvey from '../components/CreateSurvey';
import SurveyList from '../components/SurveyList';
import EditSurveyModal from '../components/EditSurveyModal';
import { useRouter } from 'next/navigation';
import { useAuthfetch } from '../utils/authfetch';

export default function Home() {
  const { authFetch } = useAuthfetch();
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<any>(null);

  const fetchSurveys = async () => {
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
          options { id text }
        }
        tokens {
          token
          isUsed
          createdAt
        }
      }
    }
  `);

    if (result?.data) {
      setSurveys(result.data.getSurvey);
    }
    setLoading(false);
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
