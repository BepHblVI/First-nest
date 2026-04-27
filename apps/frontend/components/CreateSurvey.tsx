'use client';
import { useState } from 'react';
import { useAuthfetch } from '../utils/authfetch';

type Props = {
  onSurveyCreated: () => void;
};

type QuestionField = {
  qtext: string;
  type: string;
  required: boolean; // ← 追加
  options: string[];
};

export default function CreateSurvey({ onSurveyCreated }: Props) {
  const { authFetch } = useAuthfetch();
  const [newTitle, setNewTitle] = useState('');
  const [auth, setAuth] = useState('PUBLIC');
  const [tokenCount, setTokenCount] = useState(0);
  const [published, setPublished] = useState(true);
  const [questions, setQuestions] = useState<QuestionField[]>([
    { qtext: '', type: 'TEXT', required: false, options: [] }, // ← required追加
  ]);

  const addQuestionField = () => {
    setQuestions([
      ...questions,
      { qtext: '', type: 'TEXT', required: false, options: [] }, // ← required追加
    ]);
  };

  const updateQuestionText = (index: number, val: string) => {
    const updated = [...questions];
    const target = updated[index];
    if (!target) return;
    target.qtext = val;
    setQuestions(updated);
  };

  const updateQuestionType = (index: number, val: string) => {
    const updated = [...questions];
    const target = updated[index];
    if (!target) return;
    target.type = val;
    if (val === 'TEXT') {
      target.options = [];
    }
    setQuestions(updated);
  };

  // ★ 追加: 必須チェック切り替え
  const toggleQuestionRequired = (index: number) => {
    const updated = [...questions];
    const target = updated[index];
    if (!target) return;
    target.required = !target.required;
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const target = updated[qIndex];
    if (!target) return;
    target.options.push('');
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, val: string) => {
    const updated = [...questions];
    const target = updated[qIndex];
    if (!target) return;
    target.options[oIndex] = val;
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    const target = updated[qIndex];
    if (!target) return;
    target.options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return alert('質問は最低1つ必要です');
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleCreateSurvey = async () => {
    if (!newTitle) return alert('タイトルを入力してください');
    if (questions.some((q) => !q.qtext)) return alert('未入力の質問があります');
    if (
      questions.some(
        (q) => q.type !== 'TEXT' && (q.options.length === 0 || q.options.some((o) => !o)),
      )
    ) {
      return alert('選択式の質問には選択肢を入力してください');
    }
    if (auth === 'PRIVATE' && tokenCount <= 0) {
      return alert('招待制の場合はトークン発行数を1以上にしてください');
    }

    const result = await authFetch(
      `
        mutation CreateSurvey($input: CreateSurveyInput!) {
          createSurvey(input: $input) {
            id
            title
            shareId
            auth
            published
            tokens {
              token
              isUsed
            }
          }
        }
      `,
      {
        input: {
          title: newTitle,
          questions: questions.map((q) => ({
            qtext: q.qtext,
            type: q.type,
            required: q.required, // ← 追加
            options: q.type !== 'TEXT' ? q.options : [],
          })),
          published,
          auth,
          tokens: auth === 'PRIVATE' ? tokenCount : 0,
        },
      },
    );

    if (result?.data) {
      const created = result.data.createSurvey;
      const stateLabel = created.published ? '公開' : '下書きとして保存';

      if (created.auth === 'PRIVATE' && created.tokens?.length > 0) {
        const tokenList = created.tokens.map((t: any) => t.token).join('\n');
        alert(
          `アンケートを${stateLabel}しました!\n\n` +
            `🔑 招待トークン(${created.tokens.length}個):\n${tokenList}\n\n` +
            `※ 集計結果ページからもコピーできます`,
        );
      } else {
        alert(`アンケートを${stateLabel}しました!`);
      }

      setNewTitle('');
      setAuth('PUBLIC');
      setTokenCount(0);
      setPublished(true);
      setQuestions([{ qtext: '', type: 'TEXT', required: false, options: [] }]);
      onSurveyCreated();
    }
  };

  return (
    <section
      style={{
        padding: '20px',
        border: '2px solid #0070f3',
        borderRadius: '10px',
        marginBottom: '40px',
      }}
    >
      <h2>1. 新規アンケート作成</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* タイトル */}
        <input
          placeholder="アンケートのタイトル"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ padding: '10px' }}
        />

        {/* 回答認証設定(既存) */}
        <div
          style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
          }}
        >
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
            回答者の認証:
          </label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <select
              value={auth}
              onChange={(e) => {
                setAuth(e.target.value);
                if (e.target.value === 'PUBLIC') setTokenCount(0);
              }}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="PUBLIC">🌐 誰でも回答可能</option>
              <option value="PRIVATE">🔑 招待者のみ</option>
            </select>

            {auth === 'PRIVATE' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '14px' }}>発行数:</label>
                <input
                  type="number"
                  min="1"
                  value={tokenCount}
                  onChange={(e) => setTokenCount(Number(e.target.value))}
                  style={{
                    width: '80px',
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
                <span style={{ fontSize: '13px', color: '#666' }}>個</span>
              </div>
            )}
          </div>

          {auth === 'PRIVATE' && (
            <p style={{ fontSize: '13px', color: '#e67e22', marginTop: '8px', marginBottom: 0 }}>
              ⚠️ 招待制では、発行したトークンを持つ人だけが回答できます。
              各トークンは1回のみ使用可能です。
            </p>
          )}
        </div>

        {/* 公開状態(既存) */}
        <div
          style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
          }}
        >
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
            公開設定:
          </label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="published"
                checked={published === true}
                onChange={() => setPublished(true)}
              />
              <span>🌐 公開して回答受付を開始</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="published"
                checked={published === false}
                onChange={() => setPublished(false)}
              />
              <span>📝 下書きとして保存</span>
            </label>
          </div>
          <p style={{ fontSize: '13px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
            {published
              ? '✅ 作成後すぐに共有リンクから回答を受け付けます'
              : '💡 下書きとして保存し、後で公開できます'}
          </p>
        </div>

        {/* 質問リスト */}
        <div>
          <label style={{ fontWeight: 'bold' }}>質問リスト:</label>
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              style={{
                marginTop: '15px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  placeholder={`質問 ${qIndex + 1}`}
                  value={question.qtext}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  style={{ flex: 1, padding: '8px' }}
                />
                <button
                  onClick={() => removeQuestion(qIndex)}
                  style={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* ★ 修正: 形式 + 必須チェックを横並び */}
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <label style={{ marginRight: '10px', fontSize: '14px' }}>回答形式:</label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestionType(qIndex, e.target.value)}
                    style={{ padding: '6px' }}
                  >
                    <option value="TEXT">テキスト入力</option>
                    <option value="SINGLE">単一選択(ラジオ)</option>
                    <option value="MULTIPLE">複数選択(チェックボックス)</option>
                  </select>
                </div>

                {/* ★ 追加: 必須チェック */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={() => toggleQuestionRequired(qIndex)}
                  />
                  <span style={{ color: question.required ? '#dc3545' : '#666' }}>必須にする</span>
                </label>
              </div>

              {question.type !== 'TEXT' && (
                <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <label style={{ fontSize: '14px', color: '#666' }}>選択肢:</label>
                  {question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        placeholder={`選択肢 ${oIndex + 1}`}
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        style={{ flex: 1, padding: '6px' }}
                      />
                      <button
                        onClick={() => removeOption(qIndex, oIndex)}
                        style={{
                          backgroundColor: '#ccc',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(qIndex)}
                    style={{ marginTop: '8px', fontSize: '13px' }}
                  >
                    ＋ 選択肢を追加
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addQuestionField}
            style={{
              marginTop: '8px',
              backgroundColor: '#0070f3',
              color: 'white',
              padding: '8px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            ＋ 質問を追加
          </button>
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleCreateSurvey}
          style={{
            backgroundColor: published ? '#0070f3' : '#888',
            color: 'white',
            padding: '12px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {published ? '🚀 アンケートを公開する' : '💾 下書きとして保存'}
        </button>
      </div>
    </section>
  );
}
