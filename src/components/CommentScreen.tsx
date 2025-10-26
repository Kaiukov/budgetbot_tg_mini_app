import { ArrowLeft } from 'lucide-react';
import { suggestedComments } from '../utils/categories';

interface CommentScreenProps {
  comment: string;
  onBack: () => void;
  onCommentChange: (comment: string) => void;
  onNext: () => void;
}

const CommentScreen: React.FC<CommentScreenProps> = ({
  comment,
  onBack,
  onCommentChange,
  onNext
}) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-base font-semibold">Comment</h2>
      </div>

      <div className="p-3">
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Add comment (optional)"
          className="w-full h-28 p-3 text-sm bg-gray-800 text-white rounded-lg border-none focus:ring-1 focus:ring-gray-700 outline-none resize-none placeholder-gray-500"
        />

        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">Quick options:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedComments.map((suggestedComment, idx) => (
              <button
                key={idx}
                onClick={() => onCommentChange(suggestedComment)}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition active:scale-95"
              >
                {suggestedComment}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CommentScreen;
