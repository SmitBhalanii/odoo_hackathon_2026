import React, { useState, useEffect } from 'react';
import { checkHealth } from '../api/healthcheck';

function HealthCheck() {
  const [status, setStatus] = useState('checking'); // 'checking', 'healthy', 'error'

  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setStatus('healthy');
      } catch (err) {
        setStatus('error');
      }
    };

    check();
    
    // Check every 30 seconds
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    checking: 'bg-yellow-400',
    healthy: 'bg-green-500',
    error: 'bg-red-500'
  };

  const statusLabels = {
    checking: 'Connecting...',
    healthy: 'Backend Connected',
    error: 'Backend Offline'
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'healthy' ? 'animate-pulse' : ''}`} />
      <span className="text-gray-600">{statusLabels[status]}</span>
    </div>
  );
}

export default HealthCheck;
