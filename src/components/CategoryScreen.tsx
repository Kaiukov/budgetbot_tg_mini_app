import { ArrowLeft, ChevronRight, MoreHorizontal, Folder } from 'lucide-react';
import { useEffect } from 'react';
import telegramService from '../services/telegram';
import type { CategoryUsage } from '../services/sync';
import { extractBudgetName } from '../services/sync/utils';
import { extractEmoji, getCategoryNameWithoutEmoji, getCategoryColor } from '../utils/categories';
import { filterCategoriesByType, type TransactionType } from '../utils/categoryFilter';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface CategoryScreenProps {
  categories: CategoryUsage[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  transactionType?: TransactionType;
  isAvailable?: boolean;
  onBack: () => void;
  onSelectCategory: (categoryName: string, categoryId: number, budgetName?: string) => void;
  onRetry: () => void;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({
  categories,
  categoriesLoading,
  categoriesError,
  transactionType = 'expense',
  isAvailable,
  onBack,
  onSelectCategory,
  onRetry
}) => {
  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  // Filter categories based on transaction type (income only filters, expense shows all)
  const displayCategories = filterCategoriesByType(categories, transactionType);

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h1 className="text-2xl font-bold">Select Category</h1>
      </div>

      <div className={layouts.content}>
        {/* Loading State */}
        {categoriesLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400 text-sm">Loading categories...</div>
          </div>
        )}

        {/* Error State */}
        {categoriesError && !categoriesLoading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{categoriesError}</p>
            <button
              onClick={onRetry}
              className="mt-2 text-red-400 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Categories List */}
        {!categoriesLoading && !categoriesError && displayCategories.length > 0 && (
          <div className={layouts.listContainer}>
            {displayCategories.map((category, idx) => {
              const color = getCategoryColor(category.category_name);
              const emoji = extractEmoji(category.category_name);
              const categoryNameWithoutEmoji = getCategoryNameWithoutEmoji(category.category_name);

              return (
                <div
                  key={`${category.category_name}-${idx}`}
                  onClick={() => onSelectCategory(category.category_name, category.category_id, extractBudgetName(category.category_name))}
                  className={`${cardStyles.listItem} flex items-center`}
                >
                  <div
                    className={cardStyles.iconBase}
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {emoji ? (
                      <span className="text-2xl">{emoji}</span>
                    ) : (
                      <MoreHorizontal size={20} style={{ color }} />
                    )}
                  </div>
                  <div className={cardStyles.textWrapper}>
                    <h3 className="font-medium text-white text-sm leading-tight">{categoryNameWithoutEmoji}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                      Used {category.usage_count} times
                    </p>
                  </div>
                  <ChevronRight size={16} className={cardStyles.chevron} />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!categoriesLoading && !categoriesError && displayCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <Folder size={48} className="text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">
              {transactionType === 'income'
                ? 'No income categories found'
                : 'No categories found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryScreen;
