

interface DebugToolsProps {
  testAPI: () => void;
  onOpenUtilities: () => void;
}

export function DebugTools({ testAPI, onOpenUtilities }: DebugToolsProps) {
  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Tools</h3>
      <div className="flex gap-2">
        <button
          onClick={testAPI}
          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
        >
          Test API
        </button>
        <button
          onClick={onOpenUtilities}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Utilities
        </button>
        <span className="text-xs text-yellow-600">
          Open browser console (F12) to see debug logs
        </span>
      </div>
    </div>
  );
}
