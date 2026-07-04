export interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookTime: number;
  icon: string;
  description?: string;
  orderCount?: number;
}

export const DEMO_RECIPES: Recipe[] = [
  { id: '1', name: '红烧肉', category: '川菜', difficulty: 'medium', cookTime: 60, icon: '🍖', description: '经典美味，肥而不腻，色泽红亮。', orderCount: 24 },
  { id: '2', name: '番茄炒蛋', category: '家常菜', difficulty: 'easy', cookTime: 10, icon: '🍅', description: '酸甜可口，营养丰富，下饭必备。', orderCount: 42 },
  { id: '3', name: '清炒西兰花', category: '家常菜', difficulty: 'easy', cookTime: 8, icon: '🥦', description: '爽口解腻，健康低脂，清脆多汁。', orderCount: 15 },
  { id: '4', name: '糖醋排骨', category: '浙菜', difficulty: 'medium', cookTime: 45, icon: '🍖', description: '酸甜排骨，外酥里嫩，汁浓开胃。', orderCount: 31 },
  { id: '5', name: '麻婆豆腐', category: '川菜', difficulty: 'easy', cookTime: 15, icon: '🧆', description: '麻辣鲜香，烫滑细嫩，风味浓郁。', orderCount: 19 },
  { id: '6', name: '可乐鸡翅', category: '小吃', difficulty: 'medium', cookTime: 30, icon: '🍗', description: '香甜美味，小朋友最爱的经典家常菜。', orderCount: 28 },
];
