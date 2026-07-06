import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { theme } from '../../theme';
import { Card, Badge, Button } from '../ui';
import { apiFetch, UserSession } from '../../lib/api';
import { Recipe } from '../../lib/types';
import { DEMO_RECIPES } from '../../lib/mockData';

const { width } = Dimensions.get('window');

const DIFFICULTY_MAP = {
  easy: { label: '简单', color: 'success' as const },
  medium: { label: '中等', color: 'warning' as const },
  hard: { label: '困难', color: 'danger' as const },
};

interface RecipeDetailsScreenProps {
  recipeId: string;
  onBack: () => void;
  onEditRecipe: (id: string) => void;
  user: UserSession;
}

export function RecipeDetailsScreen({ recipeId, onBack, onEditRecipe, user }: RecipeDetailsScreenProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Servings count state (adjuster)
  const [servings, setServings] = useState(2);

  // Checklists states (checked ingredient / utensil indices and step indices)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedUtensils, setCheckedUtensils] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!recipeId) return;
    setLoading(true);
    
    apiFetch(`/api/recipes/${recipeId}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setRecipe(data);
          setServings(data.servings || 2);
          setError('');
        } else {
          throw new Error('Recipe not found');
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch recipe details, falling back to mock details:', err);
        // Find matching recipe in mockData
        const found = DEMO_RECIPES.find(r => r.id === recipeId);
        if (found) {
          const mockDetail: Recipe = {
            ...found,
            images: [],
            tags: [],
            servings: 2,
            prepTime: 10,
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ingredients: [
              { name: '主料', amount: '200克' },
              { name: '配料', amount: '100克' },
              { name: '食用油', amount: '10毫升' },
              { name: '食盐', amount: '适量' },
            ],
            utensils: ['炒锅', '铲子', '砧板', '菜刀'],
            steps: [
              { order: 1, description: '将所有食材洗干净切好备用。', duration: 3 },
              { order: 2, description: '热锅下油，倒入主食材大火翻炒。', duration: 5 },
              { order: 3, description: '加入配料和适量调味料，中火焖制入味。', duration: 8 },
              { order: 4, description: '大火收汁，即可出锅装盘。', duration: 1 },
            ]
          };
          setRecipe(mockDetail);
          setServings(mockDetail.servings || 2);
          setError('');
        } else {
          setError('菜谱加载失败，请返回重试');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recipeId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={styles.loadingText}>正在为您加载美味秘籍...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error || '菜谱未找到'}</Text>
        <Button variant="primary" onPress={onBack} style={styles.errorBtn}>
          返回菜谱列表
        </Button>
      </View>
    );
  }

  const isOwner = recipe.createdBy === user.uid || recipe.createdBy === 'system';
  const diffInfo = DIFFICULTY_MAP[recipe.difficulty] || DIFFICULTY_MAP.easy;

  const handleAdjustServings = (change: number) => {
    setServings(prev => {
      const next = prev + change;
      return next < 1 ? 1 : next;
    });
  };

  // Helper to scale ingredients amounts based on servings adjuster
  const getScaledAmount = (amountStr: string) => {
    if (!amountStr) return '';
    
    // Regular expression to match leading numbers (integers or floats/fractions)
    // Matches: 200, 2.5, 1/2
    const numRegex = /^(\d+(\.\d+)?|\d+\/\d+)/;
    const match = amountStr.trim().match(numRegex);
    
    if (!match) return amountStr; // E.g. "适量", "少许" -> keep string intact

    const numStr = match[0];
    const restStr = amountStr.slice(numStr.length);
    const originalServings = recipe.servings || 2;
    
    let parsedNum = 0;
    if (numStr.includes('/')) {
      const parts = numStr.split('/');
      parsedNum = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else {
      parsedNum = parseFloat(numStr);
    }
    
    const scaledNum = (parsedNum * servings) / originalServings;
    
    // Format float numbers nicely to at most 2 decimal places
    let formattedNum = scaledNum % 1 === 0 ? scaledNum.toString() : scaledNum.toFixed(1);
    if (formattedNum.endsWith('.0')) {
      formattedNum = formattedNum.slice(0, -2);
    }
    
    return `${formattedNum}${restStr}`;
  };

  const toggleCheckIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleCheckUtensil = (index: number) => {
    setCheckedUtensils(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleCheckStep = (index: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleDelete = () => {
    Alert.alert(
      '删除菜谱',
      '确定要删除这道菜谱吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定删除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await apiFetch(`/api/recipes/${recipeId}`, {
                method: 'DELETE'
              });
              if (!res.ok) throw new Error('Delete failed');
              Alert.alert('提示', '菜谱已成功删除');
              onBack();
            } catch (err) {
              console.error(err);
              Alert.alert('删除失败', '网络请求失败，请稍后重试');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const hasImages = recipe.images && recipe.images.length > 0;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.name}
        </Text>
        <View style={styles.headerRightActions}>
          {isOwner && (
            <>
              <TouchableOpacity onPress={() => onEditRecipe(recipe.id)} style={styles.actionLink}>
                <Text style={styles.actionLinkText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} disabled={deleting} style={styles.actionLink}>
                <Text style={styles.deleteLinkText}>{deleting ? '...' : '删除'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery or Cover Icon */}
        {hasImages ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
          >
            {recipe.images.map((img, index) => (
              <View key={index} style={styles.gallerySlide}>
                <Image source={{ uri: img }} style={styles.galleryImg} />
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>封面</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noImageCover}>
            <Text style={styles.noImageEmoji}>{recipe.icon || '🍳'}</Text>
          </View>
        )}

        {/* Title Area */}
        <View style={styles.titleCard}>
          <View style={styles.titleHeader}>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <View style={styles.badgesRow}>
              <Badge variant="primary" size="sm">{recipe.category}</Badge>
              <Badge variant={diffInfo.color} size="sm">{diffInfo.label}</Badge>
            </View>
          </View>
          {recipe.description ? (
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
          ) : null}
        </View>

        {/* Prep Time, Cook Time, Serving Specs */}
        <View style={styles.specsRow}>
          <Card padding="sm" style={styles.specCard}>
            <Text style={styles.specValue}>{recipe.prepTime || 5}分钟</Text>
            <Text style={styles.specLabel}>准备</Text>
          </Card>
          
          <Card padding="sm" style={styles.specCard}>
            <Text style={styles.specValue}>{recipe.cookTime}分钟</Text>
            <Text style={styles.specLabel}>烹饪</Text>
          </Card>

          <Card padding="sm" style={styles.specCard}>
            <Text style={styles.specValue}>{recipe.servings}人份</Text>
            <Text style={styles.specLabel}>初始</Text>
          </Card>
        </View>

        {/* Dynamic Servings Adjuster */}
        <Card padding="md" style={styles.adjusterCard}>
          <Text style={styles.adjusterTitle}>🍽️ 烹饪分量调节器</Text>
          <View style={styles.adjusterControls}>
            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => handleAdjustServings(-1)}
            >
              <Text style={styles.adjusterBtnText}>－</Text>
            </TouchableOpacity>
            
            <View style={styles.adjustValueContainer}>
              <Text style={styles.adjustValueText}>{servings}</Text>
              <Text style={styles.adjustValueLabel}>人份</Text>
            </View>

            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => handleAdjustServings(1)}
            >
              <Text style={styles.adjusterBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.adjusterHelper}>* 调节人份后，下方用料分量将为您自动换算比例</Text>
        </Card>

        {/* Utensils Checklist */}
        {recipe.utensils && recipe.utensils.length > 0 ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>需要的厨具</Text>
            <Card padding="none" style={styles.checklistCard}>
              {recipe.utensils.map((utensil, index) => {
                const isChecked = checkedUtensils.has(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.checkrow, index === recipe.utensils.length - 1 ? styles.lastRow : null]}
                    onPress={() => toggleCheckUtensil(index)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isChecked ? styles.checkboxChecked : null]}>
                      {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={[styles.checklistLabel, isChecked ? styles.checklistLabelChecked : null]}>
                      🍳 {utensil}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ) : null}

        {/* Ingredients Checklist */}
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>用料</Text>
            <Card padding="none" style={styles.checklistCard}>
              {recipe.ingredients.map((ing, index) => {
                const isChecked = checkedIngredients.has(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.checkrow, index === recipe.ingredients.length - 1 ? styles.lastRow : null]}
                    onPress={() => toggleCheckIngredient(index)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isChecked ? styles.checkboxChecked : null]}>
                      {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>
                    <Text style={[styles.checklistLabel, isChecked ? styles.checklistLabelChecked : null]}>
                      {ing.name}
                    </Text>
                    <Text style={[styles.ingredientAmount, isChecked ? styles.checklistLabelChecked : null]}>
                      {getScaledAmount(ing.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ) : null}

        {/* Steps Checklist */}
        {recipe.steps && recipe.steps.length > 0 ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>步骤步骤</Text>
            {recipe.steps.map((step, index) => {
              const isChecked = checkedSteps.has(index);
              return (
                <Card
                  key={index}
                  padding="md"
                  style={[
                    styles.stepCard,
                    isChecked ? styles.stepCardChecked : null
                  ]}
                >
                  <TouchableOpacity
                    style={styles.stepContent}
                    onPress={() => toggleCheckStep(index)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.stepNumContainer, isChecked ? styles.stepNumChecked : null]}>
                      <Text style={[styles.stepNumText, isChecked ? styles.stepNumTextChecked : null]}>
                        {index + 1}
                      </Text>
                    </View>
                    
                    <View style={styles.stepTextContainer}>
                      <Text style={[styles.stepDescText, isChecked ? styles.stepDescTextChecked : null]}>
                        {step.description}
                      </Text>
                      {step.duration ? (
                        <Text style={[styles.stepTimerText, isChecked ? styles.stepTimerTextChecked : null]}>
                          ⏱️ 计时: {step.duration}分钟
                        </Text>
                      ) : null}
                    </View>
                    
                    <View style={[styles.stepCheckCircle, isChecked ? styles.stepCheckCircleChecked : null]}>
                      {isChecked && <Text style={styles.stepCheckCheck}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </View>
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
    ...Platform.select({
      ios: {
        shadowColor: '#1c1917',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      }
    })
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLink: {
    marginLeft: theme.spacing[3],
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionLinkText: {
    color: theme.colors.primary[600],
    fontSize: 13,
    fontWeight: '600',
  },
  deleteLinkText: {
    color: theme.colors.danger.dark,
    fontSize: 13,
    fontWeight: '600',
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
  errorText: {
    fontSize: 14,
    color: theme.colors.danger.dark,
    fontWeight: '600',
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  errorBtn: {
    width: 160,
  },
  scrollContainer: {
    paddingBottom: 60,
  },
  gallery: {
    height: 220,
    width: '100%',
    backgroundColor: theme.colors.neutral[100],
  },
  gallerySlide: {
    width: width,
    height: 220,
    position: 'relative',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverBadge: {
    position: 'absolute',
    bottom: theme.spacing[3],
    left: theme.spacing[4],
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
  },
  coverBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noImageCover: {
    height: 180,
    width: '100%',
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageEmoji: {
    fontSize: 72,
  },
  titleCard: {
    backgroundColor: theme.colors.bg.card,
    padding: theme.spacing[4],
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border.light,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  recipeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing[4],
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  recipeDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginTop: 4,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    gap: theme.spacing[3],
  },
  specCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  specLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
  },
  adjusterCard: {
    marginHorizontal: theme.spacing[4],
    marginTop: theme.spacing[4],
    alignItems: 'center',
  },
  adjusterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  adjusterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[6],
  },
  adjusterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjusterBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  adjustValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  adjustValueText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary[500],
  },
  adjustValueLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  adjusterHelper: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[3],
    fontStyle: 'italic',
  },
  sectionContainer: {
    paddingHorizontal: theme.spacing[4],
    marginTop: theme.spacing[5],
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
    paddingLeft: 2,
  },
  checklistCard: {
    width: '100%',
    overflow: 'hidden',
  },
  checkrow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    marginRight: theme.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[500],
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checklistLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  checklistLabelChecked: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  ingredientAmount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  stepCard: {
    marginBottom: theme.spacing[3],
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
  },
  stepCardChecked: {
    borderColor: 'transparent',
    backgroundColor: theme.colors.neutral[50],
    opacity: 0.75,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  stepNumChecked: {
    backgroundColor: theme.colors.border.default,
  },
  stepNumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepNumTextChecked: {
    color: theme.colors.text.tertiary,
  },
  stepTextContainer: {
    flex: 1,
    marginRight: theme.spacing[2],
  },
  stepDescText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    fontWeight: '500',
  },
  stepDescTextChecked: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  stepTimerText: {
    fontSize: 11,
    color: theme.colors.primary[600],
    fontWeight: '600',
    marginTop: 4,
  },
  stepTimerTextChecked: {
    color: theme.colors.text.tertiary,
  },
  stepCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  stepCheckCircleChecked: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  stepCheckCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
