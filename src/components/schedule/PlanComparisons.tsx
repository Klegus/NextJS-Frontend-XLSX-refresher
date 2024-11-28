import { useState, useEffect } from 'react';
import { Comparison } from '@/types/schedule';
import { getComparisons } from '@/lib/api';

interface PlanComparisonsProps {
  planId: string;
  groupId: string;
}

export const PlanComparisons: React.FC<PlanComparisonsProps> = ({
  planId,
  groupId
}) => {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = [
    'bg-blue-50 border-blue-200 text-blue-800',
    'bg-green-50 border-green-200 text-green-800',
    'bg-yellow-50 border-yellow-200 text-yellow-800',
    'bg-red-50 border-red-200 text-red-800',
    'bg-indigo-50 border-indigo-200 text-indigo-800',
    'bg-purple-50 border-purple-200 text-purple-800',
    'bg-pink-50 border-pink-200 text-pink-800',
  ];

  useEffect(() => {
    const fetchComparisons = async () => {
      setLoading(true);
      try {
        const data = await getComparisons(planId, groupId);
        setComparisons(data.filter(comparison => 
          comparison.results?.[groupId]?.trim() !== "Brak różnic."
        ));
        setError(null);
      } catch (err) {
        setError('Nie udało się pobrać porównań planów.');
        console.error('Error fetching comparisons:', err);
      } finally {
        setLoading(false);
      }
    };

    if (planId && groupId) {
      fetchComparisons();
    }
  }, [planId, groupId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wspia-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <p className="text-xl text-center text-gray-600">
        Brak zmian w ostatnich porównaniach.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comparisons.map((comparison, index) => (
        <div
          key={comparison.timestamp}
          className={`comparison-card ${colors[index % colors.length]} p-6 rounded-lg shadow-md border-l-4`}
        >
          <h3 className="text-xl font-semibold mb-3">
            Porównanie z {new Date(comparison.timestamp).toLocaleString()}
          </h3>
          <p className="mb-1">
            <strong>Nowszy plan:</strong>{' '}
            {new Date(comparison.newer_plan_timestamp).toLocaleString()}
          </p>
          <p className="mb-1">
            <strong>Starszy plan:</strong>{' '}
            {new Date(comparison.older_plan_timestamp).toLocaleString()}
          </p>
          <div className="mt-3">
            <h4 className="font-semibold mb-2">Zmiany:</h4>
            <p>{comparison.results[groupId]}</p>
          </div>
        </div>
      ))}
    </div>
  );
};