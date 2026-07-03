'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button, Input, Card } from '@/components/ui';
import { RECIPE_CATEGORIES, RECIPE_TAGS, INGREDIENT_CATEGORIES } from '@/types';
import type { Ingredient, CookingStep, Difficulty } from '@/types';
import { ImageUploader } from '@/components/recipe/ImageUploader';
import styles from './new-recipe.module.css';

export default function NewRecipePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' },
  ]);
  const [utensils, setUtensils] = useState<string[]>(['']);
  const [steps, setSteps] = useState<CookingStep[]>([
    { order: 1, description: '' },
  ]);

  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, description: '' }]);
  };

  const updateStep = (index: number, description: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], description };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const addUtensil = () => {
    setUtensils([...utensils, '']);
  };

  const updateUtensil = (index: number, value: string) => {
    const updated = [...utensils];
    updated[index] = value;
    setUtensils(updated);
  };

  const removeUtensil = (index: number) => {
    if (utensils.length <= 1) return;
    setUtensils(utensils.filter((_, i) => i !== index));
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

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user?.uid || '',
        },
        body: JSON.stringify(recipeData),
      });

      if (!res.ok) throw new Error('Failed to save');
      router.push('/recipes');
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="新建菜谱"
        showBack
        rightAction={
          <Button size="sm" loading={saving} onClick={handleSubmit}>
            保存
          </Button>
        }
      />

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 基本信息 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>📝 基本信息</h3>
            <Input
              label="菜名"
              placeholder="例如：红烧肉"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className={styles.textareaWrapper}>
              <label className={styles.textareaLabel}>简介</label>
              <textarea
                className={styles.textarea}
                placeholder="简单描述这道菜..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </section>

          {/* 预览图 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>📷 菜品预览图</h3>
            <p className={styles.sectionHint}>最多 5 张，第一张为封面图；没有图片时使用 Emoji 代替</p>
            <ImageUploader images={images} onChange={setImages} />
          </section>

          {/* 分类与标签 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🏷️ 分类与标签</h3>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>菜系</label>
              <div className={styles.chipGroup}>
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
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>标签</label>
              <div className={styles.chipGroup}>
                {RECIPE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.chip} ${selectedTags.has(tag) ? styles.chipActive : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 难度与时间 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>⚙️ 详情</h3>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>难度</label>
              <div className={styles.difficultyGroup}>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`${styles.difficultyBtn} ${difficulty === d ? styles[`diff-${d}`] : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === 'easy' ? '😊 简单' : d === 'medium' ? '💪 中等' : '🔥 困难'}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.numberField}>
                <label>🍽️ 份量</label>
                <div className={styles.stepper}>
                  <button type="button" onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
                  <span>{servings}人份</span>
                  <button type="button" onClick={() => setServings(servings + 1)}>+</button>
                </div>
              </div>
              <div className={styles.numberField}>
                <label>🧱 准备</label>
                <div className={styles.stepper}>
                  <button type="button" onClick={() => setPrepTime(Math.max(0, prepTime - 5))}>−</button>
                  <span>{prepTime}分钟</span>
                  <button type="button" onClick={() => setPrepTime(prepTime + 5)}>+</button>
                </div>
              </div>
              <div className={styles.numberField}>
                <label>⏱️ 烹饪</label>
                <div className={styles.stepper}>
                  <button type="button" onClick={() => setCookTime(Math.max(0, cookTime - 5))}>−</button>
                  <span>{cookTime}分钟</span>
                  <button type="button" onClick={() => setCookTime(cookTime + 5)}>+</button>
                </div>
              </div>
            </div>
          </section>

          {/* 食材 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🥕 食材</h3>
            {ingredients.map((ing, index) => (
              <div key={index} className={styles.ingredientRow}>
                <input
                  className={styles.ingredientInput}
                  placeholder="食材名"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                />
                <input
                  className={styles.amountInput}
                  placeholder="用量"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeIngredient(index)}
                  disabled={ingredients.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addIngredient}>
              + 添加食材
            </Button>
          </section>

          {/* 厨具 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🍳 厨具</h3>
            {utensils.map((utensil, index) => (
              <div key={index} className={styles.utensilRow}>
                <input
                  className={styles.utensilInput}
                  placeholder="例如：炒锅"
                  value={utensil}
                  onChange={(e) => updateUtensil(index, e.target.value)}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeUtensil(index)}
                  disabled={utensils.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addUtensil}>
              + 添加厨具
            </Button>
          </section>

          {/* 烹饪步骤 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>📖 烹饪步骤</h3>
            {steps.map((step, index) => (
              <div key={index} className={styles.stepRow}>
                <div className={styles.stepNumber}>{step.order}</div>
                <textarea
                  className={styles.stepInput}
                  placeholder={`步骤 ${step.order} 的操作说明...`}
                  value={step.description}
                  onChange={(e) => updateStep(index, e.target.value)}
                  rows={2}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeStep(index)}
                  disabled={steps.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addStep}>
              + 添加步骤
            </Button>
          </section>

          {/* 提交按钮 */}
          <div className={styles.submitArea}>
            <Button type="submit" fullWidth size="lg" loading={saving}>
              🌟 保存菜谱
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
