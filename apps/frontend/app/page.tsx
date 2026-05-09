'use client';
import { useEffect, useState, useCallback } from 'react';
import CreateSurvey from '../components/CreateSurvey';
import SurveyList from '../components/SurveyList';
import EditSurveyModal from '../components/EditSurveyModal';
import SearchPanel from '../components/SearchPanel';
import { useRouter } from 'next/navigation';
import { useAuthfetch } from '../utils/authfetch';
import { SearchSurveysQuery } from '../src/queries/searchSurveys';
import type {
  SearchSurveysQuery as SearchSurveysQueryType,
  SearchSurveyInput,
} from '../src/gql/graphql';
import { SearchScope, SortOrder, SurveySortField } from '../src/gql/graphql';

type Survey = SearchSurveysQueryType['searchSurvey']['items'][number];

const PAGE_SIZE = 10;

const initialInput: SearchSurveyInput = {
  keyword: '',
  scope: SearchScope.TitleOnly,
  publishStates: [],
  authTypes: [],
  answerStates: [],
  createdAt: null,
  submissionCount: null,
  sortBy: SurveySortField.CreatedAt,
  order: SortOrder.Desc,
  limit: PAGE_SIZE,
  offset: 0,
};

export default function Home() {
  const { authFetch } = useAuthfetch();
  const router = useRouter();

  const [input, setInput] = useState<SearchSurveyInput>(initialInput);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  const fetchSurveys = useCallback(
    async (current: SearchSurveyInput) => {
      setLoading(true);
      const result = await authFetch(SearchSurveysQuery, { input: current });
      if (result?.data) {
        setSurveys(result.data.searchSurvey.items);
        setTotalCount(result.data.searchSurvey.totalCount);
        setHasNext(result.data.searchSurvey.hasNext);
      }
      setLoading(false);
    },
    [authFetch],
  );

  // 初回ロード & input が変わるたびに再検索
  useEffect(() => {
    fetchSurveys(input);
  }, [input, fetchSurveys]);

  const handleSearch = () => {
    // SearchPanel の onChange で input は既に更新済みなので、明示的に再取得
    fetchSurveys({ ...input, offset: 0 });
    setInput((p) => ({ ...p, offset: 0 }));
  };

  const handleReset = () => {
    setInput(initialInput);
  };

  const handlePage = (nextOffset: number) => {
    setInput((p) => ({ ...p, offset: nextOffset }));
  };

  const handleLogout = () => {
    if (!confirm('ログアウトしますか?')) return;
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const currentPage = Math.floor(input.offset! / input.limit!) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / input.limit!));

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
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
            borderRadius: 4,
          }}
        >
          ログアウト
        </button>
      </div>

      <CreateSurvey onSurveyCreated={() => fetchSurveys(input)} />

      <section>
        <h2>2. あなたの作成済みアンケート</h2>

        <SearchPanel
          value={input}
          onChange={setInput}
          onSubmit={handleSearch}
          onReset={handleReset}
        />

        <div style={{ margin: '8px 0', fontSize: 13, color: '#666' }}>
          {loading ? '検索中...' : `${totalCount}件ヒット`}
        </div>

        <SurveyList
          surveys={surveys}
          loading={loading}
          onEdit={setEditingSurvey}
          onSurveyChanged={() => fetchSurveys(input)}
        />

        {/* ページング */}
        {totalCount > 0 && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <button
              disabled={input.offset === 0}
              onClick={() => handlePage(Math.max(0, input.offset! - input.limit!))}
            >
              ← 前へ
            </button>
            <span>
              {currentPage} / {totalPages} ページ
            </span>
            <button disabled={!hasNext} onClick={() => handlePage(input.offset! + input.limit!)}>
              次へ →
            </button>
          </div>
        )}
      </section>

      {editingSurvey && (
        <EditSurveyModal
          survey={editingSurvey}
          onClose={() => setEditingSurvey(null)}
          onUpdated={() => fetchSurveys(input)}
        />
      )}
    </main>
  );
}
