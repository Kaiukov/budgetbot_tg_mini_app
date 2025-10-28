import { ArrowLeft, ChevronRight, MoreHorizontal, Folder } from 'lucide-react';
import type { CategoryUsage } from '../services/sync';
import { extractEmoji, getCategoryNameWithoutEmoji, getCategoryColor } from '../utils/categories';

interface CategoryScreenProps {
  categories: CategoryUsage[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onBack: () => void;
  onSelectCategory: (categoryName: string) => void;
  onRetry: () => void;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({
  categories,
  categoriesLoading,
  categoriesError,
  onBack,
  onSelectCategory,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Select Category</h2>
      </div>

      <div className="p-3">
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
        {!categoriesLoading && !categoriesError && categories.length > 0 && (
          <div className="space-y-0">
            {categories.map((category, idx) => {
              const color = getCategoryColor(category.category_name);
              const emoji = extractEmoji(category.category_name);
              const categoryNameWithoutEmoji = getCategoryNameWithoutEmoji(category.category_name);

              return (
                <div
                  key={`${category.category_name}-${idx}`}
                  onClick={() => onSelectCategory(category.category_name)}
                  className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3 hover:bg-gray-750 transition cursor-pointer active:bg-gray-700 flex items-center"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {emoji ? (
                      <span className="text-2xl">{emoji}</span>
                    ) : (
                      <MoreHorizontal size={20} style={{ color }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm leading-tight">{categoryNameWithoutEmoji}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                      Used {category.usage_count} times
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-500" />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!categoriesLoading && !categoriesError && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <Folder size={48} className="text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryScreen;
