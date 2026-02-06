import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { firebaseConfig } from './env';

/**
 * Firebase初期化（設定がある場合のみ）
 */
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn('Firebase config not found. Running in dev mode without authentication.');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export { auth };

/**
 * メール・パスワードでログイン
 */
export async function loginWithEmail(email: string, password: string) {
  if (!auth) {
    return { user: null, error: 'Firebase not initialized' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Login failed:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Googleアカウントでログイン
 */
export async function loginWithGoogle() {
  if (!auth) {
    return { user: null, error: 'Firebase not initialized' };
  }

  const googleProvider = new GoogleAuthProvider();

  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Google login failed:', error);
    return { user: null, error: error.message };
  }
}

/**
 * ログアウト
 */
export async function logout() {
  if (!auth) {
    return { error: 'Firebase not initialized' };
  }

  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error('Logout failed:', error);
    return { error: error.message };
  }
}

/**
 * 認証状態の監視
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * IDトークン取得
 */
export async function getIdToken(): Promise<string | null> {
  if (!auth) return null;

  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
}
