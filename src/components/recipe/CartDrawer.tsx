'use client';

import { useEffect, useRef } from 'react';
import type { MealType, Recipe } from '@/types';
import { Button } from '@/components/ui';
import styles from './CartDrawer.module.css';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
};

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  cartItems: string[];
  recipes: Recipe[];
  onRemove: (recipeId: string) => void;
  onConfirm: () => void;
  confirming?: boolean;
  isGroupReady: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  mealType,
  cartItems,
  recipes,
  onRemove,
  onConfirm,
  confirming = false,
  isGroupReady,
}: CartDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const cartRecipes = cartItems
    .map((id) => recipes.find((r) => r.id === id))
    .filter(Boolean) as Recipe[];

  const totalTime = cartRecipes.reduce((sum, r) => sum + r.cookTime + r.prepTime, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="购物车"
      >
        {/* Handle bar */}
        <div className={styles.handle} onClick={onClose} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.cartEmoji}>🛒</span>
            <div>
              <h2 className={styles.title}>{MEAL_LABELS[mealType]}购物车</h2>
              <p className={styles.subtitle}>
                {cartItems.length} 道菜 · 预计 {totalTime} 分钟
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Empty state */}
        {cartRecipes.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🍽️</span>
            <p>还没有选菜，去点餐吧！</p>
          </div>
        ) : (
          <>
            {/* Recipe list */}
            <div className={styles.list}>
              {cartRecipes.map((recipe, index) => {
                const coverSrc = recipe.images?.[0];
                return (
                  <div
                    key={recipe.id}
                    className={styles.item}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* Cover / emoji */}
                    <div className={styles.itemThumb}>
                      {coverSrc ? (
                        <img src={coverSrc} alt={recipe.name} className={styles.thumbImg} />
                      ) : (
                        <span className={styles.thumbEmoji}>{recipe.icon || '🍳'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{recipe.name}</span>
                      <span className={styles.itemMeta}>{recipe.cookTime}分钟 · {recipe.category}</span>
                    </div>

                    {/* Remove button */}
                    <button
                      className={styles.removeBtn}
                      onClick={() => onRemove(recipe.id)}
                      aria-label={`移除 ${recipe.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer action */}
            <div className={styles.footer}>
              <Button
                fullWidth
                size="lg"
                loading={confirming}
                onClick={onConfirm}
              >
                {isGroupReady ? `确认${MEAL_LABELS[mealType]}点菜 ✓` : '先创建家庭 →'}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
