import { ShoppingBag, Coffee, Car, Home, Heart, MoreHorizontal, Utensils, Building2, Gamepad2, GraduationCap, Gift, type LucideIcon } from 'lucide-react';
import { categoryColors, getCategoryColorValue } from '../theme/dark/categories';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Extract emoji from category name
 * Handles multi-character emojis with skin tone modifiers
 * Examples: "Їжа 🍜" → "🍜", "Краса 💅🏻" → "💅🏻", "Food" → null
 */
export const extractEmoji = (categoryName: string): string | null => {
  // Regex to match emoji with modifiers (skin tones, zero-width joiners, etc.)
  // Matches: emoji base + optional variation selector + optional skin tone modifier + optional ZWJ sequences
  const emojiRegex = /(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Modifier}]*(?:\u200D[\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Modifier}]*)*|\p{Emoji_Component}+)/gu;
  const matches = categoryName.match(emojiRegex);
  return matches ? matches[0] : null;
};

/**
 * Get category name without emoji
 * Removes all emoji including those with modifiers
 * Examples: "Їжа 🍜" → "Їжа", "Краса 💅🏻" → "Краса", "Food" → "Food"
 */
export const getCategoryNameWithoutEmoji = (categoryName: string): string => {
  // Regex to match emoji with modifiers (skin tones, zero-width joiners, etc.)
  const emojiRegex = /(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Modifier}]*(?:\u200D[\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Modifier}]*)*|\p{Emoji_Component}+)/gu;
  return categoryName.replace(emojiRegex, '').trim();
};

export const categories: Category[] = [
  { id: 'food', name: 'Food', icon: ShoppingBag, color: categoryColors.food },
  { id: 'cafe', name: 'Cafe', icon: Coffee, color: categoryColors.cafe },
  { id: 'transport', name: 'Transport', icon: Car, color: categoryColors.transport },
  { id: 'home', name: 'Home', icon: Home, color: categoryColors.home },
  { id: 'health', name: 'Health', icon: Heart, color: categoryColors.health },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: categoryColors.other }
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
  return getCategoryColorValue(categoryName);
};

export const suggestedComments: string[] = [
  'Groceries at store',
  'Lunch',
  'Taxi',
  'Utilities',
  'Medicine'
];
