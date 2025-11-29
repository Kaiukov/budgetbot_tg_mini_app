import { gradients, layouts } from '../theme/dark';

interface CommentScreenProps {
  comment: string;
  category?: string;
  categoryId?: number | string | null;
  onCommentChange: (comment: string, destinationId?: string) => void;
  onNext: () => void;
}

const CommentScreen: React.FC<CommentScreenProps> = ({
  comment,
  onCommentChange,
  onNext
}) => {
  const displaySuggestions: string[] = [];

  return (
    <div className={`${layouts.screen} ${gradients.screen}`}>
      <div className={`${layouts.header} ${gradients.header}`}>
        <h1 className="text-2xl font-bold">Comment</h1>
      </div>

      <div className={layouts.content}>
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value, undefined)}
          placeholder="Add comment (optional)"
          className="w-full h-28 p-3 text-sm bg-gray-800 text-white rounded-lg border-none focus:ring-1 focus:ring-gray-700 outline-none resize-none placeholder-gray-500"
        />

        <div className="mt-3">
          {displaySuggestions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-400">Quick destinations:</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {displaySuggestions.slice(0, 50).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onCommentChange(suggestion, undefined);
                    }}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition active:scale-95"
                    title={suggestion}
                  >
                    {suggestion.length > 12 ? `${suggestion.slice(0, 50)}...` : suggestion}
                  </button>
                ))}
              </div>
            </>
          )}
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
