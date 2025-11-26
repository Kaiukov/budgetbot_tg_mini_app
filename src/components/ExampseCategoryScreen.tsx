import { ChevronRight, MoreHorizontal, Folder } from 'lucide-react';
import { useEffect } from 'react';
import type { CategoryUsage } from '../services/sync';
import { extractEmoji, getCategoryNameWithoutEmoji, getCategoryColor } from '../utils/categories';
import { filterCategoriesByType } from '../utils/categoryFilter';
import { gradients, cardStyles, layouts } from '../theme/dark';

interface ExpenseCategoryScreenProps {
  categories: CategoryUsage[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onSelectCategory: (categoryName: string) => void;
  onRetry: () => void;
}

const ExpenseCategoryScreen: React.FC<ExpenseCategoryScreenProps> = ({
  categories,
  categoriesLoading,
  categoriesError,
  onSelectCategory,
  onRetry
}) => {
  const transactionType = 'expense';

  // Log component mount
  useEffect(() => {
    console.log('📋 ExpenseCategoryScreen MOUNTED');
    return () => {
      console.log('📋 ExpenseCategoryScreen UNMOUNTED');
    };
  }, []);

  // Filter categories for expense
  const displayCategories = filterCategoriesByType(categories, transactionType);

  console.log('📊 ExpenseCategoryScreen render - displayCategories:', displayCategories.length);

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        <h1 className="text-2xl font-bold">Select Expense Category</h1>
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
              const isUnused = category.user_has_used === false || category.usage_count === 0;
              const usageText = isUnused ? 'Unused' : `Used ${category.usage_count} times`;

              return (
                <div
                  key={`${category.category_name}-${idx}`}
                  onClick={() => onSelectCategory(category.category_name)}
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white text-sm leading-tight">{categoryNameWithoutEmoji}</h3>
                      {isUnused && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                          Unused
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                      {usageText}
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
            <p className="text-gray-400 text-sm">No expense categories found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategoryScreen;
