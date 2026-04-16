'use client';
import { useRouter } from 'next/navigation';

type Option = { id: number; text: string };

type Question = {
  id: number;
  qtext: string;
  type: string; // ← 追加
  options?: Option[]; // ← 追加
};

type Survey = {
  id: number;
  title: string;
  owner: { username: string };
  shareId: string;
  questions: Question[];
};

type Props = {
  surveys: Survey[];
  loading: boolean;
  onEdit: (survey: Survey) => void; // ← 追加
};

export default function SurveyList({ surveys, loading, onEdit }: Props) {
  const router = useRouter();

  if (loading) return <p>読み込み中...</p>;
  if (surveys.length === 0) return <p>アンケートが見つかりません</p>;

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URLをコピーしました！');
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {surveys.map((survey) => {
        const shareUrl =
          typeof window !== 'undefined' ? `${window.location.origin}/answer/${survey.shareId}` : '';

        return (
          <div
            key={survey.id}
            style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              position: 'relative',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>{survey.title}</h3>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  作成者: {survey.owner?.username || '不明'}
                </p>
              </div>

              {/* ボタンエリア */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* ✏️ 編集ボタン（追加） */}
                <button
                  onClick={() => onEdit(survey)}
                  style={{
                    backgroundColor: '#f0ad4e',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ✏️ 編集
                </button>

                {/* 📊 集計結果ボタン（既存） */}
                <button
                  onClick={() => router.push(`/results/${survey.shareId}`)}
                  style={{
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  📊 集計結果
                </button>
              </div>
            </div>

            {/* 🔗 共有URL */}
            <div
              style={{
                marginTop: '10px',
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
                コピー
              </button>
            </div>

            {/* 質問一覧 */}
            <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
              {survey.questions.map((q) => (
                <li key={q.id} style={{ marginBottom: '5px', fontSize: '14px' }}>
                  {q.qtext}
                  <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                    ({q.type === 'TEXT' ? 'テキスト' : q.type === 'RADIO' ? '単一選択' : '複数選択'}
                    )
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
