import React from 'react';

interface APIKeyStatusProps {
  apiKey: string;
  onOpenSettings: () => void;
}

export function APIKeyStatus({ apiKey, onOpenSettings }: APIKeyStatusProps) {
  return (
    <div className={`rounded-xl p-3 ${apiKey ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${apiKey ? 'text-green-700' : 'text-red-700'}`}>
            {apiKey ? 'API Key Configured' : 'API Key Missing'}
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className={`text-sm px-3 py-1 rounded ${apiKey ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
        >
          {apiKey ? 'Change' : 'Add Key'}
        </button>
      </div>
    </div>
  );
}
