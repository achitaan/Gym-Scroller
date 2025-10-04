/**
 * Ad Manager Hook
 * Manages ad state and handles ad trigger events
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Ad, AdManagerState } from './ad-types';
import { adEventBus } from './ad-event-bus';
import { getNextAd } from './mock-ads';

export function useAdManager() {
  const [state, setState] = useState<AdManagerState>({
    currentAd: null,
    isAdShowing: false,
    pausedVideoIndex: null,
  });

  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Show an ad
   */
  const showAd = useCallback((ad?: Ad, videoIndex?: number) => {
    // Clear any existing auto-dismiss timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    // Use provided ad or get next ad from rotation
    const adToShow = ad || getNextAd();

    setState((prev) => ({
      ...prev,
      currentAd: adToShow,
      isAdShowing: true,
      pausedVideoIndex: videoIndex ?? prev.pausedVideoIndex,
    }));

    // Track impression
    if (adToShow.impressionId) {
      console.log(`📊 Ad impression tracked: ${adToShow.impressionId}`);
    }

    // Set up auto-dismiss if duration is specified
    if (adToShow.duration) {
      autoDismissTimerRef.current = setTimeout(() => {
        dismissAd();
      }, adToShow.duration);
    }

    // Lock scroll
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    console.log(`🎬 Ad showing: ${adToShow.type} - ${adToShow.title || adToShow.id}`);
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
        console.log(`❌ Ad dismissed: ${prev.currentAd.id}`);
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
   * Handle ad click
   */
  const handleAdClick = useCallback(() => {
    if (state.currentAd?.clickUrl) {
      console.log(`🔗 Ad clicked: ${state.currentAd.clickUrl}`);
      window.open(state.currentAd.clickUrl, '_blank');
    }
  }, [state.currentAd]);

  /**
   * Clear paused video index after resuming
   */
  const clearPausedIndex = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pausedVideoIndex: null,
    }));
  }, []);

  // Subscribe to ad events
  useEffect(() => {
    const unsubscribeShow = adEventBus.onShowAd((ad) => {
      showAd(ad);
    });

    const unsubscribeDismiss = adEventBus.onDismissAd(() => {
      dismissAd();
    });

    return () => {
      unsubscribeShow();
      unsubscribeDismiss();
      
      // Clean up on unmount
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      
      // Unlock scroll
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [showAd, dismissAd]);

  return {
    currentAd: state.currentAd,
    isAdShowing: state.isAdShowing,
    pausedVideoIndex: state.pausedVideoIndex,
    showAd,
    dismissAd,
    handleAdClick,
    clearPausedIndex,
  };
}
