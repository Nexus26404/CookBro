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
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
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
  const [googleClientId, setGoogleClientId] = useState(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '');
  
  const [redirectUri, setRedirectUri] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize Server IP, Google Client ID, and Redirect URI from storage
  useEffect(() => {
    setServerIp(getApiBaseUrl());
    setRedirectUri(AuthSession.makeRedirectUri());
    AsyncStorage.getItem('cookbro_google_client_id').then(id => {
      if (id) {
        setGoogleClientId(id);
      }
    });
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleClientId || undefined,
    androidClientId: googleClientId || undefined,
    iosClientId: googleClientId || undefined,
    redirectUri: redirectUri || undefined,
  });

  // Listen to Google login response
  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const accessToken = response.authentication.accessToken;
      handleGoogleLoginSuccess(accessToken);
    }
  }, [response]);

  const handleIpChange = async (val: string) => {
    setServerIp(val);
    await setApiBaseUrl(val);
  };

  const handleGoogleClientIdChange = async (id: string) => {
    setGoogleClientId(id);
    await AsyncStorage.setItem('cookbro_google_client_id', id);
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

  const handleGoogleLoginSuccess = async (token: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch user profile from Google UserInfo API
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profile = await res.json();
      
      if (!res.ok) {
        throw new Error(profile.error_description || '获取谷歌用户信息失败');
      }

      // Map to standard UserSession
      const userSession: UserSession = {
        uid: `google-${profile.sub}`,
        email: profile.email,
        displayName: profile.name,
        photoURL: profile.picture
      };

      // Sync the user to the Next.js database (corresponds to syncUserToDb on web)
      const syncRes = await apiFetch('/api/users/me', {
        method: 'POST',
        body: JSON.stringify(userSession)
      });

      if (!syncRes.ok) {
        console.warn('Failed to sync Google user to database');
      }

      // Save user session in local AsyncStorage
      await saveSession(userSession);
      
      Alert.alert('欢迎', '谷歌登录成功！');
      onLoginSuccess(userSession);
    } catch (err: any) {
      console.error('Google login processing error:', err);
      setError(err.message || '谷歌账户授权并同步失败');
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
              onPress={() => {
                if (!googleClientId) {
                  Alert.alert('提示', '请先在下方的“开发服务器配置”中填写 Google Web Client ID');
                  return;
                }
                promptAsync();
              }}
              disabled={loading}
              style={styles.googleBtn}
            >
              🔵 Google 账户登录
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
          <Input
            label="🔑 Google Web Client ID"
            placeholder="输入您的 Google Web Client ID..."
            value={googleClientId}
            onChangeText={handleGoogleClientIdChange}
            helperText="测试谷歌登录时，请填入您的 Google Web Client ID"
            style={{ marginTop: theme.spacing[2] }}
          />
          <Input
            label="🔗 Expo 重定向 URI (Redirect URI)"
            value={redirectUri}
            editable={false}
            helperText="🚨 请将此 URI 复制并添加到您的 Google Cloud 控制台该客户端的“已授权重定向 URI”列表中！"
            style={{ marginTop: theme.spacing[2] }}
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
