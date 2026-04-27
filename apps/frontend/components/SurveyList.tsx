'use client';
import { useRouter } from 'next/navigation';
import { useAuthfetch } from '../utils/authfetch';
import type { Survey } from '../types/survey';

type Props = {
  surveys: Survey[];
  loading: boolean;
  onEdit: (survey: Survey) => void;
  onSurveyChanged: () => void; // 削除・公開切替後の再取得用
};

export default function SurveyList({ surveys, loading, onEdit, onSurveyChanged }: Props) {
  const router = useRouter();
  const { authFetch } = useAuthfetch();

  if (loading) return <p>読み込み中...</p>;
  if (surveys.length === 0) return <p>アンケートが見つかりません</p>;

  // 共有URLをクリップボードにコピー
  const copyToClipboard = (text: string, label = 'URL') => {
    navigator.clipboard.writeText(text);
    alert(`${label}をコピーしました!`);
  };

  // 公開/非公開を切り替え
  const handleTogglePublished = async (survey: Survey) => {
    const action = survey.published ? '非公開' : '公開';
    if (!confirm(`このアンケートを「${action}」にしますか?`)) return;

    const result = await authFetch(
      `mutation TogglePublished($id: Int!, $published: Boolean!) {
        togglePublished(id: $id, published: $published) {
          id
          published
        }
      }`,
      { id: survey.id, published: !survey.published },
    );

    if (result?.data) {
      onSurveyChanged();
    }
  };

  // アンケート削除
  const handleDelete = async (survey: Survey) => {
    if (
      !confirm(
        `「${survey.title}」を削除しますか?\n\n` +
          '⚠️ この操作は取り消せません。\n' +
          '回答データもすべて削除されます。',
      )
    ) {
      return;
    }

    const result = await authFetch(
      `mutation DeleteSurvey($id: Int!) {
        deleteSurvey(id: $id)
      }`,
      { id: survey.id },
    );

    if (result?.data?.deleteSurvey) {
      alert('アンケートを削除しました');
      onSurveyChanged();
    }
  };

  // 招待トークン一覧を表示
  const showTokens = (survey: Survey) => {
    const tokens = survey.tokens?.filter((t) => !t.isUsed) ?? [];
    const usedCount = (survey.tokens?.length ?? 0) - tokens.length;

    if (tokens.length === 0) {
      alert(
        `🔑 招待トークン状況\n\n` +
          `未使用: 0個\n使用済: ${usedCount}個\n\n` +
          `すべてのトークンが使用されています。`,
      );
      return;
    }

    const tokenList = tokens.map((t) => t.token).join('\n');
    if (
      confirm(
        `🔑 未使用トークン (${tokens.length}個)\n\n` +
          `${tokenList}\n\n` +
          `クリップボードにコピーしますか?`,
      )
    ) {
      copyToClipboard(tokenList, 'トークン一覧');
    }
  };

  // 質問タイプのラベル
  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'TEXT':
        return 'テキスト';
      case 'SINGLE':
        return '単一選択';
      case 'MULTIPLE':
        return '複数選択';
      default:
        return type;
    }
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {surveys.map((survey) => {
        const shareUrl =
          typeof window !== 'undefined' ? `${window.location.origin}/answer/${survey.shareId}` : '';

        const isPrivate = survey.auth === 'PRIVATE';
        const tokenCount = survey.tokens?.length ?? 0;
        const unusedTokens = survey.tokens?.filter((t) => !t.isUsed).length ?? 0;

        return (
          <div
            key={survey.id}
            style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              position: 'relative',
              opacity: survey.published ? 1 : 0.7, // 下書きは少し薄く
              backgroundColor: survey.published ? '#fff' : '#f9f9f9',
            }}
          >
            {/* タイトル + ステータスバッジ */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
                >
                  <h3 style={{ margin: 0, color: '#0070f3' }}>{survey.title}</h3>

                  {/* 公開状態バッジ */}
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: survey.published ? '#d4edda' : '#e9ecef',
                      color: survey.published ? '#155724' : '#666',
                      fontWeight: 'bold',
                    }}
                  >
                    {survey.published ? '● 公開中' : '○ 下書き'}
                  </span>

                  {/* 認証方式バッジ */}
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: isPrivate ? '#fff3cd' : '#cce5ff',
                      color: isPrivate ? '#856404' : '#004085',
                    }}
                  >
                    {isPrivate ? '🔑 招待制' : '🌐 公開'}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
                  作成者: {survey.owner?.username || '不明'}
                </p>
              </div>

              {/* 操作ボタン群 */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {/* 公開/非公開切替 */}
                <button
                  onClick={() => handleTogglePublished(survey)}
                  style={{
                    backgroundColor: survey.published ? '#888' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  title={survey.published ? '回答受付を停止' : '回答受付を開始'}
                >
                  {survey.published ? '⏸ 非公開化' : '▶ 公開する'}
                </button>

                {/* 編集 */}
                <button
                  onClick={() => onEdit(survey)}
                  style={{
                    backgroundColor: '#f0ad4e',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  ✏️ 編集
                </button>

                {/* 集計結果 */}
                <button
                  onClick={() => router.push(`/results/${survey.shareId}`)}
                  style={{
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  📊 集計
                </button>

                {/* 削除 */}
                <button
                  onClick={() => handleDelete(survey)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  🗑️ 削除
                </button>
              </div>
            </div>

            {/* 共有URL(公開中のみ表示) */}
            {survey.published && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px',
                  backgroundColor: '#f0f7ff',
                  borderRadius: '4px',
                  fontSize: '13px',
                  border: '1px dashed #0070f3',
                }}
              >
                <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                  配布用URL:
                </span>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0070f3', wordBreak: 'break-all' }}
                >
                  {shareUrl}
                </a>
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  📋 コピー
                </button>
              </div>
            )}

            {/* 招待トークン情報(PRIVATE のみ) */}
            {isPrivate && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fff8e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  border: '1px dashed #ffc107',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  🔑 招待トークン: 全{tokenCount}個 (未使用 {unusedTokens} / 使用済{' '}
                  {tokenCount - unusedTokens})
                </span>
                <button
                  onClick={() => showTokens(survey)}
                  style={{
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    border: '1px solid #ffc107',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                  }}
                >
                  トークンを表示
                </button>
              </div>
            )}

            {/* 下書き時のメッセージ */}
            {!survey.published && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#856404',
                }}
              >
                💡 下書き状態です。公開すると共有URLから回答を受け付けます。
              </div>
            )}

            {/* 質問一覧 */}
            <details style={{ marginTop: '12px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#666' }}>
                質問一覧 ({survey.questions.length}問)
              </summary>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                {survey.questions.map((q, i) => (
                  <li key={q.id} style={{ marginBottom: '6px', fontSize: '14px' }}>
                    <span>
                      {i + 1}. {q.qtext}
                    </span>
                    <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                      ({getQuestionTypeLabel(q.type)})
                    </span>
                    {q.required && (
                      <span
                        style={{
                          color: '#dc3545',
                          fontSize: '11px',
                          marginLeft: '6px',
                          fontWeight: 'bold',
                        }}
                      >
                        必須
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </div>
  );
}
