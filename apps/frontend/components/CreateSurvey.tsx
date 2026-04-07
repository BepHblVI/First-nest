'use client';
import { useState } from 'react';

type Props = {
  onSurveyCreated: () => void;
};

// バックエンドの QuestionInput に対応する型
type QuestionField = {
  qtext: string;
  type: string;        // 'TEXT' | 'SINGLE' | 'MULTIPLE' など
  options: string[];   // 選択肢（typeがTEXT以外の場合に使用）
};

export default function CreateSurvey({ onSurveyCreated }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionField[]>([
    { qtext: '', type: 'TEXT', options: [] },
  ]);

  // 質問フィールドを追加
  const addQuestionField = () => {
    setQuestions([...questions, { qtext: '', type: 'TEXT', options: [] }]);
  };

  // 質問テキストを更新
const updateQuestionText = (index: number, val: string) => {
  const updated = [...questions];
  const target = updated[index];
  if (!target) return;  // ← ガード追加
  target.qtext = val;
  setQuestions(updated);
};

// 質問タイプを更新
const updateQuestionType = (index: number, val: string) => {
  const updated = [...questions];
  const target = updated[index];
  if (!target) return;  // ← ガード追加
  target.type = val;
  if (val === 'TEXT') {
    target.options = [];
  }
  setQuestions(updated);
};

// 選択肢を追加
const addOption = (qIndex: number) => {
  const updated = [...questions];
  const target = updated[qIndex];
  if (!target) return;  // ← ガード追加
  target.options.push('');
  setQuestions(updated);
};

// 選択肢を更新
const updateOption = (qIndex: number, oIndex: number, val: string) => {
  const updated = [...questions];
  const target = updated[qIndex];
  if (!target) return;  // ← ガード追加
  target.options[oIndex] = val;
  setQuestions(updated);
};

// 選択肢を削除
const removeOption = (qIndex: number, oIndex: number) => {
  const updated = [...questions];
  const target = updated[qIndex];
  if (!target) return;  // ← ガード追加
  target.options.splice(oIndex, 1);
  setQuestions(updated);
};

  // 質問を削除
  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return alert('質問は最低1つ必要です');
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleCreateSurvey = async () => {
    // バリデーション
    if (!newTitle) return alert('タイトルを入力してください');
    if (questions.some((q) => !q.qtext)) return alert('未入力の質問があります');
    if (
      questions.some(
        (q) =>
          q.type !== 'TEXT' &&
          (q.options.length === 0 || q.options.some((o) => !o))
      )
    ) {
      return alert('選択式の質問には選択肢を入力してください');
    }

    const token = localStorage.getItem('access_token');
    if (!token) return alert('ログインが必要です！');

    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation CreateSurvey($title: String!, $questions: [QuestionInput!]!) {
              createSurvey(title: $title, questions: $questions) {
                id
                title
                shareId
              }
            }
          `,
          variables: {
            title: newTitle,
            questions: questions.map((q) => ({
              qtext: q.qtext,
              type: q.type,
              options: q.type !== 'TEXT' ? q.options : [],
            })),
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        alert(`エラー: ${result.errors[0].message}`);
        return;
      }

      if (result.data) {
        alert('アンケートを作成しました！');
        setNewTitle('');
        setQuestions([{ qtext: '', type: 'TEXT', options: [] }]);
        onSurveyCreated();
      }
    } catch (error) {
      alert('作成失敗');
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
              {/* 質問テキスト */}
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

              {/* 質問タイプ選択 */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ marginRight: '10px', fontSize: '14px' }}>回答形式:</label>
                <select
                  value={question.type}
                  onChange={(e) => updateQuestionType(qIndex, e.target.value)}
                  style={{ padding: '6px' }}
                >
                  <option value="TEXT">テキスト入力</option>
                  <option value="SINGLE">単一選択（ラジオ）</option>
                  <option value="MULTIPLE">複数選択（チェックボックス）</option>
                </select>
              </div>

              {/* 選択肢（TEXT以外の場合に表示） */}
              {question.type !== 'TEXT' && (
                <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <label style={{ fontSize: '14px', color: '#666' }}>選択肢:</label>
                  {question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}
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

          <button onClick={addQuestionField} style={{ marginTop: '15px' }}>
            ＋ 質問を追加
          </button>
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleCreateSurvey}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '12px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          アンケートを保存する
        </button>
      </div>
    </section>
  );
}