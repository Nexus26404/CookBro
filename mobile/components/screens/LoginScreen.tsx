import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { theme } from '../../theme';
import { Card, Button, Input } from '../ui';
import { apiFetch, saveSession, getApiBaseUrl, setApiBaseUrl, UserSession } from '../../lib/api';

// Complete auth session on redirect (required for Expo WebBrowser OAuth)
WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  onLoginSuccess: (user: UserSession) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [serverIp, setServerIp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize Server IP from API client settings
  useEffect(() => {
    setServerIp(getApiBaseUrl());
  }, []);

  // Listen to deep linking scheme callback redirects (e.g. cookbro://auth?uid=...)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('App received deep link:', event.url);
      
      const parsed = Linking.parse(event.url);
      const params = parsed.queryParams;
      
      // Check if deep link matches our auth callback target
      if (event.url.includes('cookbro://auth') && params && params.uid) {
        const userSession: UserSession = {
          uid: params.uid as string,
          email: (params.email as string) || '',
          displayName: (params.displayName as string) || '',
          photoURL: (params.photoURL as string) || '',
        };
        
        saveSession(userSession).then(() => {
          Alert.alert('欢迎', '已成功与电脑端授权同步！');
          onLoginSuccess(userSession);
        });
      }
    };

    // Add deep linking listener
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Parse initial URL if the app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onLoginSuccess]);

  const handleIpChange = async (val: string) => {
    setServerIp(val);
    await setApiBaseUrl(val);
  };

  const validate = () => {
    setError('');
    
    if (!email.trim() || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    
    if (password.length < 6) {
      setError('密码至少需要6位');
      return false;
    }
    
    if (isSignUp && !displayName.trim()) {
      setError('请输入昵称');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const payload = isSignUp 
        ? { email, password, displayName } 
        : { email, password };
        
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '请求失败，请稍后重试');
      }
      
      const userSession: UserSession = data;
      await saveSession(userSession);
      
      Alert.alert('欢迎', isSignUp ? '注册成功！' : '登录成功！');
      onLoginSuccess(userSession);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || '网络连接失败，请确认服务器 IP 是否配置正确');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Direct Web Authentication URL (Next.js server landing page for mobile auth)
      const baseServerUrl = serverIp.replace(/\/api$/, '').replace(/\/$/, '');
      const webAuthUrl = `${baseServerUrl}/auth/mobile`;
      
      console.log('Opening WebAuth portal:', webAuthUrl);
      
      // Open WebBrowser session pointing to the server mobile login page
      await WebBrowser.openAuthSessionAsync(webAuthUrl, 'cookbro://');
    } catch (err: any) {
      console.error('Google portal open error:', err);
      setError('无法打开网页登录端口，请检查您的服务器 IP 配置');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Hero Decor */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍳</Text>
          </View>
          <Text style={styles.appName}>CookBro</Text>
          <Text style={styles.tagline}>家庭煮夫 · 让做饭更简单</Text>
        </View>

        {/* Card Form */}
        <Card padding="md" style={styles.formCard}>
          <View style={styles.tabHeader}>
            <TouchableOpacity 
              style={[styles.tabBtn, !isSignUp ? styles.tabBtnActive : null]}
              onPress={() => {
                setIsSignUp(false);
                setError('');
              }}
            >
              <Text style={[styles.tabBtnText, !isSignUp ? styles.tabBtnTextActive : null]}>登录</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabBtn, isSignUp ? styles.tabBtnActive : null]}
              onPress={() => {
                setIsSignUp(true);
                setError('');
              }}
            >
              <Text style={[styles.tabBtnText, isSignUp ? styles.tabBtnTextActive : null]}>注册</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {isSignUp && (
            <Input
              label="昵称"
              placeholder="请输入您的昵称"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
          )}

          <Input
            label="邮箱地址"
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
          />

          <Input
            label="登录密码"
            placeholder="密码至少6位"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Button
            variant="primary"
            fullWidth
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          >
            {isSignUp ? '立即注册' : '确认登录'}
          </Button>

          {!isSignUp && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {!isSignUp && (
            <Button
              variant="secondary"
              fullWidth
              onPress={handleGoogleLogin}
              disabled={loading}
              style={styles.googleBtn}
            >
              🔵 Google 账号一键登录
            </Button>
          )}
        </Card>

        {/* Server IP Configuration Panel */}
        <Card padding="sm" style={styles.ipCard}>
          <Input
            label="⚙️ 开发服务器配置"
            placeholder="http://192.168.x.x:3000"
            value={serverIp}
            onChangeText={handleIpChange}
            helperText="真机调试时，请输入您电脑所在的局域网 IP 与端口"
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  scrollContainer: {
    padding: theme.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
    marginTop: theme.spacing[4],
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  logo: {
    fontSize: 36,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    width: '100%',
    marginBottom: theme.spacing[4],
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    marginBottom: theme.spacing[4],
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: theme.colors.primary[500],
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  tabBtnTextActive: {
    color: theme.colors.primary[500],
  },
  errorBanner: {
    backgroundColor: theme.colors.danger.light,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: theme.radius.md,
    padding: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.danger.dark,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: theme.spacing[2],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.default,
  },
  dividerText: {
    marginHorizontal: theme.spacing[3],
    color: theme.colors.text.tertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  googleBtn: {
    borderColor: theme.colors.border.default,
  },
  ipCard: {
    width: '100%',
    backgroundColor: theme.colors.bg.card,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.default,
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
});
