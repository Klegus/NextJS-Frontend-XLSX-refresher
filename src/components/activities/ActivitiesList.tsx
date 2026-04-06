import { useEffect, useState } from 'react';
import { Activity } from '@/types/schedule';
import { ActivityCard } from './ActivityCard';
import { getActivities } from '@/lib/api';

interface ActivitiesListProps {
  limit?: number;
  autoRefresh?: boolean;
}

export const ActivitiesList: React.FC<ActivitiesListProps> = ({
  limit = 10,
  autoRefresh = true
}) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [readActivities, setReadActivities] = useState<Record<string, number>>({});
    useEffect(() => {
        const saved = localStorage.getItem('readActivities');
        if (saved) {
          try {
            setReadActivities(JSON.parse(saved));
          } catch (error) {
            console.error('Failed to parse readActivities:', error);
          }
        }
      }, []);
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await getActivities({ limit });
      setActivities(response.activities);
      setError(null);
    } catch (err) {
      setError('Nie udało się pobrać aktywności. Spróbuj odświeżyć stronę.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivities, 5 * 60 * 1000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [limit, autoRefresh]);

  const handleActivityRead = (activityId: string) => {
    const newReadActivities = {
      ...readActivities,
      [activityId]: Date.now()
    };
    setReadActivities(newReadActivities);
    localStorage.setItem('readActivities', JSON.stringify(newReadActivities));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-6 h-6 border-2 border-wspia-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={fetchActivities}
          className="px-4 py-2 text-sm"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10 text-ink-muted text-sm">
        Brak aktualnych aktywności
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map(activity => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          isNew={!readActivities[activity.id]}
          onRead={handleActivityRead}
        />
      ))}
    </div>
  );
};