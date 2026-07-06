import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  ActivityIndicator,
  Image,
  BackHandler,
  PanResponder
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { theme } from './theme';
import { Card, Button, Badge, AlertModal } from './components/ui';
import { DEMO_RECIPES } from './lib/mockData';
import { LoginScreen } from './components/screens/LoginScreen';
import { RecipesScreen } from './components/screens/RecipesScreen';
import { RecipeDetailsScreen } from './components/screens/RecipeDetailsScreen';
import { RecipeFormScreen } from './components/screens/RecipeFormScreen';
import { GroupScreen } from './components/screens/GroupScreen';
import { loadSession, clearSession, UserSession, apiFetch } from './lib/api';
import { CookGroup, Order, Recipe } from './lib/types';

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

interface NavState {
  activeNav: 'menu' | 'recipes' | 'group';
  selectedRecipeId: string | null;
  editingRecipeId: string | null;
  isAddingRecipe: boolean;
  groupView: 'main' | 'create' | 'join' | 'history' | 'order-detail';
  selectedOrderId: string | null;
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeNav, setActiveNav] = useState<'menu' | 'recipes' | 'group'>('menu');
  const [activeTab, setActiveTab] = useState<MealTab>(getDefaultMeal);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [groupView, setGroupView] = useState<'main' | 'create' | 'join' | 'history' | 'order-detail'>('main');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [navHistory, setNavHistory] = useState<NavState[]>([]);
  
  // Cart state mapping tab -> list of recipe IDs
  const [cart, setCart] = useState<Record<MealTab, string[]>>({
    breakfast: [],
    lunch: [],
    dinner: []
  });

  // Synchronized States
  const [group, setGroup] = useState<CookGroup | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [confirmingOrder, setConfirmingOrder] = useState(false);

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Custom AlertModal state & trigger helpers (Phase 5)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalType, setModalType] = useState<'success' | 'warning' | 'error' | 'info'>('info');
  const [modalConfirm, setModalConfirm] = useState<(() => void) | undefined>(undefined);
  const [modalVariant, setModalVariant] = useState<'primary' | 'danger'>('primary');

  const triggerModalAlert = (title: string, desc: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setModalTitle(title);
    setModalDesc(desc);
    setModalType(type);
    setModalConfirm(undefined);
    setModalOpen(true);
  };

  const triggerModalConfirm = (title: string, desc: string, onConfirm: () => void, variant: 'primary' | 'danger' = 'primary') => {
    setModalTitle(title);
    setModalDesc(desc);
    setModalType('info');
    setModalConfirm(() => onConfirm);
    setModalVariant(variant);
    setModalOpen(true);
  };

  const pushNav = (next: Partial<NavState>) => {
    const current: NavState = {
      activeNav,
      selectedRecipeId,
      editingRecipeId,
      isAddingRecipe,
      groupView,
      selectedOrderId,
    };
    setNavHistory(prev => [...prev, current]);
    
    if (next.activeNav !== undefined) setActiveNav(next.activeNav);
    if (next.selectedRecipeId !== undefined) setSelectedRecipeId(next.selectedRecipeId);
    if (next.editingRecipeId !== undefined) setEditingRecipeId(next.editingRecipeId);
    if (next.isAddingRecipe !== undefined) setIsAddingRecipe(next.isAddingRecipe);
    if (next.groupView !== undefined) setGroupView(next.groupView);
    if (next.selectedOrderId !== undefined) setSelectedOrderId(next.selectedOrderId);
  };

  const handleGlobalGoBack = () => {
    if (isCartDrawerOpen) {
      setIsCartDrawerOpen(false);
      return true;
    }

    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory(prevHistory => prevHistory.slice(0, -1));
      
      setActiveNav(prev.activeNav);
      setSelectedRecipeId(prev.selectedRecipeId);
      setEditingRecipeId(prev.editingRecipeId);
      setIsAddingRecipe(prev.isAddingRecipe);
      setGroupView(prev.groupView);
      setSelectedOrderId(prev.selectedOrderId);
      return true;
    }
    
    Alert.alert(
      '退出应用',
      '确定要退出 CookBro 吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定退出', onPress: () => BackHandler.exitApp() }
      ],
      { cancelable: true }
    );
    return true;
  };

  // BackHandler setup for hardware back press (Android)
  useEffect(() => {
    const onBackPress = () => {
      return handleGlobalGoBack();
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [navHistory, isCartDrawerOpen, activeNav, selectedRecipeId, editingRecipeId, isAddingRecipe, groupView, selectedOrderId]);

  const handleNavChange = (nextTab: 'menu' | 'recipes' | 'group') => {
    if (nextTab === activeNav) return;
    pushNav({ activeNav: nextTab });
  };

  // PanResponder setup for edge swipe back gesture (iOS & Android)
  const goBackRef = React.useRef(handleGlobalGoBack);
  useEffect(() => {
    goBackRef.current = handleGlobalGoBack;
  }, [handleGlobalGoBack]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Intercept when swiping right starting from left edge
        const isLeftEdge = gestureState.x0 < 45;
        const isMovingRight = gestureState.dx > 15;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isLeftEdge && isMovingRight && isHorizontal;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 60) {
          goBackRef.current();
        }
      },
    })
  ).current;

  // Load local auth session on startup
  useEffect(() => {
    loadSession()
      .then(savedUser => {
        if (savedUser) {
          setUser(savedUser);
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(err => {
        console.error('Failed to load session:', err);
        setCheckingAuth(false);
      });
  }, []);

  const fetchGroup = async () => {
    setGroupLoading(true);
    try {
      const res = await apiFetch(`/api/groups?uid=${user?.uid || ''}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        await loadHomeData(data.id);
      } else {
        setGroup(null);
        await loadHomeData(undefined);
      }
    } catch (err) {
      console.warn('Failed to fetch group details, checking offline group:', err);
      if (user) {
        try {
          const offlineGroupStr = await AsyncStorage.getItem(`cookbro_offline_group_${user.uid}`);
          if (offlineGroupStr) {
            const offlineGroup = JSON.parse(offlineGroupStr);
            setGroup(offlineGroup);
            await loadHomeData(offlineGroup.id);
          } else {
            setGroup(null);
            await loadHomeData(undefined);
          }
        } catch {
          setGroup(null);
          await loadHomeData(undefined);
        }
      } else {
        setGroup(null);
      }
    } finally {
      setGroupLoading(false);
      setCheckingAuth(false);
    }
  };

  const loadHomeData = async (currentGroupId?: string) => {
    setRecipesLoading(true);
    try {
      const recRes = await apiFetch('/api/recipes');
      if (recRes.ok) {
        const data = await recRes.json();
        setRecipes(data);
      } else {
        throw new Error('Failed to load recipes');
      }
    } catch (err) {
      console.warn('Failed to load recipes, using mock fallback', err);
      const mockRecipes: Recipe[] = DEMO_RECIPES.map(r => ({
        ...r,
        images: [],
        tags: [],
        servings: 2,
        prepTime: 10,
        ingredients: [],
        utensils: [],
        steps: [],
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setRecipes(mockRecipes);
    } finally {
      setRecipesLoading(false);
    }

    const gId = currentGroupId || group?.id;
    if (!gId) {
      setOrder(null);
      setOrderCounts({});
      return;
    }

    try {
      const todayRes = await apiFetch(`/api/orders/today?groupId=${gId}`);
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setOrder(todayData);
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.warn('Failed to load today orders', err);
      setOrder(null);
    }

    try {
      const historyRes = await apiFetch(`/api/orders?groupId=${gId}`);
      if (historyRes.ok) {
        const historyData: Order[] = await historyRes.json();
        const counts: Record<string, number> = {};
        for (const ord of historyData) {
          for (const meal of ord.meals) {
            for (const recipeId of meal.recipes) {
              counts[recipeId] = (counts[recipeId] || 0) + 1;
            }
          }
        }
        setOrderCounts(counts);
      }
    } catch (err) {
      console.warn('Failed to load history orders', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroup();
    } else {
      setGroup(null);
      setOrder(null);
      setOrderCounts({});
      setRecipes([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeNav === 'menu') {
      loadHomeData();
    }
  }, [activeNav]);

  const handleLogout = () => {
    triggerModalConfirm(
      '退出登录',
      '您确定要退出当前账号吗？',
      async () => {
        setModalOpen(false);
        await clearSession();
        setUser(null);
        // Delay alert slightly so the confirm modal hides first
        setTimeout(() => {
          triggerModalAlert('提示', '已成功退出登录', 'success');
        }, 300);
      }
    );
  };

  const activeCartItems = cart[activeTab] || [];
  const activeOrderedItems = order?.meals.find((m) => m.type === activeTab)?.recipes || [];
  const cartRecipes = activeCartItems.map((id) => recipes.find((r) => r.id === id)).filter(Boolean) as Recipe[];
  const totalTime = cartRecipes.reduce((sum, r) => sum + r.cookTime + (r.prepTime || 0), 0);

  // Auto-close cart drawer when items count becomes 0
  useEffect(() => {
    if (activeCartItems.length === 0) {
      setIsCartDrawerOpen(false);
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
    const available = recipes.filter(
      (r) => !activeCartItems.includes(r.id) && !activeOrderedItems.includes(r.id)
    );

    if (available.length === 0) {
      triggerModalAlert('提示', '当前时段所有可选的菜品已在购物车或已点！', 'warning');
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

    const orderedNames = recipes.filter(r => activeCartItems.includes(r.id))
      .map(r => `• ${r.name}`)
      .join('\n');

    triggerModalConfirm(
      '确认点菜',
      `您确定要点以下菜品吗？\n\n${orderedNames}`,
      async () => {
        setConfirmingOrder(true);
        setModalOpen(false);
        try {
          const res = await apiFetch('/api/orders/today', {
            method: 'POST',
            body: JSON.stringify({
              groupId: group?.id,
              mealType: activeTab,
              recipeIds: activeCartItems,
            }),
          });
          
          if (!res.ok) {
            throw new Error('Failed to confirm order');
          }

          const updatedOrder = await res.json();
          setOrder(updatedOrder);

          // Clear active cart
          setCart((prev) => ({
            ...prev,
            [activeTab]: []
          }));

          // Fetch latest count updates
          loadHomeData();

          setTimeout(() => {
            triggerModalAlert('成功', '点菜已确认！已加入今日菜单 🍳', 'success');
          }, 300);
        } catch (err) {
          console.error(err);
          triggerModalAlert('错误', '提交订单失败，请稍后重试', 'error');
        } finally {
          setConfirmingOrder(false);
        }
      }
    );
  };

  const handleClearCart = () => {
    triggerModalConfirm(
      '清空购物车',
      '您确定要清空当前餐次的已选菜品吗？',
      () => {
        setCart((prev) => ({
          ...prev,
          [activeTab]: []
        }));
        setModalOpen(false);
      }
    );
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[today.getDay()];
  const mealInfo = MEAL_CONFIG[activeTab];

  if (checkingAuth) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <StatusBar style="dark" />
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>🍳 加载中...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLoginSuccess={setUser} />
      </SafeAreaProvider>
    );
  }

  let screenContent = null;

  if (isAddingRecipe) {
    screenContent = (
      <RecipeFormScreen
        onBack={handleGlobalGoBack}
        onSaveSuccess={() => {
          setIsAddingRecipe(false);
          setActiveNav('recipes');
        }}
        user={user}
      />
    );
  } else if (editingRecipeId) {
    screenContent = (
      <RecipeFormScreen
        recipeId={editingRecipeId}
        onBack={handleGlobalGoBack}
        onSaveSuccess={() => {
          setEditingRecipeId(null);
          setSelectedRecipeId(null);
          setActiveNav('recipes');
        }}
        user={user}
      />
    );
  } else if (selectedRecipeId) {
    screenContent = (
      <RecipeDetailsScreen
        recipeId={selectedRecipeId}
        onBack={handleGlobalGoBack}
        onEditRecipe={(id) => {
          pushNav({ editingRecipeId: id });
        }}
        user={user}
      />
    );
  } else {
    screenContent = (
      <>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLogoIcon}>🍳</Text>
            <Text style={styles.headerTitle}>CookBro</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.avatar} onPress={handleLogout}>
              <Text style={styles.avatarFallback}>
                {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeNav === 'menu' && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
              {(Object.keys(MEAL_CONFIG) as MealTab[]).map((key) => {
                const config = MEAL_CONFIG[key];
                const isActive = activeTab === key;
                const hasMealOrdered = order?.meals.some((m) => m.type === key && m.recipes.length > 0);
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
                <TouchableOpacity onPress={() => handleNavChange('recipes')}>
                  <Text style={styles.viewAllText}>查看全部 →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuGrid}>
                {recipesLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary[500]} style={{ margin: 20 }} />
                ) : (
                  recipes.map((recipe) => {
                    const isSelected = activeCartItems.includes(recipe.id);
                    const isOrdered = activeOrderedItems.includes(recipe.id);
                    const diffInfo = DIFFICULTY_MAP[recipe.difficulty] || DIFFICULTY_MAP.easy;
                    const hasCoverImg = recipe.images && recipe.images.length > 0;

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
                        {/* Cover Image or Emoji Fallback */}
                        <View style={styles.cardCover}>
                          {hasCoverImg ? (
                            <Image source={{ uri: recipe.images[0] }} style={styles.cardCoverImg} />
                          ) : (
                            <View style={styles.cardCoverFallback}>
                              <Text style={styles.cardCoverEmoji}>{recipe.icon || '🍳'}</Text>
                            </View>
                          )}
                          <View style={styles.cardBadgeContainer}>
                            <Badge variant={diffInfo.color} size="sm">{diffInfo.label}</Badge>
                          </View>
                        </View>

                        <View style={styles.cardContent}>
                          <View style={styles.cardBody}>
                            <Text style={styles.cardName} numberOfLines={1}>{recipe.name}</Text>
                            <Text style={styles.cardCategory}>{recipe.category}</Text>
                          </View>

                          <View style={styles.cardMeta}>
                            <Text style={styles.metaCount}>🔥 已点 {orderCounts[recipe.id] || 0} 次</Text>
                            <Text style={styles.metaTime}>⏱️ {recipe.cookTime}分钟</Text>
                          </View>
                        </View>

                        {isSelected && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
                        {isOrdered && !isSelected && <View style={styles.orderedBadge}><Text style={styles.orderedText}>✓</Text></View>}
                      </Card>
                    );
                  })
                )}
              </View>
            </View>
            </View>
          </ScrollView>
        )}

        {activeNav === 'recipes' && (
          <RecipesScreen
            onSelectRecipe={(id) => pushNav({ selectedRecipeId: id })}
            onAddRecipe={() => {
              pushNav({ isAddingRecipe: true });
            }}
          />
        )}

        {activeNav === 'group' && (
          <GroupScreen
            user={user}
            onLogout={() => setUser(null)}
            group={group}
            loading={groupLoading}
            onRefreshGroup={fetchGroup}
            recipes={recipes}
            onSelectRecipe={(id) => pushNav({ selectedRecipeId: id })}
            view={groupView}
            setView={(v) => pushNav({ groupView: v })}
            selectedOrderId={selectedOrderId}
            setSelectedOrderId={(id) => pushNav({ selectedOrderId: id })}
          />
        )}
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          {screenContent}
        </SafeAreaView>
      </View>

      {/* Drawer Backdrop Overlay */}
      {activeNav === 'menu' && activeCartItems.length > 0 && isCartDrawerOpen && (
        <TouchableOpacity 
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setIsCartDrawerOpen(false)}
        />
      )}

      {/* Floating Cart Drawer (Bottom Sheet) */}
      {activeNav === 'menu' && activeCartItems.length > 0 && isCartDrawerOpen && (
        <View style={styles.cartDrawer}>
          <View style={styles.cartDrawerHandle} />
          
          <View style={styles.cartDrawerHeader}>
            <View style={styles.cartDrawerHeaderLeft}>
              <Text style={styles.cartDrawerEmoji}>🛒</Text>
              <View>
                <Text style={styles.cartDrawerTitle}>{mealInfo.label}购物车</Text>
                <Text style={styles.cartDrawerSubtitle}>
                  {activeCartItems.length} 道菜 · 预计 {totalTime} 分钟
                </Text>
              </View>
            </View>
            <View style={styles.cartDrawerHeaderRight}>
              <TouchableOpacity 
                onPress={handleClearCart}
                style={styles.clearCartBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.clearCartText}>清空</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.cartDrawerList} showsVerticalScrollIndicator={false}>
            {activeCartItems.map((id) => {
              const recipe = recipes.find(r => r.id === id);
              if (!recipe) return null;
              const hasCoverImg = recipe.images && recipe.images.length > 0;
              return (
                <View key={id} style={styles.cartDrawerItem}>
                  <View style={styles.cartDrawerItemLeft}>
                    {hasCoverImg ? (
                      <Image source={{ uri: recipe.images[0] }} style={styles.cartDrawerItemThumb} />
                    ) : (
                      <View style={styles.cartDrawerItemThumbFallback}>
                        <Text style={styles.cartDrawerItemIcon}>{recipe.icon || '🍳'}</Text>
                      </View>
                    )}
                    <View style={styles.cartDrawerItemInfo}>
                      <Text style={styles.cartDrawerItemName} numberOfLines={1}>{recipe.name}</Text>
                      <Text style={styles.cartDrawerItemMeta}>{recipe.cookTime}分钟 · {recipe.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => toggleRecipe(id)}
                    style={styles.cartDrawerItemRemove}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cartDrawerItemRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.cartDrawerFooter}>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onPress={handleConfirmOrder}
            >
              确认点菜 👉
            </Button>
          </View>
        </View>
      )}

      {/* Floating Cart Toolbar (only visible when drawer is closed) */}
      {activeNav === 'menu' && activeCartItems.length > 0 && !isCartDrawerOpen && (
        <View style={styles.floatingCartBar}>
          <TouchableOpacity 
            style={styles.cartInfoBtn}
            onPress={() => setIsCartDrawerOpen(true)}
            activeOpacity={0.7}
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
      )}

      {/* Bottom Navigation Sticky Bar */}
      {!selectedRecipeId && !editingRecipeId && !isAddingRecipe && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavChange('menu')}
          >
            <Text style={[styles.navIcon, activeNav === 'menu' ? styles.navTextActive : null]}>🍳</Text>
            <Text style={[styles.navLabel, activeNav === 'menu' ? styles.navTextActive : null]}>点菜</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavChange('recipes')}
          >
            <Text style={[styles.navIcon, activeNav === 'recipes' ? styles.navTextActive : null]}>📖</Text>
            <Text style={[styles.navLabel, activeNav === 'recipes' ? styles.navTextActive : null]}>菜谱</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavChange('group')}
          >
            <Text style={[styles.navIcon, activeNav === 'group' ? styles.navTextActive : null]}>👥</Text>
            <Text style={[styles.navLabel, activeNav === 'group' ? styles.navTextActive : null]}>家庭</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reusable Custom Alert Modals */}
      <AlertModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={modalConfirm}
        title={modalTitle}
        description={modalDesc}
        type={modalType}
        variant={modalVariant}
        confirmText="确认"
        cancelText="取消"
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
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
    height: 188,
    backgroundColor: theme.colors.bg.card,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing[3],
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    position: 'relative',
    overflow: 'hidden',
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.primary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginTop: theme.spacing[3],
  },
  cardCover: {
    height: 96,
    width: '100%',
    position: 'relative',
    backgroundColor: theme.colors.primary[50],
    overflow: 'hidden',
  },
  cardCoverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardCoverFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCoverEmoji: {
    fontSize: 36,
  },
  cardBadgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  cardContent: {
    padding: theme.spacing[2],
    flex: 1,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 98,
  },
  clearCartBtn: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.danger.light + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[2],
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.danger.dark,
  },
  cartDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: theme.radius['2xl'],
    borderTopRightRadius: theme.radius['2xl'],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    maxHeight: '60%',
    zIndex: 99,
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[2],
    paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing[5],
    // Shadow
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cartDrawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.neutral[300],
    alignSelf: 'center',
    marginBottom: theme.spacing[3],
  },
  cartDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  cartDrawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartDrawerEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  cartDrawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  cartDrawerSubtitle: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  cartDrawerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartDrawerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartDrawerCloseText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  cartDrawerList: {
    marginVertical: theme.spacing[2],
  },
  cartDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  cartDrawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartDrawerItemThumb: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    marginRight: theme.spacing[3],
  },
  cartDrawerItemThumbFallback: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  cartDrawerItemIcon: {
    fontSize: 22,
  },
  cartDrawerItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cartDrawerItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  cartDrawerItemMeta: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  cartDrawerItemRemove: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[2],
  },
  cartDrawerItemRemoveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.tertiary,
  },
  cartDrawerFooter: {
    marginTop: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});
