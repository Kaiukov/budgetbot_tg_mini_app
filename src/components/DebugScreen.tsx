import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import telegramService from '../services/telegram';
import type { ServiceStatus } from '../utils/serviceStatus';

interface DebugScreenProps {
  userName: string;
  isAvailable: boolean;
  serviceStatuses: ServiceStatus[];
  onBack: () => void;
  onRefresh: () => void;
  telegramStatus?: ServiceStatus;
  /* isAvailable is already present, used for arrow button visibility */
}

const getStatusIcon = (status: 'connected' | 'disconnected' | 'checking') => {
  switch (status) {
    case 'connected':
      return <CheckCircle size={20} className="text-green-500" />;
    case 'disconnected':
      return <XCircle size={20} className="text-red-500" />;
    case 'checking':
      return <AlertCircle size={20} className="text-yellow-500 animate-pulse" />;
  }
};

const getStatusColor = (status: 'connected' | 'disconnected' | 'checking') => {
  switch (status) {
    case 'connected':
      return 'text-green-500';
    case 'disconnected':
      return 'text-red-500';
    case 'checking':
      return 'text-yellow-500';
  }
};

const DebugScreen: React.FC<DebugScreenProps> = ({
  userName,
  isAvailable,
  serviceStatuses,
  onBack,
  onRefresh,
  telegramStatus
}) => {
  // Show Telegram back button
  useEffect(() => {
    telegramService.showBackButton(onBack);
    return () => telegramService.hideBackButton();
  }, [onBack]);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <div className="flex items-center px-3 py-3 border-b border-gray-800">
        {!isAvailable && (
          <button onClick={onBack} className="mr-3">
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <h2 className="text-base font-semibold">Debug Information</h2>
      </div>

      <div className="p-3">
        {/* Services Status Section */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-3 text-white px-1">Services Status</h3>
          <div className="space-y-0">
            {/* Telegram Status */}
            {telegramStatus && (
              <div className="bg-gray-800 border-b border-gray-700 px-3 py-3">
                <div className="flex items-start">
                  <div className="mt-0.5 mr-3">
                    {getStatusIcon(telegramStatus.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white text-sm">{telegramStatus.name}</h4>
                      <span className={`text-xs font-medium uppercase ${getStatusColor(telegramStatus.status)}`}>
                        {telegramStatus.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-tight">{telegramStatus.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Services */}
            {serviceStatuses.map((service, idx) => (
              <div
                key={idx}
                className="bg-gray-800 border-b border-gray-700 last:border-b-0 px-3 py-3"
              >
                <div className="flex items-start">
                  <div className="mt-0.5 mr-3">
                    {getStatusIcon(service.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white text-sm">{service.name}</h4>
                      <span className={`text-xs font-medium uppercase ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-tight">{service.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <AlertCircle size={18} />
          <span>Refresh Status</span>
        </button>

        {/* Additional Debug Info */}
        <div className="mt-4 bg-gray-800 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-400 mb-2">System Information</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Environment:</span>
              <span className="text-gray-300">{isAvailable ? 'Telegram Mini App' : 'Browser'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User:</span>
              <span className="text-gray-300">{userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Timestamp:</span>
              <span className="text-gray-300">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Environment Configuration (Read-only) */}
        <div className="mt-4 bg-gray-800 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-gray-400 mb-3">Environment Configuration</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Base URL:</span>
              <span className="text-gray-300 truncate ml-2 max-w-[60%]">
                {import.meta.env.VITE_BASE_URL || 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Firefly Token:</span>
              <span className="text-gray-300">
                {import.meta.env.VITE_FIREFLY_TOKEN ? '••••••••' : 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sync API Key:</span>
              <span className="text-gray-300">
                {import.meta.env.VITE_SYNC_API_KEY ? '••••••••' : 'Not configured'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500 italic">
              Configuration is managed through environment variables (.env.local)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugScreen;
