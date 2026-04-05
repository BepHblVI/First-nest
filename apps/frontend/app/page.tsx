'use client';
import { useEffect, useState } from 'react';

// --- 型定義 ---
type Question = { id: number; qtext: string };
type Survey = {
  id: number;
  title: string;
  owner: string;
  questions: Question[];
};

export default function Home() {
  // アンケート一覧用
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('user1'); // 取得用のユーザー名

  // 新規アンケート作成用
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newQtexts, setNewQtexts] = useState<string[]>(['']); // 最初の質問1つ

  // 1. アンケート一覧を取得する（ユーザー指定）
  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetSurvey($user: String!) {
              getSurvey(user: $user) {
                id
                title
                owner
                questions {
                  id
                  qtext
                }
              }
            }
          `,
          variables: { user: searchUser },
        }),
      });
      const result = await response.json();
      if (result.data) {
        setSurveys(result.data.getSurvey);
      }
    } catch (error) {
      console.error('データ取得失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  // 2. 質問の入力欄を増やす
  const addQuestionField = () => {
    setNewQtexts([...newQtexts, '']);
  };

  // 3. 質問の入力内容を更新する
  const updateQuestionText = (index: number, val: string) => {
    const updated = [...newQtexts];
    updated[index] = val;
    setNewQtexts(updated);
  };

  // 4. アンケートを新規作成する
  const handleCreateSurvey = async () => {
    if (!newTitle || !newOwner || newQtexts.some(t => !t)) {
      alert('未入力の項目があります');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateSurvey($title: String!, $user: String!, $qtexts: [String!]!) {
              createSurvey(title: $title, user: $user, qtexts: $qtexts) {
                id
              }
            }
          `,
          variables: {
            title: newTitle,
            user: newOwner,
            qtexts: newQtexts,
          },
        }),
      });

      const result = await response.json();
      if (result.data) {
        alert('アンケートを作成しました！');
        setNewTitle('');
        setNewOwner('');
        setNewQtexts(['']);
        fetchSurveys();
      }
    } catch (error) {
      alert('作成失敗');
    }
  };

  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>📊 アンケート作成システム</h1>

      {/* --- アンケート作成フォーム --- */}
      <section style={{ padding: '20px', border: '2px solid #0070f3', borderRadius: '10px', marginBottom: '40px' }}>
        <h2>1. 新規アンケート作成</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            placeholder="アンケートのタイトル"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <input
            placeholder="作成者名（owner）"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            style={{ padding: '10px', fontSize: '16px' }}
          />
          
          <div>
            <label style={{ fontWeight: 'bold' }}>質問リスト:</label>
            {newQtexts.map((text, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                  placeholder={`質問 ${index + 1}`}
                  value={text}
                  onChange={(e) => updateQuestionText(index, e.target.value)}
                  style={{ flex: 1, padding: '8px' }}
                />
              </div>
            ))}
            <button onClick={addQuestionField} style={{ marginTop: '10px', cursor: 'pointer' }}>
              ＋ 質問を追加
            </button>
          </div>

          <button
            onClick={handleCreateSurvey}
            style={{ backgroundColor: '#0070f3', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}
          >
            アンケートを保存する
          </button>
        </div>
      </section>

      {/* --- アンケート一覧表示 --- */}
      <section>
        <h2>2. 作成済みアンケート一覧</h2>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input 
            value={searchUser} 
            onChange={(e) => setSearchUser(e.target.value)} 
            placeholder="検索するユーザー名" 
            style={{ padding: '8px' }}
          />
          <button onClick={fetchSurveys} style={{ padding: '8px 16px' }}>表示更新</button>
        </div>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {surveys.length === 0 && <p>アンケートが見つかりません</p>}
            {surveys.map((survey) => (
              <div key={survey.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>{survey.title}</h3>
                <p style={{ fontSize: '12px', color: '#666' }}>作成者: {survey.owner}</p>
                <ul style={{ paddingLeft: '20px' }}>
                  {survey.questions.map((q) => (
                    <li key={q.id} style={{ marginBottom: '5px' }}>{q.qtext}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}