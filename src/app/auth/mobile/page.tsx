'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function AuthMobilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // If not logged in on the web, redirect to the login page
      // And set redirect param so it returns to /auth/mobile after successful web login!
      router.push('/login?redirect=/auth/mobile');
      return;
    }

    // If logged in, construct deep link to pass user details back to Expo Go mobile app
    const params = new URLSearchParams({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
    });

    const deepLinkUrl = `cookbro://auth?${params.toString()}`;
    
    // Redirect the browser window to open the native app scheme callback
    window.location.href = deepLinkUrl;
  }, [user, loading, router]);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <span style={logoStyle}>🍳</span>
        <h2 style={titleStyle}>正在同步登录状态...</h2>
        <p style={textStyle}>已成功取得授权，正在为您跳转回 CookBro App</p>
        <p style={subtextStyle}>如果您的浏览器没有自动跳转，请点击下方按钮：</p>
        {user && (
          <a
            href={`cookbro://auth?${new URLSearchParams({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
            }).toString()}`}
            style={btnStyle}
          >
            手动返回 App 👉
          </a>
        )}
      </div>
    </div>
  );
}

// Inline styling for premium look matching our brand theme colors
const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#FFFBF5',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '20px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '40px 30px',
  boxShadow: '0 10px 25px rgba(249, 115, 22, 0.08)',
  border: '1.5px solid #F5EBE0',
  textAlign: 'center',
  maxWidth: '400px',
  width: '100%',
};

const logoStyle: React.CSSProperties = {
  fontSize: '4rem',
  display: 'block',
  marginBottom: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1c1917',
  marginBottom: '10px',
};

const textStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#78716c',
  lineHeight: '1.6',
  marginBottom: '20px',
};

const subtextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#a8a29e',
  marginBottom: '16px',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f97316',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: 'bold',
  fontSize: '14px',
  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
};
