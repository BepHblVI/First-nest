'use client';
import { useState } from 'react';
import { useAuthfetch } from '../utils/authfetch';
import { Survey, SurveyAuthType } from '../types/survey';

type QuestionState = {
  qtext: string;
  type: string;
  required: boolean;
  options: string[];
};

type Props = {
  survey: Survey;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditSurveyModal({ survey, onClose, onUpdated }: Props) {
  const { authFetch } = useAuthfetch();
  const [title, setTitle] = useState(survey.title);
  const [auth, setAuth] = useState<SurveyAuthType>(survey.auth);
  const [tokenCount, setTokenCount] = useState(survey.tokens?.length ?? 0);
  const [questions, setQuestions] = useState<QuestionState[]>(
    survey.questions.map((q) => ({
      qtext: q.qtext,
      type: q.type,
      required: q.required ?? false,
      options: q.options?.map((o) => o.text) || [],
    })),
  );
  const [saving, setSaving] = useState(false);

  // 回答済みかどうか
  const hasSubmissions = (survey.submissions?.length ?? 0) > 0;

  // 質問操作
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

  const addQuestion = () => {
    setQuestions([...questions, { qtext: '', type: 'TEXT', required: false, options: [] }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return alert('質問は最低1つ必要です');
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('タイトルを入力してください');
    if (questions.some((q) => !q.qtext.trim())) {
      return alert('未入力の質問があります');
    }
    if (
      questions.some(
        (q) => q.type !== 'TEXT' && (q.options.length === 0 || q.options.some((o) => !o.trim())),
      )
    ) {
      return alert('選択式の質問には選択肢を入力してください');
    }
    if (auth === 'PRIVATE' && tokenCount <= 0) {
      return alert('招待制の場合はトークン発行数を1以上にしてください');
    }

    setSaving(true);

    const result = await authFetch(
      `
        mutation EditSurvey($input: EditSurveyInput!) {
          editSurvey(input: $input) {
            id
            title
            auth
            published
            questions { 
              id 
              qtext 
              type 
              required 
              options { id text } 
            }
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
            required: q.required,
            options: q.type !== 'TEXT' ? q.options : [],
          })),
          auth,
          tokens: auth === 'PRIVATE' ? tokenCount : 0,
        },
      },
    );

    setSaving(false);

    if (result?.data) {
      alert('アンケートを更新しました!');
      onUpdated();
      onClose();
    }
    // result が null や errors があれば authFetch 側で alert される
  };

  // 回答済みアンケートの場合は編集不可の警告画面
  if (hasSubmissions) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, maxWidth: '500px' }}>
          <div style={headerStyle}>
            <h2 style={{ margin: 0 }}>⚠️ 編集できません</h2>
            <button onClick={onClose} style={closeButtonStyle}>
              ✕
            </button>
          </div>
          <div
            style={{
              padding: '20px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
              border: '1px solid #ffc107',
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              「{survey.title}」には既に回答があります。
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              回答済みのアンケートを編集すると、過去の集計結果との整合性が取れなくなるため、
              編集機能は利用できません。
            </p>
          </div>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            💡 似た内容のアンケートを作成したい場合は、新規作成をご利用ください。
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>📝 アンケートを編集</h2>
          <button onClick={onClose} style={closeButtonStyle}>
            ✕
          </button>
        </div>

        {/* 注意メッセージ */}
        <div
          style={{
            padding: '10px 15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#004085',
            marginBottom: '20px',
            border: '1px solid #b8daff',
          }}
        >
          💡 公開状態の切替はアンケート一覧画面のボタンで行えます
        </div>

        {/* タイトル */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>タイトル</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </div>

        {/* 認証方式 */}
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
          }}
        >
          <label style={labelStyle}>回答者の認証</label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={auth}
              onChange={(e) => {
                const value = e.target.value as SurveyAuthType;
                setAuth(value);
                if (value === 'PUBLIC') setTokenCount(0);
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
            <p style={{ fontSize: '12px', color: '#e67e22', marginTop: '8px', marginBottom: 0 }}>
              ⚠️ 編集を保存すると、既存のトークンは破棄され新しく発行されます
            </p>
          )}
        </div>

        {/* 質問リスト */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>質問リスト</label>

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
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
                <button onClick={() => removeQuestion(qIndex)} style={removeButtonStyle}>
                  ✕
                </button>
              </div>

              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {/* 質問タイプ */}
                <div>
                  <label style={{ fontSize: '13px', marginRight: '6px' }}>形式:</label>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestionType(qIndex, e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="TEXT">テキスト入力</option>
                    <option value="SINGLE">単一選択(ラジオ)</option>
                    <option value="MULTIPLE">複数選択(チェック)</option>
                  </select>
                </div>

                {/* 必須チェック */}
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
                    checked={q.required}
                    onChange={() => toggleQuestionRequired(qIndex)}
                  />
                  <span style={{ color: q.required ? '#dc3545' : '#666' }}>必須にする</span>
                </label>
              </div>

              {q.type !== 'TEXT' && (
                <div style={{ marginTop: '10px', paddingLeft: '15px' }}>
                  <label style={{ fontSize: '13px', color: '#666' }}>選択肢:</label>
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

        {/* 保存ボタン */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
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
    </div>
  );
}

// スタイル(再利用)
const overlayStyle: React.CSSProperties = {
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
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '30px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '80vh',
  overflowY: 'auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  display: 'block',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  boxSizing: 'border-box',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

const removeButtonStyle: React.CSSProperties = {
  backgroundColor: '#ff4444',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '8px 12px',
  cursor: 'pointer',
};
