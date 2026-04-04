import { useState, useEffect } from 'react';
import { Cloud, CloudOff } from 'lucide-react';

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 rounded-full text-[10px] font-medium transition-colors border border-border">
      {isOnline ? (
        <>
          <Cloud className="w-3.5 h-3.5 text-green-500" />
          <span className="text-muted-foreground hidden sm:inline">Synced</span>
        </>
      ) : (
        <>
          <CloudOff className="w-3.5 h-3.5 text-destructive" />
          <span className="text-muted-foreground hidden sm:inline">Offline (Saved locally)</span>
        </>
      )}
    </div>
  );
}
