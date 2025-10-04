/**
 * Ad Manager Hook
 * Manages ad state and handles YouTube ad overlays
 */

'use client';

import { useState, useCallback, useRef } from 'react';

export interface Ad {
  id: string;
  type: 'video';
  content: string; // YouTube embed URL
  duration: number; // Duration in milliseconds
  title: string;
  clickUrl?: string;
  impressionId?: string;
}

export interface AdManagerState {
  currentAd: Ad | null;
  isAdShowing: boolean;
  pausedVideoIndex: number | null;
}

export function useAdManager() {
  const [state, setState] = useState<AdManagerState>({
    currentAd: null,
    isAdShowing: false,
    pausedVideoIndex: null,
  });

  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Show a YouTube ad
   */
  const showAd = useCallback((ad: Ad, videoIndex?: number) => {
    // Clear any existing auto-dismiss timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      currentAd: ad,
      isAdShowing: true,
      pausedVideoIndex: videoIndex ?? prev.pausedVideoIndex,
    }));

    // Track impression
    if (ad.impressionId) {
      console.log(`📊 Ad impression tracked: ${ad.impressionId}`);
    }

    // Set up auto-dismiss based on video duration
    if (ad.duration && ad.duration > 0) {
      console.log(`⏱️ Ad will auto-dismiss in ${ad.duration / 1000} seconds`);
      autoDismissTimerRef.current = setTimeout(() => {
        dismissAd();
      }, ad.duration);
    }

    // Lock scroll while ad is showing
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    console.log(`🎬 YouTube ad showing: "${ad.title}"`);
  }, []);

  /**
   * Dismiss the current ad
   */
  const dismissAd = useCallback(() => {
    // Clear auto-dismiss timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    setState((prev) => {
      // Track dismissal
      if (prev.currentAd) {
        console.log(`❌ Ad dismissed: ${prev.currentAd.title}`);
      }

      return {
        ...prev,
        currentAd: null,
        isAdShowing: false,
        // Keep pausedVideoIndex to resume video
      };
    });

    // Unlock scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, []);

  /**
   * Handle ad click - opens YouTube video in new tab
   */
  const handleAdClick = useCallback(() => {
    if (state.currentAd?.clickUrl) {
      console.log(`🔗 Ad clicked: ${state.currentAd.clickUrl}`);
      window.open(state.currentAd.clickUrl, '_blank');
    }
  }, [state.currentAd]);

  /**
   * Clear paused video index after resuming feed
   */
  const clearPausedIndex = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pausedVideoIndex: null,
    }));
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    
    // Unlock scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, []);

  return {
    currentAd: state.currentAd,
    isAdShowing: state.isAdShowing,
    pausedVideoIndex: state.pausedVideoIndex,
    showAd,
    dismissAd,
    handleAdClick,
    clearPausedIndex,
    cleanup,
  };
}
