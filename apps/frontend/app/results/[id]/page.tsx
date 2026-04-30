'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthfetch } from '../../../utils/authfetch';
import { GetSurveyResultsQuery } from '../../../src/queries/getSurveyResults';
import { GetSurveysQuery } from '../../../src/queries/GetSurveys';
import type {
  GetSurveyResultsQuery as GetSurveyResultsQueryType,
  GetSurveysQuery as GetSurveysQueryType,
} from '../../../src/gql/graphql';

// ★ 自動生成型から各種型を抽出
type SurveyResults = GetSurveyResultsQueryType['getSurveyResults'];
type SurveyToken = NonNullable<GetSurveysQueryType['getSurvey'][number]['tokens']>[number];

export default function ResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { authFetch } = useAuthfetch();
  const [data, setData] = useState<SurveyResults | null>(null);
  const [tokens, setTokens] = useState<SurveyToken[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const result = await authFetch(GetSurveyResultsQuery, {
      shareId: id as string,
    });

    if (result?.data) {
      setData(result.data.getSurveyResults);
    }
    setLoading(false);
  }, [authFetch, id]);

  const fetchTokens = useCallback(async () => {
    const result = await authFetch(GetSurveysQuery);

    if (result?.data) {
      const survey = result.data.getSurvey.find((s) => s.shareId === id);
      if (survey?.tokens) {
        setTokens(survey.tokens);
      }
    }
  }, [authFetch, id]);

  useEffect(() => {
    fetchResults();
    fetchTokens();
  }, [fetchResults, fetchTokens]);

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    alert('トークンをコピーしました！');
  };

  if (loading) return <div style={{ padding: '40px' }}>集計中...</div>;
  if (!data) return <div style={{ padding: '40px' }}>データが見つかりません。</div>;

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <button onClick={() => router.back()} style={{ marginBottom: '20px', cursor: 'pointer' }}>
        ← 戻る
      </button>

      <h1>📊 「{data.title}」の集計結果</h1>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>総回答者数: {data.totalSubmissions} 名</p>

      {/* トークン管理セクション */}
      {tokens.length > 0 && (
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            border: '2px solid #e67e22',
            borderRadius: '10px',
            backgroundColor: '#fff8f0',
          }}
        >
          <h2 style={{ color: '#e67e22', marginBottom: '15px' }}>
            🔑 招待トークン管理（{tokens.filter((t) => t.isUsed).length}/{tokens.length} 使用済み）
          </h2>

          <div style={{ display: 'grid', gap: '10px' }}>
            {tokens.map((t, index) => (
              <div
                key={t.token}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: t.isUsed ? '#f0f0f0' : 'white',
                  border: `1px solid ${t.isUsed ? '#ccc' : '#e67e22'}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>#{index + 1} </span>
                  <code
                    style={{
                      fontSize: '12px',
                      backgroundColor: '#f5f5f5',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {t.token}
                  </code>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginLeft: '10px',
                  }}
                >
                  {t.isUsed ? (
                    <span
                      style={{
                        color: '#28a745',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      ✅ 回答済み
                    </span>
                  ) : (
                    <>
                      <span
                        style={{
                          color: '#e67e22',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        ⏳ 未使用
                      </span>
                      <button
                        onClick={() => copyToken(t.token)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                        }}
                      >
                        コピー
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 質問ごとの集計 */}
      {data.questions.map((q) => (
        <div
          key={q.questionId}
          style={{
            marginTop: '40px',
            padding: '20px',
            border: '1px solid #eee',
            borderRadius: '10px',
          }}
        >
          <h3 style={{ borderLeft: '5px solid #0070f3', paddingLeft: '10px' }}>{q.qtext}</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            有効回答数: {q.totalAnswersForThisQuestion}
          </p>

          <div style={{ marginTop: '20px' }}>
            {q.options.map((opt) => (
              <div key={opt.optionId} style={{ marginBottom: '15px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    marginBottom: '5px',
                  }}
                >
                  <span>{opt.text}</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {opt.count}票 ({opt.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#eee',
                    borderRadius: '10px',
                    height: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${opt.percentage}%`,
                      backgroundColor: '#0070f3',
                      height: '100%',
                      transition: 'width 0.5s ease-in-out',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
