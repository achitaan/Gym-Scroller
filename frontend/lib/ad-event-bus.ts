/**
 * Ad Event Bus
 * Global event system for triggering and dismissing ads
 */

import { Ad, AdEventDetail } from './ad-types';

class AdEventBus extends EventTarget {
  private static instance: AdEventBus;

  private constructor() {
    super();
  }

  static getInstance(): AdEventBus {
    if (!AdEventBus.instance) {
      AdEventBus.instance = new AdEventBus();
    }
    return AdEventBus.instance;
  }

  /**
   * Trigger an ad to be shown
   * @param ad - Optional ad data. If not provided, will use next available ad
   */
  triggerAd(ad?: Ad): void {
    const event = new CustomEvent<AdEventDetail>('showAd', {
      detail: { ad },
    });
    this.dispatchEvent(event);
  }

  /**
   * Dismiss the currently showing ad
   */
  dismissAd(): void {
    const event = new CustomEvent('dismissAd');
    this.dispatchEvent(event);
  }

  /**
   * Subscribe to ad show events
   */
  onShowAd(callback: (ad?: Ad) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AdEventDetail>;
      callback(customEvent.detail.ad);
    };
    this.addEventListener('showAd', handler);
    
    // Return unsubscribe function
    return () => this.removeEventListener('showAd', handler);
  }

  /**
   * Subscribe to ad dismiss events
   */
  onDismissAd(callback: () => void): () => void {
    this.addEventListener('dismissAd', callback);
    
    // Return unsubscribe function
    return () => this.removeEventListener('dismissAd', callback);
  }
}

// Export singleton instance
export const adEventBus = AdEventBus.getInstance();

// Setup global functions (will be called from layout)
export function setupGlobalAdTriggers(): void {
  if (typeof window !== 'undefined') {
    window.triggerAd = (ad?: Ad) => {
      adEventBus.triggerAd(ad);
    };

    window.dismissAd = () => {
      adEventBus.dismissAd();
    };

    // Dev mode keyboard shortcuts
    if (process.env.NODE_ENV === 'development') {
      document.addEventListener('keydown', (e) => {
        // Press 'A' to trigger test ad
        if (e.key === 'a' && e.ctrlKey && e.shiftKey) {
          console.log('🎬 Triggering test ad (Ctrl+Shift+A)');
          adEventBus.triggerAd();
        }
        // Press 'D' to dismiss ad
        if (e.key === 'd' && e.ctrlKey && e.shiftKey) {
          console.log('❌ Dismissing ad (Ctrl+Shift+D)');
          adEventBus.dismissAd();
        }
      });
      
      console.log('🎯 Ad system ready. Use Ctrl+Shift+A to trigger ad, Ctrl+Shift+D to dismiss');
    }
  }
}
