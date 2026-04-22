'use client';
import { useState } from 'react';
import { useAuthfetch } from '../utils/authfetch';

type QuestionState = {
  qtext: string;
  type: string;
  options: string[];
};

type Survey = {
  id: number;
  title: string;
  published: boolean;
  auth: string;
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
  const { authFetch } = useAuthfetch();
  const [title, setTitle] = useState(survey.title);
  const [isPublished, setIsPublished] = useState(survey.published);
  const [auth, setAuth] = useState(survey.auth);
  const [questions, setQuestions] = useState<QuestionState[]>(
    survey.questions.map((q) => ({
      qtext: q.qtext,
      type: q.type,
      options: q.options?.map((o) => o.text) || [],
    })),
  );
  const [saving, setSaving] = useState(false);

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
    if (val === 'TEXT') target.options = [];
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

  const addQuestion = () => {
    setQuestions([...questions, { qtext: '', type: 'TEXT', options: [] }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return alert('質問は最低1つ必要です');
    setQuestions(questions.filter((_, i) => i !== index));
  };

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

    setSaving(true);

    const result = await authFetch(
      `
        mutation EditSurvey($input: EditSurveyInput!) {
          editSurvey(input: $input) {
            id
            title
            published
            auth
            questions { id qtext type options { id text } }
          }
        }
      `,
      {
        input: {
          id: survey.id,
          title,
          questions: questions.map((q) => ({
            qtext: q.qtext,
            type: q.type,
            options: q.type !== 'TEXT' ? q.options : [],
          })),
          published: isPublished,
          auth,
        },
      },
    );

    setSaving(false);

    if (result?.data) {
      alert('アンケートを更新しました！');
      onUpdated();
      onClose();
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

        {/* 公開設定 */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>公開状態:</label>
            <button
              onClick={() => setIsPublished(!isPublished)}
              style={{
                padding: '8px 16px',
                backgroundColor: isPublished ? '#28a745' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {isPublished ? '🔓 公開中' : '🔒 非公開'}
            </button>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>回答認証:</label>
            <select
              value={auth}
              onChange={(e) => setAuth(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="PUBLIC">誰でも回答可能</option>
              <option value="PRIVATE">招待者のみ</option>
            </select>
          </div>
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

              <div style={{ marginTop: '8px' }}>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestionType(qIndex, e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="TEXT">テキスト入力</option>
                  <option value="SINGLE">単一選択（ラジオ）</option>
                  <option value="MULTIPLE">複数選択（チェック）</option>
                </select>
              </div>

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
