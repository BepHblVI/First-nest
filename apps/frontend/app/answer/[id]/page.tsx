'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { graphqlFetch } from '../../../utils/gqlFetch';
import { GetSurveyForAnswerQuery, SubmitSurveyAnswerMutation } from '../../../src/queries/answer';
import type {
  GetSurveyForAnswerQuery as GetSurveyForAnswerQueryType,
  SubmitSurveyAnswerInput,
} from '../../../src/gql/graphql';

// Codegen 生成の型から派生 ── 手書き type を撤去
type SurveyData = NonNullable<GetSurveyForAnswerQueryType['getSurveyForAnswer']>;

type AnswerState = {
  [questionId: number]: {
    text?: string;
    selectionIds?: number[];
  };
};

type PageStatus = 'loading' | 'ready' | 'unpublished' | 'notfound' | 'submitted' | 'needToken';

export default function AnswerPage() {
  const params = useParams<{ id: string }>();
  const shareId = params.id;

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [inviteToken, setInviteToken] = useState('');

  useEffect(() => {
    if (!shareId) return;

    (async () => {
      try {
        const result = await graphqlFetch(GetSurveyForAnswerQuery, { shareId });

        if (result.data?.getSurveyForAnswer) {
          const surveyData = result.data.getSurveyForAnswer;
          setSurvey(surveyData);
          setPageStatus(surveyData.auth === 'PRIVATE' ? 'needToken' : 'ready');
        } else if (result.errors) {
          const errorMessage = result.errors[0]?.message ?? '';
          setPageStatus(errorMessage === 'このアンケートは非公開です' ? 'unpublished' : 'notfound');
        } else {
          setPageStatus('notfound');
        }
      } catch (error) {
        console.error('取得エラー:', error);
        setPageStatus('notfound');
      }
    })();
  }, [shareId]);

  const handleTokenSubmit = () => {
    if (!inviteToken.trim()) return alert('招待トークンを入力してください');
    setPageStatus('ready');
  };

  const handleTextChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text },
    }));
  };

  const handleSingleSelect = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectionIds: [optionId] },
    }));
  };

  const handleMultipleSelect = (questionId: number, optionId: number, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.selectionIds ?? [];
      const updated = checked ? [...current, optionId] : current.filter((id) => id !== optionId);
      return {
        ...prev,
        [questionId]: { ...prev[questionId], selectionIds: updated },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    const unanswered = survey.questions.filter((q) => {
      const answer = answers[q.id];
      if (!answer) return true;
      if (q.type === 'TEXT' && !answer.text?.trim()) return true;
      if (q.type !== 'TEXT' && (!answer.selectionIds || answer.selectionIds.length === 0))
        return true;
      return false;
    });

    if (unanswered.length > 0) return alert('未回答の質問があります');

    setSubmitting(true);

    try {
      // any を撤廃、Codegen の Input 型をそのまま使用
      const input: SubmitSurveyAnswerInput = {
        surveyId: survey.id,
        answers: survey.questions.map((q) => ({
          questionId: q.id,
          text: answers[q.id]?.text ?? null,
          selectionIds: answers[q.id]?.selectionIds ?? null,
        })),
        ...(survey.auth === 'PRIVATE' && inviteToken ? { token: inviteToken } : {}),
      };

      const result = await graphqlFetch(SubmitSurveyAnswerMutation, { input });

      if (result.errors) {
        alert(`送信エラー: ${result.errors[0]?.message}`);
        return;
      }

      if (result.data?.submitSurveyAnswer) {
        setPageStatus('submitted');
      }
    } catch (error) {
      console.error('送信エラー:', error);
      alert('回答の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // === 表示 (元のまま) ===

  if (pageStatus === 'loading') {
    return (
      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </main>
    );
  }

  if (pageStatus === 'unpublished') {
    return (
      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            padding: '40px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            backgroundColor: '#fff8f0',
          }}
        >
          <h1 style={{ color: '#e67e22' }}>🔒 非公開のアンケートです</h1>
          <p style={{ color: '#666' }}>作成者が公開設定にするまでお待ちください。</p>
        </div>
      </main>
    );
  }

  if (pageStatus === 'notfound') {
    return (
      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            padding: '40px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            backgroundColor: '#fff0f0',
          }}
        >
          <h1 style={{ color: '#e74c3c' }}>❌ アンケートが見つかりません</h1>
          <p style={{ color: '#666' }}>URLが正しいかご確認ください。</p>
        </div>
      </main>
    );
  }

  if (pageStatus === 'submitted') {
    return (
      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            padding: '40px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            backgroundColor: '#f0fff0',
          }}
        >
          <h1 style={{ color: '#28a745' }}>✅ 回答を送信しました!</h1>
          <p style={{ color: '#666' }}>ご協力ありがとうございました。</p>
        </div>
      </main>
    );
  }

  if (pageStatus === 'needToken') {
    return (
      <main
        style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}
      >
        <div
          style={{
            padding: '30px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h1 style={{ color: '#0070f3', marginBottom: '10px' }}>{survey!.title}</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            このアンケートは招待者のみ回答できます。
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              🔑 招待トークンを入力してください
            </label>
            <input
              type="text"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="トークンを貼り付け..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
                fontSize: '14px',
              }}
            />
          </div>

          <button
            onClick={handleTokenSubmit}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            回答を開始する
          </button>
        </div>
      </main>
    );
  }

  // 回答フォーム
  return (
    <main
      style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}
    >
      <div
        style={{
          padding: '30px',
          border: '1px solid #ddd',
          borderRadius: '12px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h1 style={{ color: '#0070f3', marginBottom: '10px' }}>{survey!.title}</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>作成者: {survey!.owner.username}</p>

        {survey!.auth === 'PRIVATE' && (
          <p style={{ color: '#e67e22', fontSize: '14px', marginBottom: '20px' }}>
            🔑 招待トークンで認証済み
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {survey!.questions.map((q, index) => (
            <div key={q.id} style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Q{index + 1}. {q.qtext}
              </label>

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

              {q.type === 'SINGLE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((option) => (
                    <label
                      key={option.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
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

              {q.type === 'MULTIPLE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((option) => (
                    <label
                      key={option.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
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
            }}
          >
            {submitting ? '送信中...' : '回答を送信する'}
          </button>
        </form>
      </div>
    </main>
  );
}
