import { ArrowLeft, ChevronRight } from 'lucide-react';
import { categories } from '../utils/categories';

interface CategoryScreenProps {
  onBack: () => void;
  onSelectCategory: (categoryName: string) => void;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({
  onBack,
  onSelectCategory
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Select Category</h2>
      </div>

      <div className="p-3 space-y-0">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3 hover:bg-gray-750 transition cursor-pointer active:bg-gray-700 flex items-center"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <Icon size={18} style={{ color: cat.color }} />
              </div>
              <h3 className="font-medium text-white text-sm flex-1 leading-tight">{cat.name}</h3>
              <ChevronRight size={16} className="text-gray-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryScreen;
