import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface WebSocketEvents {
  'performance-metrics': (metrics: any) => void;
  'security-event': (event: any) => void;
  'system-health': (health: any) => void;
  'error-event': (error: any) => void;
  'deployment-event': (deployment: any) => void;
  'user-activity': (activity: any) => void;
  'audit-log': (log: any) => void;
}

export function useWebSocket() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket<WebSocketEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: {
        token: session.user?.id,
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);

      // Join appropriate rooms based on user role
      if (session.user?.role === 'admin') {
        socketInstance.emit('join-admin');
      }
      if (session.user?.role === 'developer') {
        socketInstance.emit('join-developer');
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session]);

  const subscribe = useCallback(
    <T extends keyof WebSocketEvents>(event: T, callback: WebSocketEvents[T]) => {
      if (!socket) return;

      socket.on(event, callback);

      return () => {
        socket.off(event, callback);
      };
    },
    [socket]
  );

  return {
    isConnected,
    subscribe,
  };
}
