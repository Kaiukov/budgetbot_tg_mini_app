/**
 * Category Theme Configuration
 * Color palette and mappings for transaction categories
 */

import { ShoppingBag, Coffee, Car, Home, Heart, MoreHorizontal, type LucideIcon } from 'lucide-react';

/**
 * Category color palette
 * Each category has a distinct color for visual identification
 */
export const categoryColors = {
  food: '#EF4444',           // Red
  cafe: '#F59E0B',           // Amber
  transport: '#3B82F6',      // Blue
  home: '#10B981',           // Green
  health: '#EC4899',         // Pink
  entertainment: '#8B5CF6',  // Purple
  education: '#6366F1',      // Indigo
  gift: '#F472B6',           // Rose
  office: '#64748B',         // Slate
  other: '#6B7280',          // Gray
} as const;

/**
 * Category color mapping by keyword
 * Used for dynamic color assignment based on category name
 */
export const categoryColorMap: Record<string, string> = {
  'food': '#EF4444',
  'grocery': '#EF4444',
  'cafe': '#F59E0B',
  'coffee': '#F59E0B',
  'restaurant': '#F59E0B',
  'dining': '#F59E0B',
  'transport': '#3B82F6',
  'taxi': '#3B82F6',
  'car': '#3B82F6',
  'bus': '#3B82F6',
  'home': '#10B981',
  'house': '#10B981',
  'rent': '#10B981',
  'utilities': '#10B981',
  'health': '#EC4899',
  'medical': '#EC4899',
  'doctor': '#EC4899',
  'medicine': '#EC4899',
  'entertainment': '#8B5CF6',
  'fun': '#8B5CF6',
  'game': '#8B5CF6',
  'education': '#6366F1',
  'school': '#6366F1',
  'course': '#6366F1',
  'gift': '#F472B6',
  'present': '#F472B6',
  'office': '#64748B',
  'work': '#64748B',
  'business': '#64748B',
  'eat': '#F59E0B',
} as const;

/**
 * Default color for unknown categories
 */
export const defaultCategoryColor = '#6B7280' as const;

/**
 * Category icon mapping
 */
export const categoryIconMap: Record<string, LucideIcon> = {
  'food': ShoppingBag,
  'grocery': ShoppingBag,
  'groceries': ShoppingBag,
  'cafe': Coffee,
  'coffee': Coffee,
  'restaurant': Coffee,
  'dining': Coffee,
  'transport': Car,
  'taxi': Car,
  'car': Car,
  'bus': Car,
  'home': Home,
  'house': Home,
  'rent': Home,
  'utilities': Home,
  'health': Heart,
  'medical': Heart,
  'doctor': Heart,
  'medicine': Heart,
} as const;

/**
 * Default icon for unknown categories
 */
export const defaultCategoryIcon = MoreHorizontal;

/**
 * Color value generator for category names
 * Searches through category name for keywords and returns matching color
 * Falls back to default gray if no match found
 */
export const getCategoryColorValue = (categoryName: string): string => {
  const name = categoryName.toLowerCase();

  // Check exact matches first
  if (categoryColorMap[name]) {
    return categoryColorMap[name];
  }

  // Check keyword matches
  for (const [keyword, color] of Object.entries(categoryColorMap)) {
    if (name.includes(keyword)) {
      return color;
    }
  }

  return defaultCategoryColor;
};
