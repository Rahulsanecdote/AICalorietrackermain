

interface OnlineStatusBarProps {
  isOnline: boolean;
}

export function OnlineStatusBar({ isOnline }: OnlineStatusBarProps) {
  return (
    <div className={`rounded-xl p-3 ${isOnline ? 'bg-primary/10 border border-primary/20' : 'bg-muted border border-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"></div>
              <span className="text-sm font-medium text-primary">Online</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-sm font-medium text-muted-foreground">Offline Mode</span>
            </>
          )}
        </div>
        {!isOnline && (
          <span className="text-xs text-muted-foreground">
            Data saved locally
          </span>
        )}
      </div>
    </div>
  );
}
