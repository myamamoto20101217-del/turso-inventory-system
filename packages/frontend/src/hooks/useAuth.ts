import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '../config/firebase';

/**
 * 認証状態を管理するカスタムフック
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
