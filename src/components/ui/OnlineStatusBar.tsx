

interface OnlineStatusBarProps {
  isOnline: boolean;
}

export function OnlineStatusBar({ isOnline }: OnlineStatusBarProps) {
  return (
    <div className={`rounded-xl p-3 ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-700">Online</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-sm font-medium text-yellow-700">Offline Mode</span>
            </>
          )}
        </div>
        {!isOnline && (
          <span className="text-xs text-yellow-600">
            Data saved locally
          </span>
        )}
      </div>
    </div>
  );
}
