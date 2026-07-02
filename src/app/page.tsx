'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { EmptyState } from '@/components/layout/EmptyState';
import { Button, Badge, Card } from '@/components/ui';
import { useRecipes } from '@/hooks/useRecipes';
import { useGroup, useTodayOrder } from '@/hooks/useGroup';
import { useCart } from '@/context/CartContext';
import { RecipeSummarySheet } from '@/components/recipe/RecipeSummarySheet';
import type { MealType, Recipe } from '@/types';
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

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { group, loading: groupLoading } = useGroup(user?.uid);
  const { order } = useTodayOrder(group?.id);
  const { cart, toggleInCart, addToCart, clearCart } = useCart();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<MealTab>(getDefaultMeal);
  const [confirming, setConfirming] = useState(false);

  // Bottom Sheet state
  const [selectedRecipeForSheet, setSelectedRecipeForSheet] = useState<Recipe | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  const activeCartItems = cart[activeTab] || [];

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
    } catch (err) {
      console.error('Failed to confirm order:', err);
      alert('点菜失败，请重试');
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
            <h3 className={styles.sectionTitle}>菜品模板</h3>
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
                      <div className={styles.menuCardIcon}>
                        <span>{recipe.icon || '🍳'}</span>
                        {isSelected && <span className={styles.checkMark}>✓</span>}
                        {isOrdered && !isSelected && <span className={styles.orderedMark}>✓</span>}
                      </div>
                      <div className={styles.menuCardInfo}>
                        <h4 className={styles.menuCardName}>{recipe.name}</h4>
                        <div className={styles.menuCardMeta}>
                          <Badge variant={diffInfo.color} size="sm">{diffInfo.label}</Badge>
                          <span className={styles.cookTime}>{recipe.cookTime}分钟</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* 已选菜品栏 */}
        {activeCartItems.length > 0 && (
          <div className={styles.selectedBar}>
            <div className={styles.selectedInfo}>
              <span className={styles.selectedCount}>已选 {activeCartItems.length} 道菜</span>
            </div>
            <Button size="md" loading={confirming} onClick={handleConfirmOrder}>
              {group ? '确认点菜 👉' : '先创建家庭 →'}
            </Button>
          </div>
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
    </div>
  );
}
