'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button, Input, Card, AlertModal } from '@/components/ui';
import { RECIPE_CATEGORIES, RECIPE_TAGS, INGREDIENT_CATEGORIES } from '@/types';
import type { Ingredient, CookingStep, Difficulty } from '@/types';
import { ImageUploader } from '@/components/recipe/ImageUploader';
import styles from './edit-recipe.module.css';

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(RECIPE_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [servings, setServings] = useState(2);
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(20);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<string[]>([]);

  // Alert popup state
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; description: string; type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    description: '',
  });


  // Dynamic lists
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', category: '肉类' }]);
  const [utensils, setUtensils] = useState<string[]>(['']);
  const [steps, setSteps] = useState<CookingStep[]>([{ order: 1, description: '', duration: undefined }]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/recipes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Recipe not found');
        return res.json();
      })
      .then((data: any) => {
        // Verify owner
        if (user && data.createdBy !== user.uid && data.createdBy !== 'system') {
          setError('您无权编辑这道菜谱');
          setLoading(false);
          return;
        }

        setName(data.name);
        setDescription(data.description || '');
        setCategory(data.category);
        setDifficulty(data.difficulty);
        setServings(data.servings);
        setPrepTime(data.prepTime);
        setCookTime(data.cookTime);
        setSelectedTags(new Set(data.tags));
        setImages(Array.isArray(data.images) ? data.images : []);
        setIngredients(data.ingredients.length > 0 ? data.ingredients : [{ name: '', amount: '', category: '肉类' }]);
        setUtensils(data.utensils.length > 0 ? data.utensils : ['']);
        setSteps(data.steps.length > 0 ? data.steps : [{ order: 1, description: '', duration: undefined }]);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('加载菜谱失败');
        setLoading(false);
      });
  }, [id, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || loading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载菜谱数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>❌</span>
        <p>{error}</p>
        <Button onClick={() => router.push('/recipes')}>返回菜谱</Button>
      </div>
    );
  }

  // --- Dynamic list operations ---
  const addIngredient = () => setIngredients([...ingredients, { name: '', amount: '', category: '肉类' }]);
  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
  };
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addUtensil = () => setUtensils([...utensils, '']);
  const updateUtensil = (index: number, value: string) => {
    setUtensils(utensils.map((ut, i) => (i === index ? value : ut)));
  };
  const removeUtensil = (index: number) => {
    if (utensils.length > 1) setUtensils(utensils.filter((_, i) => i !== index));
  };

  const addStep = () => setSteps([...steps, { order: steps.length + 1, description: '', duration: undefined }]);
  const updateStep = (index: number, field: keyof CookingStep, value: any) => {
    setSteps(steps.map((st, i) => (i === index ? { ...st, [field]: value } : st)));
  };
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const filtered = steps.filter((_, i) => i !== index);
      setSteps(filtered.map((st, i) => ({ ...st, order: i + 1 })));
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      const recipeData = {
        name: name.trim(),
        description: description.trim(),
        category,
        difficulty,
        servings,
        prepTime,
        cookTime,
        images,
        tags: Array.from(selectedTags),
        ingredients: ingredients.filter((i) => i.name.trim()),
        utensils: utensils.filter((u) => u.trim()),
        steps: steps.filter((s) => s.description.trim()),
      };

      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user?.uid || '',
        },
        body: JSON.stringify(recipeData),
      });

      if (!res.ok) throw new Error('Update failed');
      router.push(`/recipes/${id}`);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      setAlertState({
        isOpen: true,
        title: '保存失败',
        description: '保存失败，请重试',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header title="编辑菜谱" showBack />

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Base Info */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>基本信息</h3>
            <Input
              label="菜谱名称"
              placeholder="例如：红烧肉 🍖"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="简介"
              placeholder="这道菜背后的故事，或者它的风味特点..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </section>

          {/* Images */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>菜品预览图</h3>
            <p className={styles.sectionHint}>最多 5 张，第一张为封面图；没有图片时使用 Emoji 代替</p>
            <ImageUploader images={images} onChange={setImages} />
          </section>

          {/* Classification */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>菜系风味</h3>
            <div className={styles.chipsGrid}>
              {RECIPE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.chip} ${category === cat ? styles.chipActive : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Difficulty and Portions */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>规格信息</h3>
            <div className={styles.row}>
              <div className={styles.flex1}>
                <label className={styles.label}>难度</label>
                <select
                  className={styles.select}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
              <Input
                type="number"
                label="分量 (人份)"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className={styles.row}>
              <Input
                type="number"
                label="准备时间 (分钟)"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                min={0}
              />
              <Input
                type="number"
                label="制作时间 (分钟)"
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value))}
                min={0}
              />
            </div>
          </section>

          {/* Ingredients list */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>用料明细</h3>
              <Button type="button" variant="ghost" size="sm" onClick={addIngredient}>
                + 添加食材
              </Button>
            </div>

            <div className={styles.dynamicList}>
              {ingredients.map((ing, index) => (
                <Card key={index} padding="sm" className={styles.dynamicItem}>
                  <div className={styles.dynamicFields}>
                    <input
                      className={styles.plainInput}
                      placeholder="食材名称，如：猪五花"
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    />
                    <input
                      className={styles.plainInput}
                      placeholder="用量，如：500g"
                      value={ing.amount}
                      onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                    />
                    <select
                      className={styles.plainSelect}
                      value={ing.category || '其他'}
                      onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                    >
                      {INGREDIENT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeIngredient(index)}
                    >
                      ✕
                    </button>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* Utensils */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>厨具需求</h3>
              <Button type="button" variant="ghost" size="sm" onClick={addUtensil}>
                + 添加厨具
              </Button>
            </div>
            <div className={styles.dynamicList}>
              {utensils.map((ut, index) => (
                <div key={index} className={styles.utensilRow}>
                  <input
                    className={styles.plainInputUnderline}
                    placeholder="如：炒锅、平底锅"
                    value={ut}
                    onChange={(e) => updateUtensil(index, e.target.value)}
                  />
                  {utensils.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeBtnInline}
                      onClick={() => removeUtensil(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Steps */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>烹饪步骤</h3>
              <Button type="button" variant="ghost" size="sm" onClick={addStep}>
                + 添加步骤
              </Button>
            </div>
            <div className={styles.dynamicList}>
              {steps.map((st, index) => (
                <Card key={index} padding="sm" className={styles.stepCardItem}>
                  <div className={styles.stepHeader}>
                    <span className={styles.stepBadge}>步骤 {st.order}</span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeStep(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <textarea
                    className={styles.textarea}
                    placeholder="描述该步骤的具体操作细节..."
                    value={st.description}
                    onChange={(e) => updateStep(index, 'description', e.target.value)}
                    rows={2}
                  />
                  <div className={styles.stepTimerRow}>
                    <span className={styles.timerLabel}>⏱️ 需烹饪：</span>
                    <input
                      type="number"
                      className={styles.timerInput}
                      placeholder="分钟"
                      value={st.duration || ''}
                      onChange={(e) => updateStep(index, 'duration', e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <span className={styles.timerLabel}>分钟 (可选)</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>推荐标签</h3>
            <div className={styles.chipsGrid}>
              {RECIPE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tagChip} ${selectedTags.has(tag) ? styles.tagChipActive : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </section>

          {/* Submit */}
          <Button type="submit" size="lg" fullWidth loading={saving}>
            💾 保存修改
          </Button>
        </form>
      </main>

      <BottomNav />

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
