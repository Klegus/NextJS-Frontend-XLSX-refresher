import { useState } from 'react';
import { Activity } from '@/types/schedule';
import { formatRelativeDate } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  isNew?: boolean;
  onRead?: (id: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isNew = false,
  onRead
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMouseEnter = () => {
    if (isNew && onRead) {
      onRead(activity.id);
    }
  };

  const renderActivityContent = () => {
    switch (activity.type) {
      case 'folder':
        return (
          <div className="flex items-center gap-2 mt-3">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            {activity.url && (
              <a href={activity.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-sm font-medium text-wspia-red hover:text-wspia-red/70 transition-colors inline-flex items-center gap-1">
                Otwórz folder
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            )}
          </div>
        );

      case 'resource':
        return (
          <div className="mt-3">
            <a href={activity.url}
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-wspia-red hover:bg-wspia-red/90 transition-all hover:shadow-md">
              Otwórz
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </a>
          </div>
        );

      case 'page':
      case 'label':
        return (
          <>
            <div className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: activity.content }} />
              {activity.images && activity.images.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activity.images.map((img, index) => (
                    <img key={index} src={img.src} alt={img.alt} className="max-w-full h-auto rounded-lg"/>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleExpandClick}
                className="!bg-transparent !border-none !shadow-none !p-0 text-sm font-medium text-wspia-red hover:!bg-transparent hover:text-wspia-red/70"
              >
                {isExpanded ? 'Zwiń' : 'Rozwiń'} →
              </button>
              {activity.url && (
                <a href={activity.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-sm text-ink-muted hover:text-wspia-red transition-colors">
                  Przejdź do zasobu →
                </a>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div
      className={`group p-4 rounded-xl transition-all duration-200 ${
        isNew
          ? 'bg-wspia-red/[0.03] border border-wspia-red/20 ring-1 ring-wspia-red/10'
          : 'bg-white/50 border border-gray-100 hover:border-gray-200 hover:bg-white/80'
      }`}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {isNew && (
            <span className="shrink-0 inline-block px-1.5 py-0.5 text-[0.6875rem] font-semibold bg-wspia-red text-white rounded">
              Nowe
            </span>
          )}
          <h3 className="text-[0.9375rem] font-semibold text-ink truncate">
            {activity.title}
          </h3>
        </div>
        <span className="shrink-0 text-xs text-ink-muted/70 tabular-nums">
          {formatRelativeDate(new Date(activity.created_at))}
        </span>
      </div>

      {renderActivityContent()}
    </div>
  );
};
