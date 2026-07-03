'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { EmptyState } from '@/components/layout/EmptyState';
import { Button, Card, Badge } from '@/components/ui';
import { RECIPE_CATEGORIES } from '@/types';
import { useRecipes } from '@/hooks/useRecipes';
import styles from './recipes.module.css';

const DIFFICULTY_MAP = {
  easy: { label: '简单', color: 'success' as const },
  medium: { label: '中等', color: 'warning' as const },
  hard: { label: '困难', color: 'danger' as const },
};

export default function RecipesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 对于当前用户所在的家庭，先不传 groupId（默认查询所有菜谱），等后续家庭功能完善后再过滤
  const { recipes, loading: recipesLoading } = useRecipes();

  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  if (authLoading || recipesLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载中...</p>
      </div>
    );
  }

  const categories = ['全部', ...RECIPE_CATEGORIES.slice(0, 8)];

  const filteredRecipes = recipes.filter((r) => {
    const matchesCategory = activeCategory === '全部' || r.category === activeCategory;
    const matchesSearch = !searchQuery || r.name.includes(searchQuery) || (r.description && r.description.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.page}>
      <Header
        title="菜谱"
        rightAction={
          <Link href="/recipes/new" className={styles.addButton} aria-label="添加菜谱">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        }
      />

      <main className={styles.main}>
        {/* 搜索框 */}
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className={styles.searchInput}
            placeholder="搜索菜谱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        {/* 分类筛选 */}
        <div className={styles.categoryScroll}>
          <div className={styles.categoryList}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 菜谱列表 */}
        {filteredRecipes.length > 0 ? (
          <div className={styles.recipeList}>
            {filteredRecipes.map((recipe, index) => {
              const diffInfo = DIFFICULTY_MAP[recipe.difficulty];
              return (
                <Card
                  key={recipe.id}
                  hoverable
                  padding="none"
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                  className={styles.recipeCard}
                >
                  <div className={styles.recipeCardInner} style={{ animationDelay: `${index * 50}ms` }}>
                    <div className={styles.recipeIconWrap}>
                      {recipe.images?.[0] ? (
                        <img src={recipe.images[0]} alt={recipe.name} className={styles.recipeCardImg} />
                      ) : (
                        <span className={styles.recipeIcon}>{recipe.icon || '🍳'}</span>
                      )}
                    </div>
                    <div className={styles.recipeInfo}>
                      <h3 className={styles.recipeName}>{recipe.name}</h3>
                      <p className={styles.recipeDesc}>{recipe.description}</p>
                      <div className={styles.recipeMeta}>
                        <Badge variant={diffInfo.color} size="sm">{diffInfo.label}</Badge>
                        <span className={styles.recipeTime}>⏱ {recipe.cookTime}分钟</span>
                        <span className={styles.recipeServings}>🍽 {recipe.servings}人份</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="🔍"
            title="没有找到菜谱"
            description="试试其他关键词或分类"
          />
        )}

        {/* 浮动添加按钮 */}
        <Link href="/recipes/new" className={styles.fab}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
