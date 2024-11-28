import { useEffect, useState, useCallback } from 'react';
import { ServerStatus } from '@/types/schedule';
import { getServerStatus } from '@/lib/api';

export const useServerStatus = (initialStatus?: ServerStatus) => {
  const [status, setStatus] = useState<ServerStatus>(initialStatus || {
    maintenance_mode: false,
    status: 'unknown'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const newStatus = await getServerStatus();
      setStatus(newStatus);

      if (newStatus.maintenance_mode) {
        window.location.href = '/maintenance';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check server status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    refresh: checkStatus
  };
};