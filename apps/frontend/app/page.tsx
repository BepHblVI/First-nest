// apps/frontend/src/app/page.tsx (主要な部分のみ抜粋)
'use client';
import { useEffect,useState } from 'react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [list, setList] = useState<{ id: number; message: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              getPracticeList {
                id
                message
              }
            }
          `,
        }),
      });
      const result = await response.json();
      if (result.data) {
        setList(result.data.getPracticeList);
      }
    } catch (error) {
      console.error('データ取得失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 💡 ここがポイント：useEffect を使う
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 🚀 データを追加する関数 (Mutation)
  const addData = async () => {
  // 1. まずは Mutation でデータを追加する
  await fetch('http://localhost:3001/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation Create($msg: String!) { createPracticeData(message: $msg) { id } }`,
      variables: { msg: inputText },
    }),
  });

  // 2. その後、改めて「全件リスト」を取得するクエリを投げる（再取得）
  const response = await fetch('http://localhost:3001/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { getPracticeList { id message } }`,
    }),
  });
  const result = await response.json();
  
  // 3. サーバーにある「最新の全データ」で上書きする
  setList(result.data.getPracticeList); 
  setInputText('');
};

  return (
    <main style={{ padding: '40px' }}>
      <h1>GraphQL Mutation テスト</h1>
      
      <input 
        value={inputText} 
        onChange={(e) => setInputText(e.target.value)}
        placeholder="メッセージを入力"
      />
      <button onClick={addData}>追加する</button>

      <ul>
        {list.map(item => (
          <li key={item.id}>{item.id}: {item.message}</li>
        ))}
      </ul>
    </main>
  );
}