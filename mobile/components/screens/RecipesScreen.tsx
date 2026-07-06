import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions
} from 'react-native';
import { theme } from '../../theme';
import { Card, Badge, Button } from '../ui';
import { apiFetch } from '../../lib/api';
import { Recipe, RECIPE_CATEGORIES } from '../../lib/types';
import { DEMO_RECIPES } from '../../lib/mockData';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - theme.spacing[4] * 3) / 2;

const DIFFICULTY_MAP = {
  easy: { label: '简单', color: 'success' as const },
  medium: { label: '中等', color: 'warning' as const },
  hard: { label: '困难', color: 'danger' as const },
};

interface RecipesScreenProps {
  onSelectRecipe: (id: string) => void;
  onAddRecipe: () => void;
}

export function RecipesScreen({ onSelectRecipe, onAddRecipe }: RecipesScreenProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  // Fetch recipes from Next.js server
  useEffect(() => {
    setLoading(true);
    apiFetch('/api/recipes')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setRecipes(data);
        } else {
          throw new Error('Server returned error status');
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch recipes from server, falling back to offline demo data:', err);
        // Fallback to local demo data mapped to the full Recipe structure
        const mockRecipes: Recipe[] = DEMO_RECIPES.map(r => ({
          ...r,
          images: [],
          tags: [],
          servings: 2,
          prepTime: 10,
          ingredients: [],
          utensils: [],
          steps: [],
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setRecipes(mockRecipes);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categories = ['全部', ...RECIPE_CATEGORIES];

  const filteredRecipes = recipes.filter((r) => {
    const matchesCategory = activeCategory === '全部' || r.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      r.name.includes(searchQuery) ||
      (r.description && r.description.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const renderRecipeItem = ({ item, index }: { item: Recipe; index: number }) => {
    const diffInfo = DIFFICULTY_MAP[item.difficulty] || DIFFICULTY_MAP.easy;
    const hasImage = item.images && item.images.length > 0;

    return (
      <TouchableOpacity
        style={styles.recipeCardContainer}
        onPress={() => onSelectRecipe(item.id)}
        activeOpacity={0.85}
      >
        <Card padding="none" style={styles.recipeCard}>
          {/* Header Image or Emoji Cover */}
          <View style={styles.cardCover}>
            {hasImage ? (
              <Image source={{ uri: item.images[0] }} style={styles.cardCoverImg} />
            ) : (
              <View style={styles.cardCoverFallback}>
                <Text style={styles.cardCoverEmoji}>{item.icon || '🍳'}</Text>
              </View>
            )}
            <View style={styles.categoryBadgeContainer}>
              <Badge variant="primary" size="sm">{item.category}</Badge>
            </View>
          </View>

          {/* Info Details */}
          <View style={styles.cardContent}>
            <Text style={styles.recipeName} numberOfLines={1}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.recipeDesc} numberOfLines={2}>{item.description}</Text>
            ) : (
              <Text style={styles.recipeDescEmpty}>暂无描述</Text>
            )}
            
            <View style={styles.recipeMetaRow}>
              <Badge variant={diffInfo.color} size="sm">{diffInfo.label}</Badge>
              <Text style={styles.recipeTime}>⏱️ {item.cookTime}分</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索您的美味菜谱..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Scroll Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isActive ? styles.categoryChipActive : null]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryLabel, isActive ? styles.categoryLabelActive : null]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Grid View */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>正在为您准备菜谱库...</Text>
        </View>
      ) : filteredRecipes.length > 0 ? (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>没有找到相关菜谱</Text>
          <Text style={styles.emptyText}>换个关键词或者在下方新建一个吧！</Text>
        </View>
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onAddRecipe}
        activeOpacity={0.9}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  searchHeader: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[2],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing[3],
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: theme.spacing[2],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: theme.spacing[1],
  },
  clearSearchText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
  },
  categoryContainer: {
    marginBottom: theme.spacing[2],
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  categoryChip: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    marginRight: theme.spacing[2],
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: 'transparent',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
    marginTop: 60,
  },
  loadingText: {
    marginTop: theme.spacing[3],
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  gridList: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: 100, // Room for sticky nav
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  recipeCardContainer: {
    width: COLUMN_WIDTH,
    marginBottom: theme.spacing[3],
  },
  recipeCard: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  cardCover: {
    height: 100,
    width: '100%',
    backgroundColor: theme.colors.primary[50],
    position: 'relative',
  },
  cardCoverImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardCoverFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCoverEmoji: {
    fontSize: 40,
  },
  categoryBadgeContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  cardContent: {
    flex: 1,
    padding: theme.spacing[2],
    justifyContent: 'space-between',
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  recipeDesc: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 14,
    marginTop: 2,
  },
  recipeDescEmpty: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: 4,
  },
  recipeTime: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: theme.spacing[4],
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },
});
