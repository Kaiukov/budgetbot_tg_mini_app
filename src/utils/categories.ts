import { ShoppingBag, Coffee, Car, Home, Heart, MoreHorizontal, Utensils, Building2, Gamepad2, GraduationCap, Gift, type LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Extract emoji from category name
 * Examples: "Їжа 🍜" → "🍜", "Food" → null
 */
export const extractEmoji = (categoryName: string): string | null => {
  // Regex to match emoji characters
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const matches = categoryName.match(emojiRegex);
  return matches ? matches[0] : null;
};

/**
 * Get category name without emoji
 * Examples: "Їжа 🍜" → "Їжа", "Food" → "Food"
 */
export const getCategoryNameWithoutEmoji = (categoryName: string): string => {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  return categoryName.replace(emojiRegex, '').trim();
};

export const categories: Category[] = [
  { id: 'food', name: 'Food', icon: ShoppingBag, color: '#EF4444' },
  { id: 'cafe', name: 'Cafe', icon: Coffee, color: '#F59E0B' },
  { id: 'transport', name: 'Transport', icon: Car, color: '#3B82F6' },
  { id: 'home', name: 'Home', icon: Home, color: '#10B981' },
  { id: 'health', name: 'Health', icon: Heart, color: '#EC4899' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: '#6B7280' }
];

/**
 * Get icon component based on category name
 */
export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const name = categoryName.toLowerCase();
  if (name.includes('food') || name.includes('grocery') || name.includes('groceries')) return ShoppingBag;
  if (name.includes('cafe') || name.includes('coffee') || name.includes('restaurant') || name.includes('dining')) return Coffee;
  if (name.includes('transport') || name.includes('taxi') || name.includes('car') || name.includes('bus')) return Car;
  if (name.includes('home') || name.includes('house') || name.includes('rent') || name.includes('utilities')) return Home;
  if (name.includes('health') || name.includes('medical') || name.includes('doctor') || name.includes('medicine')) return Heart;
  if (name.includes('entertainment') || name.includes('fun') || name.includes('game')) return Gamepad2;
  if (name.includes('education') || name.includes('school') || name.includes('course')) return GraduationCap;
  if (name.includes('gift') || name.includes('present')) return Gift;
  if (name.includes('office') || name.includes('work') || name.includes('business')) return Building2;
  if (name.includes('restaurant') || name.includes('eat')) return Utensils;
  return MoreHorizontal;
};

/**
 * Get color based on category name
 */
export const getCategoryColor = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('food') || name.includes('grocery')) return '#EF4444';
  if (name.includes('cafe') || name.includes('coffee') || name.includes('restaurant')) return '#F59E0B';
  if (name.includes('transport') || name.includes('taxi') || name.includes('car')) return '#3B82F6';
  if (name.includes('home') || name.includes('house') || name.includes('rent')) return '#10B981';
  if (name.includes('health') || name.includes('medical')) return '#EC4899';
  if (name.includes('entertainment') || name.includes('fun')) return '#8B5CF6';
  if (name.includes('education') || name.includes('school')) return '#6366F1';
  if (name.includes('gift')) return '#F472B6';
  if (name.includes('office') || name.includes('work')) return '#64748B';
  return '#6B7280';
};

export const suggestedComments: string[] = [
  'Groceries at store',
  'Lunch',
  'Taxi',
  'Utilities',
  'Medicine'
];
