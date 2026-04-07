// apps/frontend/app/results/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchResults = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          // 💡 query の引数を String に変更し、名前も shareId に
          query: `
            query GetResults($shareId: String!) {
              getSurveyResults(shareId: $shareId) {
                surveyId
                title
                totalSubmissions
                questions {
                  questionId
                  qtext
                  totalAnswersForThisQuestion
                  options {
                    optionId
                    text
                    count
                    percentage
                  }
                }
              }
            }
          `,
          variables: { shareId: id as string } // 💡 id(UUID)を文字列として渡す
        }),
      });
      const result = await response.json();
      if (result.errors) {
        console.error('GraphQL Error:', result.errors);
        setErrorMsg(result.errors[0].message);
        return;
      }
      if (result.data) {
        setData(result.data.getSurveyResults);
      }
    } catch (error) {
      console.error('Network Error:', error);
      setErrorMsg('ネットワークエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(); }, [id]);

  if (loading) return <div style={{ padding: '40px' }}>集計中...</div>;
  if (!data) return <div style={{ padding: '40px' }}>データが見つかりません。</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.back()} style={{ marginBottom: '20px', cursor: 'pointer' }}>← 戻る</button>
      
      <h1>📊 「{data.title}」の集計結果</h1>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>総回答者数: {data.totalSubmissions} 名</p>

      {data.questions.map((q: any) => (
        <div key={q.questionId} style={{ marginTop: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '10px' }}>
          <h3 style={{ borderLeft: '5px solid #0070f3', paddingLeft: '10px' }}>{q.qtext}</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>有効回答数: {q.totalAnswersForThisQuestion}</p>
          
          <div style={{ marginTop: '20px' }}>
            {q.options.map((opt: any) => (
              <div key={opt.optionId} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                  <span>{opt.text}</span>
                  <span style={{ fontWeight: 'bold' }}>{opt.count}票 ({opt.percentage.toFixed(1)}%)</span>
                </div>
                {/* 📊 簡易的な棒グラフ */}
                <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${opt.percentage}%`, 
                    backgroundColor: '#0070f3', 
                    height: '100%', 
                    transition: 'width 0.5s ease-in-out' 
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}