/**
 * Ad Type Definitions
 * Defines interfaces and types for the ad system
 */

export type AdType = 'video' | 'image' | 'html';

export interface Ad {
  /** Unique identifier for the ad */
  id: string;
  
  /** Type of ad content */
  type: AdType;
  
  /** URL or HTML content for the ad */
  content: string;
  
  /** Optional duration in milliseconds for auto-dismiss */
  duration?: number;
  
  /** Optional URL to open when ad is clicked */
  clickUrl?: string;
  
  /** Impression tracking ID */
  impressionId?: string;
  
  /** Optional title for the ad */
  title?: string;
  
  /** Optional CTA button text */
  ctaText?: string;
}

export interface AdEventDetail {
  ad?: Ad;
}

export type AdEventType = 'showAd' | 'dismissAd';

export interface AdManagerState {
  currentAd: Ad | null;
  isAdShowing: boolean;
  pausedVideoIndex: number | null;
}

// Extend Window interface for global trigger functions
declare global {
  interface Window {
    triggerAd: (ad?: Ad) => void;
    dismissAd: () => void;
  }
}
