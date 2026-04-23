'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true); // ログインモードか登録モードか
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const query = isLoginMode
      ? `mutation Login($username: String!, $password: String!) {
           login(username: $username, password: $password) { access_token }
         }`
      : `mutation SignUp($username: String!, $password: String!) {
           signUp(username: $username, password: $password) { id username }
         }`;

    try {
      const response = await fetch('http://localhost:3001/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { username, password },
          credentials: 'include',
        }),
      });

      const result = await response.json();

      if (result.errors) {
        alert(result.errors[0].message);
        return;
      }

      if (isLoginMode) {
        // ログイン成功時：トークンを保存してトップページへ
        const token = result.data.login.access_token;
        localStorage.setItem('access_token', token); // 🎫 ブラウザにチケットを保存！
        alert('ログイン成功！');
        router.push('/');
      } else {
        // 登録成功時：ログインモードに切り替え
        alert('登録完了！そのままログインしてください。');
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
      }}
    >
      <h2>{isLoginMode ? 'ログイン' : '新規ユーザー登録'}</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
      >
        <input
          type="text"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: '10px' }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px' }}
        />
        <button
          type="submit"
          style={{
            padding: '10px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isLoginMode ? 'ログイン' : '登録する'}
        </button>
      </form>

      <p
        style={{ marginTop: '20px', textAlign: 'center', cursor: 'pointer', color: '#0070f3' }}
        onClick={() => setIsLoginMode(!isLoginMode)}
      >
        {isLoginMode ? '新しくアカウントを作る' : 'すでにアカウントを持っている方はこちら'}
      </p>
    </div>
  );
}
