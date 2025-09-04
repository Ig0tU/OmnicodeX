import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebSocketMessage, MessageType } from '../types';

interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    url,
    protocols,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = config;

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval > 0) {
      heartbeatIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          sendMessage('heartbeat', { timestamp: new Date().toISOString() });
        }
      }, heartbeatInterval);
    }
  }, [heartbeatInterval]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const ws = new WebSocket(url, protocols);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ ...prev, connected: true, connecting: false }));
        reconnectAttemptsRef.current = 0;
        startHeartbeat();
        onConnect?.();
      };

      ws.onclose = (event) => {
        setState(prev => ({ ...prev, connected: false, connecting: false }));
        clearTimeouts();
        onDisconnect?.();

        // Attempt reconnection if not a normal closure
        if (!event.wasClean && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.min(delay, 30000)); // Cap at 30 seconds
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          error: 'WebSocket connection error',
          connecting: false 
        }));
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: message }));
          onMessage?.(message);
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
        }
      };
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Connection failed',
        connecting: false 
      }));
    }
  }, [url, protocols, reconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage, startHeartbeat, clearTimeouts]);

  const disconnect = useCallback(() => {
    clearTimeouts();
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setState(prev => ({ ...prev, connected: false, connecting: false }));
  }, [clearTimeouts]);

  const sendMessage = useCallback((
    type: MessageType,
    payload: unknown,
    receiverId?: string
  ) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message: WebSocketMessage = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      senderId: 'client',
      receiverId,
      payload,
    };

    wsRef.current.send(JSON.stringify(message));
    return message.id;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      clearTimeouts();
      disconnect();
    };
  }, [connect, disconnect, clearTimeouts]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    isConnected: state.connected,
    isConnecting: state.connecting,
  };
};