interface NumberPadProps {
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  onConfirm?: () => void;
}

const NumberPad: React.FC<NumberPadProps> = ({ onNumberClick, onDelete }) => {
  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'];

  return (
    <div className="grid grid-cols-3 gap-1.5 mt-3">
      {buttons.map((btn) => (
        <button
          key={btn}
          onClick={() => {
            if (btn === '←') onDelete();
            else onNumberClick(btn);
          }}
          className="h-12 bg-gray-700 rounded-lg font-medium text-base text-gray-200 hover:bg-gray-600 active:scale-95 transition"
        >
          {btn === '←' ? '←' : btn}
        </button>
      ))}
    </div>
  );
};

export default NumberPad;
