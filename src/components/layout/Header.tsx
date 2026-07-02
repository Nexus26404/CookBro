'use client';

import { useAuth } from '@/lib/auth';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function Header({ title = 'CookBro', showBack = false, rightAction }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          {showBack ? (
            <button className={styles.backButton} onClick={() => window.history.back()} aria-label="返回">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🍳</span>
            </div>
          )}
          <h1 className={styles.title}>{title}</h1>
        </div>
        <div className={styles.right}>
          {rightAction}
          {user && (
            <div className={styles.avatar}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || '用户'} className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarFallback}>
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
