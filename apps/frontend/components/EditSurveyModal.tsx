'use client';
import { useState } from 'react';

type QuestionState = {
  qtext: string;
  type: string;
  options: string[];
};

type Survey = {
  id: number;
  title: string;
  questions: {
    id: number;
    qtext: string;
    type: string;
    options?: { id: number; text: string }[];
  }[];
};

type Props = {
  survey: Survey;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditSurveyModal({ survey, onClose, onUpdated }: Props) {
  const [title, setTitle] = useState(survey.title);
  const [isPublish, setIsPublish] = useState(false);
  const [questions, setQuestions] = useState<QuestionState[]>(
    survey.questions.map((q) => ({
      qtext: q.qtext,
      type: q.type,
      options: q.options?.map((o) => o.text) || [],
    })),
  );
  const [saving, setSaving] = useState(false);

  // 質問テキスト更新
  const updateQuestionText = (index: number, val: string) => {
    const updated = [...questions];
    const target = updated[index];
    if (!target) return;
    target.qtext = val;
    setQuestions(updated);
  };

  // 質問タイプ更新
  const updateQuestionType = (index: number, val: string) => {
    const updated = [...questions];
    const target = updated[index];
    if (!target) return;
    target.type = val;
    if (val === 'TEXT') target.options = [];
    setQuestions(updated);
  };

  // 選択肢の操作

  const changePublish = () => {
    isPublish ? setIsPublish(false) : setIsPublish(true);
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

  // 質問の追加・削除
  const addQuestion = () => {
    setQuestions([...questions, { qtext: '', type: 'TEXT', options: [] }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return alert('質問は最低1つ必要です');
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // 保存
  const handleSave = async () => {
    if (!title.trim()) return alert('タイトルを入力してください');
    if (questions.some((q) => !q.qtext.trim())) return alert('未入力の質問があります');
    if (
      questions.some(
        (q) => q.type !== 'TEXT' && (q.options.length === 0 || q.options.some((o) => !o.trim())),
      )
    ) {
      return alert('選択式の質問には選択肢を入力してください');
    }

    const token = localStorage.getItem('access_token');
    if (!token) return alert('ログインが必要です');

    setSaving(true);

    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation EditSurvey($input: EditSurveyInput!) {
              editSurvey(input: $input) {
                id
                title
                questions { id qtext type options { id text }}
                published
              }
            }
          `,
          variables: {
            input: {
              id: survey.id,
              title,
              questions: questions.map((q) => ({
                qtext: q.qtext,
                type: q.type,
                options: q.type !== 'TEXT' ? q.options : [],
              })),
              published: isPublish,
            },
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        alert(`エラー: ${result.errors[0].message}`);
        return;
      }

      alert('アンケートを更新しました！');
      onUpdated();
      onClose();
    } catch (error) {
      alert('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
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
          <h2 style={{ margin: 0 }}>📝 アンケートを編集</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* タイトル */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
            タイトル
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              boxSizing: 'border-box',
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        {/* 質問リスト */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
            質問リスト
          </label>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '12px',
                backgroundColor: '#fafafa',
              }}
            >
              {/* 質問テキスト + 削除ボタン */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  placeholder={`質問 ${qIndex + 1}`}
                  value={q.qtext}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
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

              {/* タイプ選択 */}
              <div style={{ marginTop: '8px' }}>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestionType(qIndex, e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="TEXT">テキスト入力</option>
                  <option value="RADIO">単一選択（ラジオ）</option>
                  <option value="CHECKBOX">複数選択（チェック）</option>
                </select>
              </div>

              {/* 選択肢 */}
              {q.type !== 'TEXT' && (
                <div style={{ marginTop: '10px', paddingLeft: '15px' }}>
                  {q.options.map((opt, oIndex) => (
                    <div
                      key={oIndex}
                      style={{
                        display: 'flex',
                        gap: '6px',
                        marginTop: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        placeholder={`選択肢 ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                        }}
                      />
                      <button
                        onClick={() => removeOption(qIndex, oIndex)}
                        style={{
                          background: '#ccc',
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
                    style={{ marginTop: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ＋ 選択肢を追加
                  </button>
                </div>
              )}
            </div>
          ))}

          <button onClick={addQuestion} style={{ cursor: 'pointer' }}>
            ＋ 質問を追加
          </button>
        </div>

        <button onClick={changePublish}>{isPublish ? '非公開にする' : '公開する'}</button>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: saving ? '#999' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '保存中...' : '変更を保存する'}
        </button>
      </div>
    </div>
  );
}
