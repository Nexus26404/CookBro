'use client';

import React from 'react';
import type { Recipe, MealType } from '@/types';
import { Button, Badge } from '@/components/ui';
import styles from './RecipeSummarySheet.module.css';

interface RecipeSummarySheetProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  isInCart: boolean;
  onToggleCart: () => void;
  isLocked?: boolean;
}

const DIFFICULTY_MAP = {
  easy: { label: '简单', color: 'success' as const },
  medium: { label: '中等', color: 'warning' as const },
  hard: { label: '困难', color: 'danger' as const },
};

export function RecipeSummarySheet({
  recipe,
  isOpen,
  onClose,
  mealType,
  isInCart,
  onToggleCart,
  isLocked,
}: RecipeSummarySheetProps) {
  if (!recipe || !isOpen) return null;

  const diffInfo = DIFFICULTY_MAP[recipe.difficulty];
  const mealName = mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐';

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handleBar} />
        
        <header className={styles.header}>
          <div className={styles.iconWrap}>
            {recipe.images?.[0] ? (
              <img src={recipe.images[0]} alt={recipe.name} className={styles.coverImg} />
            ) : (
              <span className={styles.icon}>{recipe.icon || '🍳'}</span>
            )}
          </div>
          <div className={styles.titleWrap}>
            <h3 className={styles.name}>{recipe.name}</h3>
            <div className={styles.meta}>
              <Badge variant="primary">{recipe.category}</Badge>
              <Badge variant={diffInfo.color}>{diffInfo.label}</Badge>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </header>

        <div className={styles.content}>
          {recipe.description && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>简介</h4>
              <p className={styles.description}>{recipe.description}</p>
            </div>
          )}

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>准备时间</span>
              <span className={styles.infoValue}>{recipe.prepTime} 分钟</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>制作时间</span>
              <span className={styles.infoValue}>{recipe.cookTime} 分钟</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>分量</span>
              <span className={styles.infoValue}>{recipe.servings} 人份</span>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          {isLocked ? (
            <div className={styles.lockedWarning}>
              🔒 当前时段已确认点菜，如需修改请点击上方的“重新选择”
            </div>
          ) : (
            <Button
              variant={isInCart ? 'danger' : 'primary'}
              fullWidth
              size="lg"
              onClick={() => {
                onToggleCart();
                onClose();
              }}
            >
              {isInCart ? `从${mealName}购物车移除` : `加入${mealName}购物车`}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
