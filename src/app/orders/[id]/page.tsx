'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRecipes } from '@/hooks/useRecipes';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { EmptyState } from '@/components/layout/EmptyState';
import { Card, Badge, Button } from '@/components/ui';
import type { Order, Recipe, MealType } from '@/types';
import styles from './order-detail.module.css';

const MEAL_LABELS: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: '早餐', icon: '🍳' },
  lunch: { label: '午餐', icon: '🍜' },
  dinner: { label: '晚餐', icon: '🍲' },
};

interface AggregatedIngredient {
  name: string;
  amounts: string[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { recipes, loading: recipesLoading } = useRecipes();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  // Load order data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError('无法加载订单详情');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Load todo list check states from localStorage
  useEffect(() => {
    if (!id) return;
    try {
      const saved = localStorage.getItem(`cookbro_shopping_${id}`);
      if (saved) {
        setCheckedIngredients(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  // Save todo list check states to localStorage
  const handleToggleCheck = (ingName: string) => {
    setCheckedIngredients((prev) => {
      const updated = { ...prev, [ingName]: !prev[ingName] };
      try {
        localStorage.setItem(`cookbro_shopping_${id}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const isLoading = authLoading || recipesLoading || loading;

  if (isLoading || !user) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载订单明细中...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>❌</span>
        <p>{error || '订单不存在'}</p>
        <Button onClick={() => router.push('/orders')}>返回订单历史</Button>
      </div>
    );
  }

  // Create recipe map
  const recipeMap = recipes.reduce<Record<string, Recipe>>((acc, recipe) => {
    acc[recipe.id] = recipe;
    return acc;
  }, {});

  // Aggregate ingredients
  const ingredientMap: Record<string, string[]> = {};
  
  order.meals.forEach((meal) => {
    meal.recipes.forEach((recipeId) => {
      const r = recipeMap[recipeId];
      if (r && r.ingredients) {
        r.ingredients.forEach((ing) => {
          const name = ing.name.trim();
          if (!ingredientMap[name]) {
            ingredientMap[name] = [];
          }
          if (ing.amount) {
            ingredientMap[name].push(ing.amount);
          }
        });
      }
    });
  });

  const aggregatedIngredients: AggregatedIngredient[] = Object.keys(ingredientMap).map((name) => ({
    name,
    amounts: ingredientMap[name],
  }));

  const orderDate = new Date(order.date);
  const dateStr = `${orderDate.getFullYear()}年${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;

  return (
    <div className={styles.page}>
      <Header title={`${orderDate.getMonth() + 1}月${orderDate.getDate()}日订单`} showBack />

      <main className={styles.main}>
        {/* Info Card */}
        <section className={styles.infoSection}>
          <h2 className={styles.dateTitle}>{dateStr}</h2>
          <div className={styles.statusRow}>
            <span>订单状态:</span>
            <Badge variant="success">已确认</Badge>
          </div>
        </section>

        {/* Ordered Recipes List */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>今日菜品</h3>
          <div className={styles.mealsContainer}>
            {order.meals.map((meal) => {
              const labelConf = MEAL_LABELS[meal.type];
              return (
                <div key={meal.type} className={styles.mealBlock}>
                  <h4 className={styles.mealHeader}>
                    <span className={styles.mealIcon}>{labelConf.icon}</span>
                    {labelConf.label}
                  </h4>
                  <div className={styles.recipesGrid}>
                    {meal.recipes.map((rid) => {
                      const r = recipeMap[rid];
                      return r ? (
                        <Link
                          key={rid}
                          href={`/recipes/${rid}?fromOrder=true`}
                          className={styles.recipeCardLink}
                        >
                          <Card className={styles.recipeCard} padding="sm">
                            <span className={styles.recipeIcon}>{r.icon || '🍳'}</span>
                            <span className={styles.recipeName}>{r.name}</span>
                          </Card>
                        </Link>
                      ) : (
                        <Card key={rid} className={styles.recipeCardDisabled} padding="sm">
                          <span className={styles.recipeIcon}>🍳</span>
                          <span className={styles.recipeNameDisabled}>已删除的菜品</span>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Shopping Todo List */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>采购清单 (TodoList)</h3>
          {aggregatedIngredients.length === 0 ? (
            <Card padding="md" className={styles.emptyIngredientsCard}>
              <p className={styles.emptyText}>无可采购食材（请检查菜品是否有配料）</p>
            </Card>
          ) : (
            <Card padding="none" className={styles.todoCard}>
              <div className={styles.todoList}>
                {aggregatedIngredients.map((ing) => {
                  const isChecked = !!checkedIngredients[ing.name];
                  const amountsText = ing.amounts.length > 0 ? ` (${ing.amounts.join(' + ')})` : '';
                  return (
                    <div
                      key={ing.name}
                      className={`${styles.todoItem} ${isChecked ? styles.todoItemChecked : ''}`}
                      onClick={() => handleToggleCheck(ing.name)}
                    >
                      <div className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}>
                        {isChecked && '✓'}
                      </div>
                      <span className={styles.todoText}>
                        {ing.name}
                        <span className={styles.todoAmount}>{amountsText}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
