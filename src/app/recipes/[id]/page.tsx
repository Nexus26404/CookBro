'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button, Badge, Card } from '@/components/ui';
import type { Recipe } from '@/types';
import styles from './recipe-detail.module.css';

const DIFFICULTY_MAP = {
  easy: { label: '简单', color: 'success' as const },
  medium: { label: '中等', color: 'warning' as const },
  hard: { label: '困难', color: 'danger' as const },
};

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/recipes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Recipe not found');
        return res.json();
      })
      .then((data) => {
        setRecipe(data);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError('无法加载菜谱，请重试');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载菜谱中...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>❌</span>
        <p>{error || '菜谱不存在'}</p>
        <Button onClick={() => router.push('/recipes')}>返回菜谱</Button>
      </div>
    );
  }

  const fromOrder = searchParams.get('fromOrder') === 'true';
  const canModify = !fromOrder && (recipe.createdBy === user?.uid || recipe.createdBy === 'system');
  const diffInfo = DIFFICULTY_MAP[recipe.difficulty];

  const handleDelete = async () => {
    if (!confirm('确定要删除这道菜谱吗？此操作无法撤销。')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-uid': user?.uid || '',
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/recipes');
    } catch (err) {
      console.error(err);
      alert('删除失败，请重试');
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title={recipe.name}
        showBack
        rightAction={
          canModify && (
            <div className={styles.creatorActions}>
              <Link href={`/recipes/${recipe.id}/edit`} className={styles.editLink}>
                编辑
              </Link>
              <button
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '删除中...' : '删除'}
              </button>
            </div>
          )
        }
      />

      <main className={styles.main}>
        {/* Photo Gallery or Emoji Cover */}
        {recipe.images && recipe.images.length > 0 ? (
          <section className={styles.gallerySection}>
            <div className={styles.galleryScroll}>
              {recipe.images.map((src, idx) => (
                <div key={idx} className={`${styles.galleryItem} ${idx === 0 ? styles.galleryItemCover : ''}`}>
                  <img src={src} alt={`${recipe.name} 图片 ${idx + 1}`} className={styles.galleryImg} />
                  {idx === 0 && <span className={styles.galleryCoverBadge}>封面</span>}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className={styles.coverSection}>
            <div className={styles.iconWrap}>
              <span>{recipe.icon || '🍳'}</span>
            </div>
          </section>
        )}

        {/* Title area */}
        <section className={styles.titleSection}>
          <div className={styles.titleArea}>
            <h2 className={styles.name}>{recipe.name}</h2>
            <div className={styles.badges}>
              <Badge variant="primary">{recipe.category}</Badge>
              <Badge variant={diffInfo.color}>{diffInfo.label}</Badge>
            </div>
            {recipe.description && (
              <p className={styles.description}>{recipe.description}</p>
            )}
          </div>
        </section>

        {/* Time and Portion Specs */}
        <section className={styles.specsSection}>
          <div className={styles.specCard}>
            <span className={styles.specVal}>{recipe.prepTime}分钟</span>
            <span className={styles.specLabel}>准备</span>
          </div>
          <div className={styles.specCard}>
            <span className={styles.specVal}>{recipe.cookTime}分钟</span>
            <span className={styles.specLabel}>烹饪</span>
          </div>
          <div className={styles.specCard}>
            <span className={styles.specVal}>{recipe.servings}人份</span>
            <span className={styles.specLabel}>分量</span>
          </div>
        </section>

        {/* Utensils section */}
        {recipe.utensils.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>需要的厨具</h3>
            <div className={styles.utensilsList}>
              {recipe.utensils.map((u, i) => (
                <span key={i} className={styles.utensilTag}>
                  🍳 {u}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Ingredients */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>用料</h3>
          <Card padding="none" className={styles.card}>
            <div className={styles.ingredientsList}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className={styles.ingredientRow}>
                  <span className={styles.ingredientName}>{ing.name}</span>
                  <span className={styles.ingredientAmount}>{ing.amount}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Steps */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>步骤</h3>
          <div className={styles.stepsList}>
            {recipe.steps.map((step, i) => (
              <div key={i} className={styles.stepItem}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div className={styles.stepBody}>
                  <p className={styles.stepText}>{step.description}</p>
                  {step.duration && (
                    <span className={styles.stepTimer}>⏱️ 烹饪 {step.duration} 分钟</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
