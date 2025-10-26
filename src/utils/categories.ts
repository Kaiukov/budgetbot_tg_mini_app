import { ShoppingBag, Coffee, Car, Home, Heart, MoreHorizontal, type LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
}

export const categories: Category[] = [
  { id: 'food', name: 'Food', icon: ShoppingBag, color: '#EF4444' },
  { id: 'cafe', name: 'Cafe', icon: Coffee, color: '#F59E0B' },
  { id: 'transport', name: 'Transport', icon: Car, color: '#3B82F6' },
  { id: 'home', name: 'Home', icon: Home, color: '#10B981' },
  { id: 'health', name: 'Health', icon: Heart, color: '#EC4899' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: '#6B7280' }
];

export const suggestedComments: string[] = [
  'Groceries at store',
  'Lunch',
  'Taxi',
  'Utilities',
  'Medicine'
];
