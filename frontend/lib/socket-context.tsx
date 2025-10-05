'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RepEvent, SetUpdate, SetEnd, ShortsQueue } from './types';
import { adEventBus } from './ad-event-bus';
import type { Ad } from './ad-types';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  lastRep: RepEvent | null;
  currentSet: SetUpdate | null;
  lastSetEnd: SetEnd | null;
  shortsQueue: string[];
  sensorState: 'waiting' | 'concentric' | 'eccentric' | 'failure' | null;
  subscribeToReps: (callback: (rep: RepEvent) => void) => () => void;
  subscribeToSetUpdates: (callback: (update: SetUpdate) => void) => () => void;
  subscribeToSetEnd: (callback: (end: SetEnd) => void) => () => void;
  subscribeToSensorData: (callback: (state: string) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
  url?: string;
}

// Use environment variable or default to localhost
const DEFAULT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function SocketProvider({ children, url = DEFAULT_BACKEND_URL }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRep, setLastRep] = useState<RepEvent | null>(null);
  const [currentSet, setCurrentSet] = useState<SetUpdate | null>(null);
  const [lastSetEnd, setLastSetEnd] = useState<SetEnd | null>(null);
  const [shortsQueue, setShortsQueue] = useState<string[]>([]);
  const [sensorState, setSensorState] = useState<'waiting' | 'concentric' | 'eccentric' | 'failure' | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(url, {
      transports: ['websocket'],
      // Aggressive reconnection settings for real-time streaming
      reconnection: true,
      reconnectionAttempts: Infinity,        // Keep trying forever
      reconnectionDelay: 500,                // Start quickly (500ms)
      reconnectionDelayMax: 3000,            // Max 3s between attempts
      timeout: 60000,                        // 60s connection timeout (matches backend ping_timeout=90s)
      // Additional stability settings
      autoConnect: true,
      forceNew: false,
      multiplex: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ [Socket] Connected to backend');
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔴 [Socket] Disconnected:', reason);
      setConnected(false);

      // Force reconnect if server initiated disconnect
      if (reason === 'io server disconnect') {
        console.log('🔄 [Socket] Server disconnected us - reconnecting manually');
        socketInstance.connect();
      }
    });

    // Reconnection attempt logging
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 [Socket] Reconnection attempt #${attemptNumber}`);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`✅ [Socket] Reconnected after ${attemptNumber} attempts`);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ [Socket] Reconnection failed - will keep trying');
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('⚠️ [Socket] Reconnection error:', error.message);
    });

    // Connection errors
    socketInstance.on('connect_error', (error) => {
      console.error('❌ [Socket] Connection error:', error.message);
    });

    socketInstance.on('connect_timeout', () => {
      console.error('⏱️ [Socket] Connection timeout');
    });

    // Ping/Pong for connection health monitoring
    socketInstance.on('ping', () => {
      console.log('💓 [Socket] Ping received from server');
    });

    socketInstance.on('pong', (latency) => {
      console.log(`💓 [Socket] Pong - latency: ${latency}ms`);
    });

    socketInstance.on('rep', (data: RepEvent) => {
      setLastRep(data);
    });

    socketInstance.on('setUpdate', (data: SetUpdate) => {
      setCurrentSet(data);
    });

    socketInstance.on('setEnd', (data: SetEnd) => {
      setLastSetEnd(data);
      setCurrentSet(null); // Reset current set
    });

    socketInstance.on('shorts', (data: ShortsQueue) => {
      setShortsQueue(data.queue);
    });

    socketInstance.on('musicCue', (data: { action: 'duck' | 'restore' }) => {
      // Handled by music integration
      console.log('[Socket] Music cue:', data.action);
    });

    // Sensor data from ESP8266 microcontroller
    socketInstance.on('sensorData', (state: string) => {
      // Log with emoji indicators matching backend style
      if (state === 'concentric') {
        console.log('🏋️  CONCENTRIC phase - lifting');
      } else if (state === 'eccentric') {
        console.log('⬇️  ECCENTRIC phase - lowering');
      } else if (state === 'failure') {
        console.log('⚠️  FAILURE DETECTED - concentric phase taking too long');
      } else if (state === 'waiting') {
        console.log('⏸️  WAITING - no movement detected');
      } else {
        console.log('[Socket] Sensor state:', state);
      }

      if (state === 'waiting' || state === 'concentric' || state === 'eccentric' || state === 'failure') {
        setSensorState(state);
      }
    });

    // Connection acknowledgment from server
    socketInstance.on('connection_ack', (data: { status: string; sid: string }) => {
      console.log('[Socket] Connection acknowledged:', data);
    });

    // Processing errors from backend
    socketInstance.on('processing_error', (error: { error: string; code: string; message: string }) => {
      console.error('[Socket] Processing error:', error);
    });

    // Ad event listeners
    socketInstance.on('showAd', (data: Ad) => {
      console.log('[Socket] Show ad received:', data);
      adEventBus.triggerAd(data);
    });

    socketInstance.on('dismissAd', () => {
      console.log('[Socket] Dismiss ad received');
      adEventBus.dismissAd();
    });

    setSocket(socketInstance);

    // Handle page visibility changes (reconnect when tab becomes active)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socketInstance.connected) {
        console.log('👁️ [Socket] Tab visible - checking connection');
        if (!socketInstance.connected) {
          console.log('🔄 [Socket] Reconnecting after tab was hidden');
          socketInstance.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle network online/offline events
    const handleOnline = () => {
      console.log('🌐 [Socket] Network back online - reconnecting');
      if (!socketInstance.connected) {
        socketInstance.connect();
      }
    };

    const handleOffline = () => {
      console.log('📴 [Socket] Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      console.log('🧹 [Socket] Cleaning up connection');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socketInstance.disconnect();
    };
  }, [url]);

  // Subscribe to rep events
  const subscribeToReps = useCallback((callback: (rep: RepEvent) => void) => {
    if (!socket) return () => { };

    socket.on('rep', callback);
    return () => {
      socket.off('rep', callback);
    };
  }, [socket]);

  // Subscribe to set update events
  const subscribeToSetUpdates = useCallback((callback: (update: SetUpdate) => void) => {
    if (!socket) return () => { };

    socket.on('setUpdate', callback);
    return () => {
      socket.off('setUpdate', callback);
    };
  }, [socket]);

  // Subscribe to set end events
  const subscribeToSetEnd = useCallback((callback: (end: SetEnd) => void) => {
    if (!socket) return () => { };

    socket.on('setEnd', callback);
    return () => {
      socket.off('setEnd', callback);
    };
  }, [socket]);

  // Subscribe to sensor data events (from ESP8266)
  const subscribeToSensorData = useCallback((callback: (state: string) => void) => {
    if (!socket) return () => { };

    socket.on('sensorData', callback);
    return () => {
      socket.off('sensorData', callback);
    };
  }, [socket]);

  const value: SocketContextValue = {
    socket,
    connected,
    lastRep,
    currentSet,
    lastSetEnd,
    shortsQueue,
    sensorState,
    subscribeToReps,
    subscribeToSetUpdates,
    subscribeToSetEnd,
    subscribeToSensorData,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
