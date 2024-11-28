export interface MonitoringState {
    failedAttempts: number;
    lastFailTime: Date | null;
    lastUpdateTime: Date | null;
    isOnline: boolean;
    maintenanceMode: boolean;
  }
  
  export interface StatusMessage {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
    duration?: number; 
  }