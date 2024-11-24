interface WeekControlsProps {
    onPrevWeek: () => void;
    onNextWeek: () => void;
    currentWeek: { start: Date; end: Date };
    isPrevDisabled: boolean;
    isNextDisabled: boolean;
  }
  
  export const WeekControls: React.FC<WeekControlsProps> = ({
    onPrevWeek,
    onNextWeek,
    currentWeek,
    isPrevDisabled,
    isNextDisabled
  }) => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
      });
    };
  
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-white rounded-lg shadow-sm mb-4">
        <button
          onClick={onPrevWeek}
          disabled={isPrevDisabled}
          className="px-4 py-2 text-wspia-red border-2 border-wspia-red rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← <span className="hidden sm:inline">Poprzedni tydzień</span>
          <span className="sm:hidden">Poprzedni</span>
        </button>
  
        <div className="text-center font-medium">
          {formatDate(currentWeek.start)} - {formatDate(currentWeek.end)}
        </div>
  
        <button
          onClick={onNextWeek}
          disabled={isNextDisabled}
          className="px-4 py-2 text-wspia-red border-2 border-wspia-red rounded-lg
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Następny tydzień</span>
          <span className="sm:hidden">Następny</span> →
        </button>
      </div>
    );
  };
  
