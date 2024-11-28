'use client';

import { useState, useEffect } from 'react';
import { getServerStatus } from '@/lib/api';
import { ServerStatus } from '@/types/schedule';

interface ServerStatusIndicatorProps {
  initialStatus?: ServerStatus;
}

export const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({
  initialStatus
}) => {
  const [status, setStatus] = useState<ServerStatus>(initialStatus || {
    maintenance_mode: false,
    status: 'unknown',
    last_check: new Date().toISOString(),
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        console.log('Checking server status...');
        const newStatus = await getServerStatus();
        console.log('Server status:', newStatus);
        setStatus(newStatus);
      } catch (error) {
        console.error('Error checking server status:', error);
        setStatus(prev => ({
          ...prev,
          status: 'error',
        }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusClass = () => {
    if (status.status === 'active') return 'active';
    return 'inactive';
  };

  const getStatusText = () => {
    if (status.status === 'active') return 'Online';
    if (status.maintenance_mode) return 'Przerwa techniczna';
    return 'Offline';
  };

  return (
    <div className="fixed top-5 right-5 flex items-center bg-white/80 p-3 rounded-full shadow-lg backdrop-blur-sm">
      <div className={`server-status-indicator ${getStatusClass()}`} />
      <span className="ml-2 font-medium">{getStatusText()}</span>
    </div>
  );
};