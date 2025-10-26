export interface ServiceStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'checking';
  message: string;
}

export type ServiceStatusType = 'connected' | 'disconnected' | 'checking';

export const getInitialServiceStatuses = (): ServiceStatus[] => [
  { name: 'Telegram Bot', status: 'checking', message: 'Checking connection...' },
  { name: 'Sync API', status: 'checking', message: 'Checking connection...' },
  { name: 'Firefly API', status: 'checking', message: 'Checking connection...' }
];
