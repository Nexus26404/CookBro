import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme';
import { Card, Badge, Button, Input } from '../ui';
import { apiFetch, UserSession } from '../../lib/api';
import { Recipe, Ingredient, CookingStep, Difficulty, RECIPE_CATEGORIES, RECIPE_TAGS } from '../../lib/types';

const PRESET_UTENSILS = [
  '炒锅', '平底锅', '砂锅', '电饭煲', '空气炸锅', '蒸锅', '高压锅', '汤锅', '烤箱', '破壁机'
];

interface RecipeFormScreenProps {
  recipeId?: string; // Optional: If passed, we are in Edit Mode
  onBack: () => void;
  onSaveSuccess: () => void;
  user: UserSession;
}

export function RecipeFormScreen({ recipeId, onBack, onSaveSuccess, user }: RecipeFormScreenProps) {
  const isEditMode = !!recipeId;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(RECIPE_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [servings, setServings] = useState(2);
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(20);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<string[]>([]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '' }]);
  const [utensils, setUtensils] = useState<string[]>(['']);
  const [steps, setSteps] = useState<CookingStep[]>([{ order: 1, description: '', duration: 5 }]);

  // Fetch initial recipe details if in Edit Mode
  useEffect(() => {
    if (!isEditMode || !recipeId) return;

    setLoading(true);
    apiFetch(`/api/recipes/${recipeId}`)
      .then(async (res) => {
        if (res.ok) {
          const data: Recipe = await res.json();
          setName(data.name);
          setDescription(data.description || '');
          setCategory(data.category);
          setDifficulty(data.difficulty);
          setServings(data.servings || 2);
          setPrepTime(data.prepTime || 10);
          setCookTime(data.cookTime || 20);
          setSelectedTags(new Set(data.tags || []));
          setImages(data.images || []);
          
          setIngredients(data.ingredients && data.ingredients.length > 0 ? data.ingredients : [{ name: '', amount: '' }]);
          setUtensils(data.utensils && data.utensils.length > 0 ? data.utensils : ['']);
          setSteps(data.steps && data.steps.length > 0 ? data.steps : [{ order: 1, description: '', duration: 5 }]);
        } else {
          throw new Error('Failed to fetch recipe for editing');
        }
      })
      .catch((err) => {
        console.error(err);
        Alert.alert('错误', '加载编辑数据失败，请返回重试');
        onBack();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recipeId, isEditMode]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  // Image Picker & Crop Handler
  const handlePickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('提示', '最多只能上传 5 张预览图');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限请求', '抱歉，我们需要相机胶卷权限来选取图片！');
      return;
    }

    // Opens OS native image selection and crop interface directly!
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.65,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const base64Uri = `data:${mimeType};base64,${result.assets[0].base64}`;
      setImages((prev) => [...prev, base64Uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Dynamic list modifiers for Ingredients
  const addIngredient = () => setIngredients((prev) => [...prev, { name: '', amount: '' }]);
  
  const updateIngredient = (index: number, field: keyof Ingredient, val: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic list modifiers for Utensils
  const addUtensil = (presetValue = '') => setUtensils((prev) => [...prev, presetValue]);

  const updateUtensil = (index: number, val: string) => {
    setUtensils((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const removeUtensil = (index: number) => {
    if (utensils.length <= 1) return;
    setUtensils((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic list modifiers for Steps
  const addStep = () => {
    setSteps((prev) => [...prev, { order: prev.length + 1, description: '', duration: 5 }]);
  };

  const updateStep = (index: number, field: keyof CookingStep, val: any) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-map step order index numbers
      return filtered.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入菜谱名称');
      return false;
    }
    const hasIngredients = ingredients.some(i => i.name.trim());
    if (!hasIngredients) {
      Alert.alert('提示', '请至少填写一种食材名称');
      return false;
    }
    const hasSteps = steps.some(s => s.description.trim());
    if (!hasSteps) {
      Alert.alert('提示', '请至少填写一个烹饪步骤说明');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      const payload = {
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

      const url = isEditMode ? `/api/recipes/${recipeId}` : '/api/recipes';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Server returned error status');
      }

      Alert.alert('成功', isEditMode ? '菜谱更新成功！' : '菜谱创建成功！');
      onSaveSuccess();
    } catch (err) {
      console.error(err);
      Alert.alert('保存失败', '网络请求失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={styles.loadingText}>正在为您加载菜谱编辑页...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEditMode ? '编辑菜谱' : '创建新菜谱'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerSaveBtn}>
          <Text style={styles.headerSaveText}>{saving ? '保存中' : '保存'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📝 基本信息</Text>
          <Card padding="md" style={styles.card}>
            <Input
              label="菜谱名称"
              placeholder="例如：红烧肉"
              value={name}
              onChangeText={setName}
            />
            
            <View style={styles.textareaContainer}>
              <Text style={styles.textareaLabel}>简介（选填）</Text>
              <TextInput
                style={styles.textarea}
                placeholder="简单描述这道菜的亮点与风味特色..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </Card>
        </View>

        {/* Cover Photos */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📷 菜品预览图</Text>
          <Text style={styles.sectionSubtitle}>第一张将作为菜谱封面图，可拖动顺序，最多5张</Text>
          <Card padding="md" style={styles.card}>
            {images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
                {images.map((src, idx) => (
                  <View key={idx} style={styles.thumbContainer}>
                    <Image source={{ uri: src }} style={styles.thumbImg} />
                    {idx === 0 && (
                      <View style={styles.thumbCoverBadge}>
                        <Text style={styles.thumbCoverText}>封面</Text>
                      </View>
                    )}
                    
                    {/* Re-order & Delete Handles */}
                    <View style={styles.thumbActionsRow}>
                      {idx > 0 && (
                        <TouchableOpacity style={styles.thumbActionBtn} onPress={() => handleMoveImage(idx, 'left')}>
                          <Text style={styles.thumbActionText}>←</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.thumbActionBtn, styles.thumbDeleteBtn]} onPress={() => handleRemoveImage(idx)}>
                        <Text style={styles.thumbDeleteText}>✕</Text>
                      </TouchableOpacity>
                      {idx < images.length - 1 && (
                        <TouchableOpacity style={styles.thumbActionBtn} onPress={() => handleMoveImage(idx, 'right')}>
                          <Text style={styles.thumbActionText}>→</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                
                {images.length < 5 && (
                  <TouchableOpacity style={styles.addThumbBtn} onPress={handlePickImage}>
                    <Text style={styles.addThumbIcon}>＋</Text>
                    <Text style={styles.addThumbLabel}>加图</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              <TouchableOpacity style={styles.uploadPlaceholderBtn} onPress={handlePickImage}>
                <Text style={styles.placeholderCameraIcon}>📷</Text>
                <Text style={styles.placeholderCameraText}>上传实物预览图</Text>
                <Text style={styles.placeholderCameraHint}>支持裁剪，无图时将自动以 Emoji 代替</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Category Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🏷️ 菜系分类</Text>
          <Card padding="md" style={styles.card}>
            <View style={styles.chipsWrap}>
              {RECIPE_CATEGORIES.map((cat) => {
                const isActive = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isActive ? styles.chipActive : null]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Tags Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🏷️ 菜谱标签 (可多选)</Text>
          <Card padding="md" style={styles.card}>
            <View style={styles.chipsWrap}>
              {RECIPE_TAGS.map((tag) => {
                const isActive = selectedTags.has(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.chip, isActive ? styles.chipActive : null]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Difficulty, PrepTime, CookTime */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>⚙️ 详情属性</Text>
          <Card padding="md" style={styles.card}>
            {/* Difficulty Selector */}
            <Text style={styles.fieldLabel}>上手难度</Text>
            <View style={styles.difficultyContainer}>
              <TouchableOpacity
                style={[styles.diffBtn, difficulty === 'easy' ? styles.diffBtnEasyActive : null]}
                onPress={() => setDifficulty('easy')}
              >
                <Text style={[styles.diffBtnText, difficulty === 'easy' ? styles.diffBtnTextActive : null]}>
                  😊 简单
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.diffBtn, difficulty === 'medium' ? styles.diffBtnMediumActive : null]}
                onPress={() => setDifficulty('medium')}
              >
                <Text style={[styles.diffBtnText, difficulty === 'medium' ? styles.diffBtnTextActive : null]}>
                  💪 中等
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.diffBtn, difficulty === 'hard' ? styles.diffBtnHardActive : null]}
                onPress={() => setDifficulty('hard')}
              >
                <Text style={[styles.diffBtnText, difficulty === 'hard' ? styles.diffBtnTextActive : null]}>
                  🔥 困难
                </Text>
              </TouchableOpacity>
            </View>

            {/* Steppers adjusters */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperCol}>
                <Text style={styles.fieldLabel}>🍽️ 份量</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setServings(s => Math.max(1, s - 1))}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepValText}>{servings}人份</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setServings(s => s + 1)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.stepperCol}>
                <Text style={styles.fieldLabel}>⏱️ 准备时间</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setPrepTime(p => Math.max(5, p - 5))}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepValText}>{prepTime}分钟</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setPrepTime(p => p + 5)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.stepperRow, { marginTop: theme.spacing[3] }]}>
              <View style={styles.stepperCol}>
                <Text style={styles.fieldLabel}>⏱️ 烹饪时间</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setCookTime(c => Math.max(5, c - 5))}>
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepValText}>{cookTime}分钟</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setCookTime(c => c + 5)}>
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Ingredients List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🥕 烹饪食材</Text>
          {ingredients.map((ing, idx) => (
            <Card key={idx} padding="sm" style={styles.listRowCard}>
              <TextInput
                style={[styles.rowInput, { flex: 2 }]}
                placeholder="食材名称，例如：猪五花"
                placeholderTextColor={theme.colors.text.tertiary}
                value={ing.name}
                onChangeText={(val) => updateIngredient(idx, 'name', val)}
              />
              <TextInput
                style={[styles.rowInput, { flex: 1, marginLeft: 10 }]}
                placeholder="份量：400克"
                placeholderTextColor={theme.colors.text.tertiary}
                value={ing.amount}
                onChangeText={(val) => updateIngredient(idx, 'amount', val)}
              />
              <TouchableOpacity
                onPress={() => removeIngredient(idx)}
                disabled={ingredients.length <= 1}
                style={[styles.rowRemoveBtn, ingredients.length <= 1 ? styles.rowRemoveBtnDisabled : null]}
              >
                <Text style={styles.rowRemoveText}>✕</Text>
              </TouchableOpacity>
            </Card>
          ))}
          <Button variant="secondary" size="sm" onPress={addIngredient} style={styles.listAddBtn}>
            ＋ 添加食材行
          </Button>
        </View>

        {/* Utensils List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🍳 常用厨具</Text>
          {/* Presets suggestions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
            {PRESET_UTENSILS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={styles.presetChip}
                onPress={() => {
                  // Find an empty row to fill, or append a new one
                  const emptyIdx = utensils.findIndex(u => !u.trim());
                  if (emptyIdx !== -1) {
                    updateUtensil(emptyIdx, preset);
                  } else {
                    addUtensil(preset);
                  }
                }}
              >
                <Text style={styles.presetChipText}>＋ {preset}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {utensils.map((utensil, idx) => (
            <Card key={idx} padding="sm" style={styles.listRowCard}>
              <TextInput
                style={[styles.rowInput, { flex: 1 }]}
                placeholder="输入厨具名称，例如：炒锅"
                placeholderTextColor={theme.colors.text.tertiary}
                value={utensil}
                onChangeText={(val) => updateUtensil(idx, val)}
              />
              <TouchableOpacity
                onPress={() => removeUtensil(idx)}
                disabled={utensils.length <= 1}
                style={[styles.rowRemoveBtn, utensils.length <= 1 ? styles.rowRemoveBtnDisabled : null]}
              >
                <Text style={styles.rowRemoveText}>✕</Text>
              </TouchableOpacity>
            </Card>
          ))}
          <Button variant="secondary" size="sm" onPress={() => addUtensil()} style={styles.listAddBtn}>
            ＋ 添加自定厨具行
          </Button>
        </View>

        {/* Steps List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📖 制作步骤</Text>
          {steps.map((step, idx) => (
            <Card key={idx} padding="md" style={styles.stepRowCard}>
              <View style={styles.stepRowHeader}>
                <View style={styles.stepNumIcon}>
                  <Text style={styles.stepNumIconText}>{step.order}</Text>
                </View>
                
                <TextInput
                  style={[styles.rowInput, { flex: 1, minHeight: 32 }]}
                  placeholder="估算本步骤倒计时，如：10 分钟（选填）"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="numeric"
                  value={step.duration ? step.duration.toString() : ''}
                  onChangeText={(val) => {
                    const parsed = parseInt(val, 10);
                    updateStep(idx, 'duration', isNaN(parsed) ? undefined : parsed);
                  }}
                />
                
                <TouchableOpacity
                  onPress={() => removeStep(idx)}
                  disabled={steps.length <= 1}
                  style={[styles.rowRemoveBtn, steps.length <= 1 ? styles.rowRemoveBtnDisabled : null]}
                >
                  <Text style={styles.rowRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.stepDescriptionInput}
                placeholder={`请输入步骤 ${step.order} 的制作说明...`}
                placeholderTextColor={theme.colors.text.tertiary}
                value={step.description}
                onChangeText={(val) => updateStep(idx, 'description', val)}
                multiline
                textAlignVertical="top"
              />
            </Card>
          ))}
          <Button variant="secondary" size="sm" onPress={addStep} style={styles.listAddBtn}>
            ＋ 添加步骤行
          </Button>
        </View>

        {/* Submit Save Button */}
        <View style={styles.submitContainer}>
          <Button variant="primary" fullWidth size="lg" loading={saving} onPress={handleSave}>
            🌟 {isEditMode ? '保存修改' : '创建并发布菜谱'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255, 251, 245, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerBackBtn: {
    padding: theme.spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 22,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing[4],
  },
  headerSaveBtn: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
  },
  headerSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
    backgroundColor: theme.colors.bg.primary,
  },
  loadingText: {
    marginTop: theme.spacing[3],
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  scrollContainer: {
    paddingBottom: 60,
  },
  sectionContainer: {
    paddingHorizontal: theme.spacing[4],
    marginTop: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
    paddingLeft: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing[2],
    paddingLeft: 2,
  },
  card: {
    width: '100%',
  },
  textareaContainer: {
    marginTop: theme.spacing[4],
  },
  textareaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 6,
    paddingLeft: 2,
  },
  textarea: {
    width: '100%',
    height: 70,
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[3],
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  thumbScroll: {
    flexDirection: 'row',
  },
  thumbContainer: {
    width: 90,
    height: 90,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginRight: theme.spacing[3],
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbCoverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  thumbCoverText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  thumbActionsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 24,
  },
  thumbActionBtn: {
    padding: 2,
  },
  thumbActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  thumbDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDeleteText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  addThumbBtn: {
    width: 90,
    height: 90,
    borderRadius: theme.radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.primary,
  },
  addThumbIcon: {
    fontSize: 24,
    color: theme.colors.text.tertiary,
    fontWeight: 'bold',
  },
  addThumbLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
    marginTop: 2,
  },
  uploadPlaceholderBtn: {
    width: '100%',
    height: 100,
    borderRadius: theme.radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.primary,
    padding: theme.spacing[3],
  },
  placeholderCameraIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  placeholderCameraText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  placeholderCameraHint: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
  },
  chipActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 6,
    paddingLeft: 2,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  diffBtn: {
    flex: 1,
    height: 38,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffBtnEasyActive: {
    borderColor: 'transparent',
    backgroundColor: theme.colors.success.light,
  },
  diffBtnMediumActive: {
    borderColor: 'transparent',
    backgroundColor: theme.colors.warning.light,
  },
  diffBtnHardActive: {
    borderColor: 'transparent',
    backgroundColor: theme.colors.danger.light,
  },
  diffBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  diffBtnTextActive: {
    color: theme.colors.text.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[4],
  },
  stepperCol: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    height: 40,
  },
  stepBtn: {
    width: 36,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  stepValText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  listRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
    height: 52,
  },
  rowInput: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    paddingVertical: 4,
  },
  rowRemoveBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  rowRemoveBtnDisabled: {
    opacity: 0.3,
  },
  rowRemoveText: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  listAddBtn: {
    marginTop: theme.spacing[1],
    marginBottom: theme.spacing[3],
  },
  presetScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
    marginBottom: theme.spacing[2],
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary[50],
    marginRight: theme.spacing[2],
  },
  presetChipText: {
    fontSize: 11,
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  stepRowCard: {
    marginBottom: theme.spacing[3],
  },
  stepRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingBottom: 8,
    marginBottom: 8,
  },
  stepNumIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumIconText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepDescriptionInput: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
    minHeight: 60,
    lineHeight: 18,
  },
  submitContainer: {
    paddingHorizontal: theme.spacing[4],
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[4],
  },
});
