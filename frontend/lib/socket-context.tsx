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
  subscribeToReps: (callback: (rep: RepEvent) => void) => () => void;
  subscribeToSetUpdates: (callback: (update: SetUpdate) => void) => () => void;
  subscribeToSetEnd: (callback: (end: SetEnd) => void) => () => void;
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

export function SocketProvider({ children, url = 'http://localhost:3001' }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRep, setLastRep] = useState<RepEvent | null>(null);
  const [currentSet, setCurrentSet] = useState<SetUpdate | null>(null);
  const [lastSetEnd, setLastSetEnd] = useState<SetEnd | null>(null);
  const [shortsQueue, setShortsQueue] = useState<string[]>([]);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
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

    return () => {
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

  const value: SocketContextValue = {
    socket,
    connected,
    lastRep,
    currentSet,
    lastSetEnd,
    shortsQueue,
    subscribeToReps,
    subscribeToSetUpdates,
    subscribeToSetEnd,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
