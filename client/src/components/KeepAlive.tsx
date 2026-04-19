import { useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

const KeepAlive = () => {
  useEffect(() => {
    // Ping every 13 minutes (Render free tier timeout is 15min)
    const INTERVAL_MS = 13 * 60 * 1000;

    const pingServer = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/health/`);
        const data = await response.json();
        console.log('[KeepAlive] Heartbeat success:', data.timestamp);
      } catch (error) {
        console.error('[KeepAlive] Heartbeat failed:', error);
      }
    };

    // Initial ping on mount
    pingServer();

    const intervalId = setInterval(pingServer, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  return null; // This component doesn't render anything
};

export default KeepAlive;
