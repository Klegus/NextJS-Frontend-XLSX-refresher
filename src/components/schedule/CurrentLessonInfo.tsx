interface CurrentLessonInfoProps {
    currentTimeSlot: string | null;
    nextTimeSlot: string | null;
  }
  
  export const CurrentLessonInfo: React.FC<CurrentLessonInfoProps> = ({
    currentTimeSlot,
    nextTimeSlot
  }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="space-y-2">
          {currentTimeSlot ? (
            <div>
              <span className="font-medium">Aktualne zajęcia:</span>
              <span className="ml-2">{currentTimeSlot}</span>
            </div>
          ) : (
            <div className="text-gray-500">Brak aktualnych zajęć</div>
          )}
          
          {nextTimeSlot && (
            <div>
              <span className="font-medium">Następne zajęcia:</span>
              <span className="ml-2">{nextTimeSlot}</span>
            </div>
          )}
        </div>
      </div>
    );
  };