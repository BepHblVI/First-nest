'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Option = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  qtext: string;
  type: string;
  options: Option[];
};

type SurveyData = {
  id: number;
  title: string;
  owner: { username: string };
  questions: Question[];
};

// 各質問への回答を管理する型
type AnswerState = {
  [questionId: number]: {
    text?: string;
    selectionIds?: number[];
  };
};

export default function AnswerPage() {
  const params = useParams();
  const shareId = params.id;

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<AnswerState>({});

  // アンケートデータを取得
  useEffect(() => {
    if (!shareId) return;

    const fetchSurvey = async () => {
      try {
        const response = await fetch('http://localhost:3001/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetSurveyForAnswer($shareId: String!) {
                getSurveyForAnswer(shareId: $shareId) {
                  id
                  title
                  owner { username }
                  questions {
                    id
                    qtext
                    type
                    options { id text }
                  }
                }
              }
            `,
            variables: { shareId },
          }),
        });

        const result = await response.json();
        if (result.data?.getSurveyForAnswer) {
          setSurvey(result.data.getSurveyForAnswer);
        } else {
          alert('アンケートが見つかりませんでした');
        }
      } catch (error) {
        console.error('取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [shareId]);

  // テキスト回答を更新
  const handleTextChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text },
    }));
  };

  // 単一選択（ラジオ）を更新
  const handleSingleSelect = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectionIds: [optionId] },
    }));
  };

  // 複数選択（チェックボックス）を更新
  const handleMultipleSelect = (questionId: number, optionId: number, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.selectionIds || [];
      const updated = checked
        ? [...current, optionId]
        : current.filter((id) => id !== optionId);
      return {
        ...prev,
        [questionId]: { ...prev[questionId], selectionIds: updated },
      };
    });
  };

  // 回答を送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // バリデーション
    const unanswered = survey.questions.filter((q) => {
      const answer = answers[q.id];
      if (!answer) return true;
      if (q.type === 'TEXT' && !answer.text?.trim()) return true;
      if (q.type !== 'TEXT' && (!answer.selectionIds || answer.selectionIds.length === 0)) return true;
      return false;
    });

    if (unanswered.length > 0) {
      return alert('未回答の質問があります');
    }

    setSubmitting(true);

    try {
      // バックエンドの AnswerInputType に合わせて整形
      const formattedAnswers = survey.questions.map((q) => ({
        questionId: q.id,
        text: answers[q.id]?.text || null,
        selectionIds: answers[q.id]?.selectionIds || null,
      }));

      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation SubmitSurveyAnswer($surveyId: Int!, $answers: [AnswerInputType!]!) {
              submitSurveyAnswer(input:$input) {
                id
                submitted_at
              }
            }
          `,
          variables: {
            input:{
            surveyId: survey.id,
            answers: formattedAnswers,
            },
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        alert(`送信エラー: ${result.errors[0].message}`);
        return;
      }

      if (result.data?.submitSurveyAnswer) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('送信エラー:', error);
      alert('回答の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 表示 ---

  if (loading) return <p style={{ padding: '20px' }}>読み込み中...</p>;
  if (!survey) return <p style={{ padding: '20px' }}>アンケートが存在しないか、削除されました。</p>;

  // 送信完了画面
  if (submitted) {
    return (
      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ padding: '40px', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#f0fff0' }}>
          <h1 style={{ color: '#28a745', marginBottom: '15px' }}>✅ 回答を送信しました！</h1>
          <p style={{ color: '#666' }}>ご協力ありがとうございました。</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '30px', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
        <h1 style={{ color: '#0070f3', marginBottom: '10px' }}>{survey.title}</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>作成者: {survey.owner.username}</p>

        <form onSubmit={handleSubmit}>
          {survey.questions.map((q, index) => (
            <div key={q.id} style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Q{index + 1}. {q.qtext}
              </label>

              {/* テキスト入力 */}
              {q.type === 'TEXT' && (
                <textarea
                  placeholder="回答を入力してください..."
                  value={answers[q.id]?.text || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {/* 単一選択（ラジオボタン） */}
              {q.type === 'SINGLE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((option) => (
                    <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={answers[q.id]?.selectionIds?.[0] === option.id}
                        onChange={() => handleSingleSelect(q.id, option.id)}
                      />
                      {option.text}
                    </label>
                  ))}
                </div>
              )}

              {/* 複数選択（チェックボックス） */}
              {q.type === 'MULTIPLE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((option) => (
                    <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={answers[q.id]?.selectionIds?.includes(option.id) || false}
                        onChange={(e) => handleMultipleSelect(q.id, option.id, e.target.checked)}
                      />
                      {option.text}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: submitting ? '#999' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginTop: '10px',
            }}
          >
            {submitting ? '送信中...' : '回答を送信する'}
          </button>
        </form>
      </div>
    </main>
  );
}