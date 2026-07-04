import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { theme } from './theme';
import { Card, Button, Badge } from './components/ui';
import { DEMO_RECIPES, Recipe } from './lib/mockData';

type MealTab = 'breakfast' | 'lunch' | 'dinner';

const MEAL_CONFIG: Record<MealTab, { label: string; icon: string; greeting: string }> = {
  breakfast: { label: '早餐', icon: '🍳', greeting: '早安，今天想吃点什么？' },
  lunch: { label: '午餐', icon: '🍜', greeting: '午好，来点个菜吧！' },
  dinner: { label: '晚餐', icon: '🍲', greeting: '晚上好，准备吃什么？' },
};

const DIFFICULTY_MAP = {
  easy: { label: '简单', color: 'success' as const },
  medium: { label: '中等', color: 'warning' as const },
  hard: { label: '困难', color: 'danger' as const },
};

function getDefaultMeal(): MealTab {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  return 'dinner';
}

export default function App() {
  const [activeNav, setActiveNav] = useState<'menu' | 'recipes' | 'group'>('menu');
  const [activeTab, setActiveTab] = useState<MealTab>(getDefaultMeal);
  
  // Cart state mapping tab -> list of recipe IDs
  const [cart, setCart] = useState<Record<MealTab, string[]>>({
    breakfast: [],
    lunch: [],
    dinner: []
  });

  // Simulated already ordered recipes mapping tab -> list of recipe IDs
  const [orderedForTab, setOrderedForTab] = useState<Record<MealTab, string[]>>({
    breakfast: [],
    lunch: ['2'], // Simulate already ordered Tomato Scrambled Egg for lunch
    dinner: []
  });

  const [isBarCollapsed, setIsBarCollapsed] = useState(false);

  const activeCartItems = cart[activeTab] || [];
  const activeOrderedItems = orderedForTab[activeTab] || [];

  // Auto-expand cart bar when items count change
  useEffect(() => {
    if (activeCartItems.length > 0) {
      setIsBarCollapsed(false);
    }
  }, [activeCartItems.length]);

  const toggleRecipe = (id: string) => {
    setCart((prev) => {
      const current = prev[activeTab] || [];
      const updated = current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id];
      return { ...prev, [activeTab]: updated };
    });
  };

  const handleRandomRecipe = () => {
    const available = DEMO_RECIPES.filter(
      (r) => !activeCartItems.includes(r.id) && !activeOrderedItems.includes(r.id)
    );

    if (available.length === 0) {
      Alert.alert('提示', '当前时段所有可选的菜品已在购物车或已点！');
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const randomRecipe = available[randomIndex];
    
    setCart((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), randomRecipe.id]
    }));
  };

  const handleReorder = () => {
    setCart((prev) => ({
      ...prev,
      [activeTab]: [...activeOrderedItems]
    }));
  };

  const handleConfirmOrder = () => {
    if (activeCartItems.length === 0) return;

    const orderedNames = DEMO_RECIPES.filter(r => activeCartItems.includes(r.id))
      .map(r => `• ${r.name}`)
      .join('\n');

    Alert.alert(
      '确认点菜',
      `您确定要点以下菜品吗？\n\n${orderedNames}`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: () => {
            // Move items from cart to ordered list
            setOrderedForTab((prev) => ({
              ...prev,
              [activeTab]: [...(prev[activeTab] || []), ...activeCartItems]
            }));
            // Clear active cart
            setCart((prev) => ({
              ...prev,
              [activeTab]: []
            }));
            Alert.alert('成功', '点菜已确认！已加入今日菜单 🍳');
          }
        }
      ]
    );
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[today.getDay()];
  const mealInfo = MEAL_CONFIG[activeTab];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogoIcon}>🍳</Text>
          <Text style={styles.headerTitle}>CookBro</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarFallback}>H</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeNav === 'menu' && (
          <View style={styles.pageContent}>
            {/* Greeting */}
            <View style={styles.greetingSection}>
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{dateStr} {weekday}</Text>
                <Badge variant="primary" size="sm">🏠 我们的家</Badge>
              </View>
              <Text style={styles.greetingText}>
                <Text style={styles.greetingIcon}>{mealInfo.icon} </Text>
                {mealInfo.greeting}
              </Text>
            </View>

            {/* Already Ordered Banner */}
            {activeOrderedItems.length > 0 && (
              <View style={styles.orderedBanner}>
                <Text style={styles.orderedBannerText}>
                  ✅ 今天{mealInfo.label}已点 {activeOrderedItems.length} 道菜
                </Text>
                <TouchableOpacity onPress={handleReorder}>
                  <Text style={styles.reorderLink}>重新选择并加回购物车</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Meal Switcher Tabs */}
            <View style={styles.tabBar}>
              {(Object.entries(MEAL_CONFIG) as [MealTab, typeof mealInfo][]).map(([key, config]) => {
                const isActive = activeTab === key;
                const hasMealOrdered = (orderedForTab[key] || []).length > 0;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tab, isActive ? styles.tabActive : null]}
                    onPress={() => setActiveTab(key)}
                  >
                    <Text style={styles.tabTextIcon}>{config.icon}</Text>
                    <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                      {config.label}
                    </Text>
                    {hasMealOrdered && <View style={styles.tabDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recipes Grid Section */}
            <View style={styles.menuSection}>
              <View style={styles.sectionHeader}>
                <Button variant="secondary" size="sm" onPress={handleRandomRecipe}>
                  🎲 随机点菜
                </Button>
                <TouchableOpacity onPress={() => setActiveNav('recipes')}>
                  <Text style={styles.viewAllText}>查看全部 →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuGrid}>
                {DEMO_RECIPES.map((recipe) => {
                  const isSelected = activeCartItems.includes(recipe.id);
                  const isOrdered = activeOrderedItems.includes(recipe.id);
                  const diffInfo = DIFFICULTY_MAP[recipe.difficulty];

                  return (
                    <Card
                      key={recipe.id}
                      padding="none"
                      style={[
                        styles.menuCard,
                        isSelected ? styles.menuCardSelected : null,
                        isOrdered ? styles.menuCardOrdered : null
                      ]}
                      onPress={() => toggleRecipe(recipe.id)}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>{recipe.icon}</Text>
                        <Badge variant={diffInfo.color} size="sm">{diffInfo.label}</Badge>
                      </View>

                      <View style={styles.cardBody}>
                        <Text style={styles.cardName}>{recipe.name}</Text>
                        <Text style={styles.cardCategory}>{recipe.category}</Text>
                      </View>

                      <View style={styles.cardMeta}>
                        <Text style={styles.metaCount}>🔥 已点 {recipe.orderCount} 次</Text>
                        <Text style={styles.metaTime}>⏱️ {recipe.cookTime}分钟</Text>
                      </View>

                      {isSelected && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
                      {isOrdered && !isSelected && <View style={styles.orderedBadge}><Text style={styles.orderedText}>✓</Text></View>}
                    </Card>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {activeNav === 'recipes' && (
          <View style={styles.placeholderPage}>
            <Text style={styles.placeholderEmoji}>📖</Text>
            <Text style={styles.placeholderTitle}>菜谱库</Text>
            <Text style={styles.placeholderText}>
              这里会移植您的详细双列菜谱库与新建/编辑表单功能。
            </Text>
          </View>
        )}

        {activeNav === 'group' && (
          <View style={styles.placeholderPage}>
            <Text style={styles.placeholderEmoji}>👥</Text>
            <Text style={styles.placeholderTitle}>家庭成员</Text>
            <Text style={styles.placeholderText}>
              这里会移植您的家庭组配对、邀请成员以及退出自定义警告弹窗。
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Cart Toolbar */}
      {activeNav === 'menu' && activeCartItems.length > 0 && (
        isBarCollapsed ? (
          <TouchableOpacity
            style={styles.collapsedCartBtn}
            onPress={() => setIsBarCollapsed(false)}
          >
            <Text style={styles.collapsedCartIcon}>🛒</Text>
            <View style={styles.collapsedCartBadge}>
              <Text style={styles.collapsedCartBadgeText}>{activeCartItems.length}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.floatingCartBar}>
            <TouchableOpacity 
              style={styles.cartInfoBtn}
              onPress={() => setIsBarCollapsed(true)}
            >
              <Text style={styles.cartInfoIcon}>🛒</Text>
              <Text style={styles.cartInfoText}>已选 {activeCartItems.length} 道菜</Text>
              <Text style={styles.cartChevron}>▲</Text>
            </TouchableOpacity>
            
            <Button
              variant="primary"
              size="md"
              onPress={handleConfirmOrder}
            >
              确认点菜 👉
            </Button>
          </View>
        )
      )}

      {/* Bottom Navigation Sticky Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveNav('menu')}
        >
          <Text style={[styles.navIcon, activeNav === 'menu' ? styles.navTextActive : null]}>🍳</Text>
          <Text style={[styles.navLabel, activeNav === 'menu' ? styles.navTextActive : null]}>点菜</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveNav('recipes')}
        >
          <Text style={[styles.navIcon, activeNav === 'recipes' ? styles.navTextActive : null]}>📖</Text>
          <Text style={[styles.navLabel, activeNav === 'recipes' ? styles.navTextActive : null]}>菜谱</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveNav('group')}
        >
          <Text style={[styles.navIcon, activeNav === 'group' ? styles.navTextActive : null]}>👥</Text>
          <Text style={[styles.navLabel, activeNav === 'group' ? styles.navTextActive : null]}>家庭</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255, 251, 245, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoIcon: {
    fontSize: 22,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  headerRight: {
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContainer: {
    paddingBottom: 120, // Leave room for sticky bottom nav & floating toolbar
  },
  pageContent: {
    padding: theme.spacing[4],
    width: '100%',
  },
  greetingSection: {
    marginBottom: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[1],
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  greetingIcon: {
    fontSize: 24,
  },
  orderedBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: theme.radius.lg,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[4],
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  orderedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 4,
  },
  reorderLink: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary[600],
    textDecorationLine: 'underline',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.xl,
    padding: 4,
    marginBottom: theme.spacing[4],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: theme.colors.primary[500],
  },
  tabTextIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  tabDot: {
    position: 'absolute',
    top: 6,
    right: '25%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  menuSection: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  menuCard: {
    width: '48%',
    height: 160,
    backgroundColor: theme.colors.bg.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    position: 'relative',
  },
  menuCardSelected: {
    borderColor: theme.colors.primary[500],
  },
  menuCardOrdered: {
    opacity: 0.85,
    backgroundColor: theme.colors.neutral[50],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  cardIcon: {
    fontSize: 28,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: theme.spacing[1],
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing[2],
    marginTop: 'auto',
  },
  metaCount: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  metaTime: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: theme.radius.full,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 74,
    left: theme.spacing[4],
    right: theme.spacing[4],
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius['2xl'],
    padding: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Shadow
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  cartInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartInfoIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  cartInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary[600],
  },
  cartChevron: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginLeft: 6,
  },
  collapsedCartBtn: {
    position: 'absolute',
    bottom: 74,
    right: theme.spacing[4],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  collapsedCartIcon: {
    fontSize: 22,
  },
  collapsedCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary[500],
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedCartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 251, 245, 0.9)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  navIcon: {
    fontSize: 20,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  navTextActive: {
    color: theme.colors.primary[500],
  },
  placeholderPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
    marginTop: 100,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing[4],
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  placeholderText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
