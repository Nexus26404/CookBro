'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import styles from './login.module.css';

function LoginForm() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isLocal = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'local';

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
      router.push(redirectTarget);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '登录失败，请重试';
      setError(errorMessage);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('请输入昵称');
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      router.push(redirectTarget);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '操作失败，请重试';
      if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password')) {
        setError('邮箱或密码错误');
      } else if (errorMessage.includes('auth/email-already-in-use')) {
        setError('该邮箱已被注册');
      } else if (errorMessage.includes('auth/weak-password')) {
        setError('密码至少需要6位');
      } else if (errorMessage.includes('auth/invalid-email')) {
        setError('请输入有效的邮箱地址');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroDecor}>
          <span>🥘</span>
          <span>🍜</span>
          <span>🥗</span>
          <span>🍰</span>
        </div>
        <div className={styles.logoContainer}>
          <span className={styles.logo}>🍳</span>
        </div>
        <h1 className={styles.appName}>CookBro</h1>
        <p className={styles.tagline}>家庭煮夫 · 让做饭更简单</p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.card}>
          <h2 className={styles.formTitle}>{isSignUp ? '创建账号' : '欢迎回来'}</h2>

          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className={styles.form}>
            {isSignUp && (
              <Input
                label="昵称"
                placeholder="你的名字"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                icon={<span>👤</span>}
              />
            )}
            <Input
              label="邮箱"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<span>✉️</span>}
            />
            <Input
              label="密码"
              type="password"
              placeholder="至少6位密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              icon={<span>🔒</span>}
            />

            <Button type="submit" fullWidth loading={submitting} size="lg">
              {isSignUp ? '注册' : '登录'}
            </Button>
          </form>

          {!isLocal && (
            <>
              <div className={styles.divider}>
                <span>或</span>
              </div>

              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={handleGoogleLogin}
                icon={
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                  </svg>
                }
              >
                使用 Google 账号登录
              </Button>
            </>
          )}

          <p className={styles.switchMode}>
            {isSignUp ? '已有账号？' : '还没有账号？'}
            <button
              className={styles.switchButton}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              {isSignUp ? '去登录' : '去注册'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载中...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
