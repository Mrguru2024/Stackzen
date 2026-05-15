import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface PerformanceMetric {
  id: number;
  componentName: string;
  metricName: string;
  value: number;
  timestamp: Date;
}

interface WebSocketMessage {
  type: 'initial' | 'metric';
  data: PerformanceMetric | PerformanceMetric[];
}

export function usePerformanceWebSocket(
  onMetric: (metric: PerformanceMetric) => void,
  onInitial: (metrics: PerformanceMetric[]) => void
) {
  const { data: session } = useSession();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!session?.user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/performance/ws`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };

    ws.current.onmessage = event => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'initial') {
          onInitial(message.data as PerformanceMetric[]);
        } else if (message.type === 'metric') {
          onMetric(message.data as PerformanceMetric);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };

    ws.current.onerror = error => {
      console.error('WebSocket error:', error);
      ws.current?.close();
    };
  }, [session, onMetric, onInitial]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return {
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
}
