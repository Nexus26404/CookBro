import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View, ScrollView } from 'react-native';
import { theme } from './theme';
import { Card, Button, Input } from './components/ui';

export default function App() {
  const [testText, setTestText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestPress = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Hello from CookBro Mobile! 🍳');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>🍳</Text>
          <Text style={styles.title}>CookBro Mobile</Text>
          <Text style={styles.subtitle}>家庭点餐与菜谱管理系统</Text>
        </View>

        <Card padding="md" style={styles.card}>
          <Text style={styles.sectionTitle}>✨ 核心 UI 组件测试</Text>
          <Text style={styles.bodyText}>
            这是一个使用 React Native + Expo 构建的 CookBro 原生客户端框架。我们复用了 Web 端的色彩体系与卡片圆角样式。
          </Text>

          <Input
            label="测试输入框"
            placeholder="在手机端输入些什么..."
            value={testText}
            onChangeText={setTestText}
            helperText="输入时会有柔和的橙色高亮边框"
          />

          <View style={styles.buttonRow}>
            <Button
              variant="primary"
              onPress={handleTestPress}
              loading={loading}
              fullWidth
            >
              点击测试
            </Button>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  container: {
    padding: theme.spacing[4],
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[6],
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing[2],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  card: {
    marginTop: theme.spacing[2],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  bodyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing[4],
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: theme.spacing[2],
    width: '100%',
  },
});
