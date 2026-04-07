'use client';
import { useRouter } from 'next/navigation';

type Question = { id: number; qtext: string };
// 💡 shareId を追加
type Survey = { id: number; title: string; owner: { 
    username: string 
  }; shareId: string; questions: Question[] };

type Props = {
  surveys: Survey[];
  loading: boolean;
};

export default function SurveyList({ surveys, loading }: Props) {
  const router = useRouter();
  
  if (loading) return <p>読み込み中...</p>;
  if (surveys.length === 0) return <p>アンケートが見つかりません</p>;

  // クリップボードにコピーする機能（おまけ）
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URLをコピーしました！');
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {surveys.map((survey) => {
        // 🎫 その場のアドレス（origin）を使って回答用URLを組み立てる
        const shareUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/answer/${survey.shareId}`
          : '';

        return (
          <div key={survey.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', position: 'relative' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>{survey.title}</h3>
                  <p style={{ fontSize: '12px', color: '#666' }}>作成者: {survey.owner?.username || '不明'}</p>
               </div>
               {/* 💡 集計ページへ飛ばすボタンを追加 */}
               <button 
                 onClick={() => router.push(`/results/${survey.shareId}`)}
                 style={{ 
                   backgroundColor: '#4caf50', 
                   color: 'white', 
                   border: 'none', 
                   padding: '8px 16px', 
                   borderRadius: '4px', 
                   cursor: 'pointer',
                   fontWeight: 'bold'
                 }}
               >
                 📊 集計結果
               </button>
            </div>
            
            {/* 🔗 共有用URLの表示エリア */}
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f0f7ff', 
              borderRadius: '4px',
              fontSize: '13px',
              border: '1px dashed #0070f3'
            }}>
              <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>配布用URL:</span>
              <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: '#0070f3', wordBreak: 'break-all' }}>
                {shareUrl}
              </a>
              <button 
                onClick={() => copyToClipboard(shareUrl)}
                style={{ marginLeft: '10px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px' }}
              >
                コピー
              </button>
            </div>

            <ul style={{ paddingLeft: '20px', marginTop: '15px' }}>
              {survey.questions.map((q) => (
                <li key={q.id} style={{ marginBottom: '5px', fontSize: '14px' }}>{q.qtext}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}