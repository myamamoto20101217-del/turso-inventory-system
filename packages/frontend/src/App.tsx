import { useAuth } from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const { user, loading } = useAuth();

  // 認証スキップモード（環境変数で制御）
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

  if (loading && !skipAuth) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  // 認証スキップモードまたはログイン済みの場合はダッシュボードを表示
  return <div className="app">{skipAuth || user ? <Dashboard /> : <LoginForm />}</div>;
}
