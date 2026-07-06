// CookBro Core Types for Mobile App

export interface Ingredient {
  name: string;
  amount: string;
  category?: string;
}

export interface CookingStep {
  order: number;
  description: string;
  image?: string;
  duration?: number;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface Recipe {
  id: string;
  name: string;
  icon?: string;
  images: string[];
  description?: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: Ingredient[];
  utensils: string[];
  steps: CookingStep[];
  createdBy: string;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export const RECIPE_CATEGORIES = [
  "川菜",
  "粤菜",
  "湘菜",
  "江浙菜",
  "东北菜",
  "西北菜",
  "日料",
  "韩餐",
  "西餐",
  "烘焙",
  "甜品",
  "饮品",
  "凉菜",
  "汤羹",
  "主食",
  "小吃",
  "其他",
] as const;

export const RECIPE_TAGS = [
  "快手菜",
  "下饭菜",
  "家常菜",
  "硬菜",
  "减脂餐",
  "早餐",
  "宵夜",
  "宴客菜",
  "儿童餐",
  "懒人餐",
  "一人食",
] as const;

export const INGREDIENT_CATEGORIES = [
  "肉类",
  "海鲜",
  "蔬菜",
  "豆制品",
  "蛋奶",
  "主食",
  "调料",
  "干货",
  "水果",
  "其他",
] as const;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

export interface CookGroup {
  id: string;
  name: string;
  members: string[];
  memberProfiles?: UserProfile[];
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export type MealType = "breakfast" | "lunch" | "dinner";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export type OrderStatus = "ordering" | "confirmed" | "cooking" | "done";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ordering: "点菜中",
  confirmed: "已确认",
  cooking: "烹饪中",
  done: "已完成",
};

export interface Meal {
  type: MealType;
  recipes: string[];
  orderedBy: string;
}

export interface Order {
  id: string;
  groupId: string;
  date: string;
  meals: Meal[];
  status: OrderStatus;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  groupId?: string;
  createdAt: string;
}
