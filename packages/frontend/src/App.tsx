import { useAuth } from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const { user, loading } = useAuth();

  // 開発モード: 認証をスキップしてダッシュボードを表示
  const isDev = import.meta.env.DEV;

  if (loading && !isDev) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  // 開発モードまたはログイン済みの場合はダッシュボードを表示
  return <div className="app">{isDev || user ? <Dashboard /> : <LoginForm />}</div>;
}
