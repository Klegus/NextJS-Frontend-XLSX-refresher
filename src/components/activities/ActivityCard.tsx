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
    if (isNew && onRead) {
      onRead(activity.id);
    }
    setIsExpanded(!isExpanded);
  };

  const renderActivityContent = () => {
    switch (activity.type) {
      case 'folder':
        return (
          <div className="flex items-center gap-2 mt-2">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            {activity.url && (
              <a href={activity.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-wspia-red hover:text-wspia-red/80 flex items-center">
                Otwórz folder
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            )}
          </div>
        );

      case 'resource':
        return (
          <div className="mt-2">
            <a href={activity.url}
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center px-4 py-2 text-white rounded transition-colors bg-wspia-red hover:bg-wspia-red/90">
              Otwórz
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </a>
          </div>
        );

      case 'page':
      case 'label':
        return (
          <>
            <div className={`content-section mt-2 ${isExpanded ? 'block' : 'hidden'}`}>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activity.content }} />
              {activity.images && activity.images.length > 0 && (
                <div className="images-section mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.images.map((img, index) => (
                    <img key={index} src={img.src} alt={img.alt} className="max-w-full h-auto rounded shadow-sm"/>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2">
              <button
                onClick={handleExpandClick}
                className="text-wspia-red hover:text-wspia-red/80 font-medium"
              >
                {isExpanded ? 'Zwiń' : 'Rozwiń'} →
              </button>
              {activity.url && (
                <a href={activity.url}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="ml-4 text-wspia-red hover:text-wspia-red/80">
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
      className={`activity-item p-4 rounded-lg transition-all ${
        isNew ? 'border-2 border-wspia-red/50 bg-wspia-red/5' : 'border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isNew && (
            <span className="inline-block px-2 py-1 text-xs bg-green-500 text-white rounded-full">
              Nowe
            </span>
          )}
          <h3 className="text-lg font-semibold text-gray-800">{activity.title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {formatRelativeDate(new Date(activity.created_at))}
        </span>
      </div>

      {renderActivityContent()}
    </div>
  );
};