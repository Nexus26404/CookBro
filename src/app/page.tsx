'use client';

import useSWR from 'swr';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { EmptyState } from '@/components/layout/EmptyState';
import { Button, Badge, Card, AlertModal } from '@/components/ui';
import { useRecipes } from '@/hooks/useRecipes';
import { useGroup, useTodayOrder } from '@/hooks/useGroup';
import { useCart } from '@/context/CartContext';
import { RecipeSummarySheet } from '@/components/recipe/RecipeSummarySheet';
import { CartDrawer } from '@/components/recipe/CartDrawer';
import type { MealType, Recipe, Order } from '@/types';
import styles from './page.module.css';

type MealTab = MealType;

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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { group, loading: groupLoading } = useGroup(user?.uid);
  const { order } = useTodayOrder(group?.id);
  const { cart, toggleInCart, removeFromCart, addToCart, clearCart } = useCart();
  const router = useRouter();

  // Fetch all group orders to calculate order counts
  const { data: allOrders } = useSWR<Order[]>(
    group?.id ? `/api/orders?groupId=${group.id}` : null,
    fetcher
  );

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!allOrders) return counts;
    for (const ord of allOrders) {
      for (const meal of ord.meals) {
        for (const recipeId of meal.recipes) {
          counts[recipeId] = (counts[recipeId] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allOrders]);

  const [activeTab, setActiveTab] = useState<MealTab>(getDefaultMeal);
  const [confirming, setConfirming] = useState(false);

  // Bottom Sheet state
  const [selectedRecipeForSheet, setSelectedRecipeForSheet] = useState<Recipe | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Cart Drawer state
  const [isCartOpen, setIsCartOpen] = useState(false);

  const activeCartItems = cart[activeTab] || [];

  // Custom alert popup state
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; description: string; type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    description: '',
  });


  // Collapsible toolbar state
  const [isBarCollapsed, setIsBarCollapsed] = useState(false);

  // Auto-expand tool bar when item count changes
  useEffect(() => {
    if (activeCartItems.length > 0) {
      setIsBarCollapsed(false);
    }
  }, [activeCartItems.length]);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || recipesLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载中...</p>
      </div>
    );
  }



  const handleConfirmOrder = async () => {
    if (!user || activeCartItems.length === 0) return;

    if (!group) {
      router.push('/group');
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch('/api/orders/today', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({
          groupId: group.id,
          mealType: activeTab,
          recipeIds: activeCartItems,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      clearCart(activeTab);
      setIsCartOpen(false);
    } catch (err) {
      console.error('Failed to confirm order:', err);
      setAlertState({
        isOpen: true,
        title: '点菜失败',
        description: '点菜失败，请重试',
        type: 'error',
      });
    } finally {
      setConfirming(false);
    }
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[today.getDay()];
  const mealInfo = MEAL_CONFIG[activeTab];

  // Find already-ordered recipe IDs for the current meal
  const orderedForTab = order?.meals.find((m) => m.type === activeTab)?.recipes || [];

  const handleReorder = () => {
    clearCart(activeTab);
    orderedForTab.forEach((rid) => {
      addToCart(activeTab, rid);
    });
  };

  const handleRandomRecipe = () => {
    const available = recipes.filter(
      (r) => !activeCartItems.includes(r.id) && !orderedForTab.includes(r.id)
    );

    if (available.length === 0) {
      setAlertState({
        isOpen: true,
        title: '提示',
        description: '当前时段所有可选的菜品已在购物车或已点！',
        type: 'warning',
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const randomRecipe = available[randomIndex];
    addToCart(activeTab, randomRecipe.id);
  };

  return (
    <div className={styles.page}>
      <Header title="CookBro" />

      <main className={styles.main}>
        {/* 日期和问候 */}
        <section className={styles.greeting}>
          <div className={styles.dateRow}>
            <span className={styles.dateText}>{dateStr} {weekday}</span>
            {group && (
              <span className={styles.groupBadge}>🏠 {group.name}</span>
            )}
          </div>
          <h2 className={styles.greetingText}>
            <span className={styles.mealIcon}>{mealInfo.icon}</span>
            {mealInfo.greeting}
          </h2>
        </section>

        {/* 今日已点提示 */}
        {orderedForTab.length > 0 && (
          <div className={styles.orderedBanner}>
            <span>✅ 今天{mealInfo.label}已点 {orderedForTab.length} 道菜</span>
            <button className={styles.reorderBtn} onClick={handleReorder}>
              重新选择并加回购物车
            </button>
          </div>
        )}

        {/* 餐次切换 */}
        <div className={styles.tabBar}>
          {(Object.entries(MEAL_CONFIG) as [MealTab, typeof mealInfo][]).map(([key, config]) => {
            const hasMeal = order?.meals.find((m) => m.type === key);
            return (
              <button
                key={key}
                className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(key);
                }}
              >
                <span className={styles.tabIcon}>{config.icon}</span>
                <span>{config.label}</span>
                {hasMeal && <span className={styles.tabDot} />}
              </button>
            );
          })}
        </div>

        {/* 菜品列表 */}
        <section className={styles.menuSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerLeftGroup}>
              <Button variant="secondary" size="sm" onClick={handleRandomRecipe}>
                🎲 随机点菜
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/recipes')}>
              查看全部 →
            </Button>
          </div>

          {recipes.length === 0 ? (
            <EmptyState
              icon="📝"
              title="还没有菜谱"
              description="去菜谱页面添加你的第一个菜谱吧"
              action={
                <Button onClick={() => router.push('/recipes/new')}>
                  添加菜谱
                </Button>
              }
            />
          ) : (
            <div className={styles.menuGrid}>
              {recipes.map((recipe, index) => {
                const isSelected = activeCartItems.includes(recipe.id);
                const isOrdered = orderedForTab.includes(recipe.id);
                const diffInfo = DIFFICULTY_MAP[recipe.difficulty];
                const coverSrc = recipe.images?.[0];
                const count = orderCounts[recipe.id] || 0;
                return (
                  <Card
                    key={recipe.id}
                    hoverable
                    padding="none"
                    onClick={() => {
                      setSelectedRecipeForSheet(recipe);
                      setIsSheetOpen(true);
                    }}
                    className={`${styles.menuCard} ${isSelected ? styles.menuCardSelected : ''} ${isOrdered ? styles.menuCardOrdered : ''}`}
                  >
                    <div className={styles.menuCardInner} style={{ animationDelay: `${index * 60}ms` }}>
                      {/* Left: Thumbnail image or fallback emoji */}
                      <div className={styles.menuCardIcon}>
                        <div className={styles.menuCardImgWrapper}>
                          {coverSrc ? (
                            <img src={coverSrc} alt={recipe.name} className={styles.menuCardImg} />
                          ) : (
                            <span className={styles.fallbackEmoji}>{recipe.icon || '🍳'}</span>
                          )}
                        </div>
                        {isSelected && <span className={styles.checkMark}>✓</span>}
                        {isOrdered && !isSelected && <span className={styles.orderedMark}>✓</span>}
                      </div>

                      {/* Right: Info */}
                      <div className={styles.menuCardInfo}>
                        <div className={styles.menuCardHeader}>
                          <h4 className={styles.menuCardName}>{recipe.name}</h4>
                          <Badge variant="primary" size="sm">{recipe.category}</Badge>
                        </div>
                        
                        <div className={styles.menuCardMeta}>
                          <span className={styles.metaBadge}>🔥 已点 {count} 次</span>
                          <span className={styles.metaText}>⏱️ {recipe.cookTime}分钟</span>
                          <span className={styles.metaText}>•</span>
                          <Badge variant={diffInfo.color} size="sm">{diffInfo.label}</Badge>
                        </div>

                        {recipe.description && (
                          <p className={styles.menuCardDesc}>{recipe.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* 购物车悬浮按钮 / 已选菜品栏 */}
        {activeCartItems.length > 0 && (
          isBarCollapsed ? (
            <button
              type="button"
              className={styles.collapsedCartBtn}
              onClick={() => setIsBarCollapsed(false)}
              aria-label="展开选菜工具栏"
            >
              <span className={styles.collapsedCartEmoji}>🛒</span>
              <span className={styles.collapsedCartBadge}>{activeCartItems.length}</span>
            </button>
          ) : (
            <div className={styles.selectedBar}>
              <button
                className={styles.cartBadgeBtn}
                onClick={() => setIsCartOpen(true)}
                aria-label="查看购物车"
              >
                <span className={styles.cartBadgeIcon}>🛒</span>
                <span className={styles.selectedCount}>已选 {activeCartItems.length} 道菜</span>
                <svg className={styles.cartChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <div className={styles.barRightActions}>
                <button
                  type="button"
                  className={styles.minimizeBarBtn}
                  onClick={() => setIsBarCollapsed(true)}
                  title="收起工具栏"
                  aria-label="收起"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                  </svg>
                </button>
                <Button size="md" loading={confirming} onClick={handleConfirmOrder}>
                  {group ? '确认点菜 👉' : '先创建家庭 →'}
                </Button>
              </div>
            </div>
          )
        )}
      </main>

      <BottomNav />

      {/* Quick Summary Popup Sheet */}
      <RecipeSummarySheet
        recipe={selectedRecipeForSheet}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        mealType={activeTab}
        isInCart={selectedRecipeForSheet ? activeCartItems.includes(selectedRecipeForSheet.id) : false}
        isLocked={orderedForTab.length > 0}
        onToggleCart={() => {
          if (selectedRecipeForSheet) {
            toggleInCart(activeTab, selectedRecipeForSheet.id);
          }
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        mealType={activeTab}
        cartItems={activeCartItems}
        recipes={recipes}
        onRemove={(recipeId) => removeFromCart(activeTab, recipeId)}
        onClear={() => clearCart(activeTab)}
        onConfirm={handleConfirmOrder}
        confirming={confirming}
        isGroupReady={!!group}
      />

      {/* Global Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        description={alertState.description}
        type={alertState.type}
      />
    </div>
  );
}
