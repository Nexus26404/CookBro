'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useGroup } from '@/hooks/useGroup';
import { useRecipes } from '@/hooks/useRecipes';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { EmptyState } from '@/components/layout/EmptyState';
import { Card, Badge, Button } from '@/components/ui';
import type { Order, Recipe, MealType } from '@/types';
import styles from './orders.module.css';

const MEAL_LABELS: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: '早餐', icon: '🍳' },
  lunch: { label: '午餐', icon: '🍜' },
  dinner: { label: '晚餐', icon: '🍲' },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { group, loading: groupLoading } = useGroup(user?.uid);
  const { recipes } = useRecipes();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groupLoading || !group?.id) return;
    setLoading(true);
    fetch(`/api/orders?groupId=${group.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError('无法加载订单历史');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [group, groupLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const isLoading = authLoading || groupLoading || loading;

  if (isLoading || !user) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载订单历史中...</p>
      </div>
    );
  }

  // Create a recipe dictionary for fast lookup
  const recipeMap = recipes.reduce<Record<string, Recipe>>((acc, recipe) => {
    acc[recipe.id] = recipe;
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <Header title="订单历史" showBack />

      <main className={styles.main}>
        {!group ? (
          <EmptyState
            icon="🏠"
            title="您还没有加入家庭"
            description="加入或创建一个家庭以开始记录订单"
            action={<Button onClick={() => router.push('/group')}>去家庭设置</Button>}
          />
        ) : error ? (
          <div className={styles.errorContainer}>
            <span className={styles.errorIcon}>❌</span>
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="📝"
            title="暂无订单记录"
            description="今天点一些菜，订单就会出现在这里啦！"
            action={<Button onClick={() => router.push('/')}>去点菜</Button>}
          />
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order, idx) => {
              const orderDate = new Date(order.date);
              const formattedDate = `${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;
              
              return (
                <Card
                  key={order.id}
                  className={styles.orderCard}
                  padding="md"
                  hoverable
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className={styles.orderHeader}>
                    <span className={styles.dateText}>{formattedDate}</span>
                    <Badge variant="success">已确认</Badge>
                  </div>
                  
                  <div className={styles.mealsList}>
                    {order.meals.map((meal) => {
                      const mealConf = MEAL_LABELS[meal.type];
                      return (
                        <div key={meal.type} className={styles.mealItem}>
                          <div className={styles.mealType}>
                            <span className={styles.mealIcon}>{mealConf.icon}</span>
                            <span>{mealConf.label}</span>
                          </div>
                          
                          <div className={styles.recipesList}>
                            {meal.recipes.map((rid) => {
                              const r = recipeMap[rid];
                              return (
                                <div key={rid} className={styles.recipeTag}>
                                  <span className={styles.recipeEmoji}>{r?.icon || '🍳'}</span>
                                  <span>{r?.name || '未知菜品'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
