/**
 * Mock Ads
 * Sample ad data for testing the ad system
 */

import { Ad } from './ad-types';

export const mockAds: Ad[] = [
  {
    id: 'ad-video-1',
    type: 'video',
    content: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1',
    duration: 15000, // 15 seconds
    title: 'Premium Protein Powder',
    clickUrl: 'https://example.com/protein',
    impressionId: 'imp-001',
  },
  {
    id: 'ad-image-1',
    type: 'image',
    content: '/placeholder.jpg',
    duration: 10000, // 10 seconds
    title: 'Join Our Gym',
    ctaText: 'Sign Up Now',
    clickUrl: 'https://example.com/signup',
    impressionId: 'imp-002',
  },
  {
    id: 'ad-video-2',
    type: 'video',
    content: 'https://www.youtube.com/embed/ZXsQAXx_ao0?autoplay=1&mute=1',
    duration: 20000, // 20 seconds
    title: 'Fitness Equipment Sale',
    clickUrl: 'https://example.com/equipment',
    impressionId: 'imp-003',
  },
  {
    id: 'ad-html-1',
    type: 'html',
    content: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 2rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; font-weight: bold;">🏋️ Premium Membership</h1>
        <p style="font-size: 1.5rem; margin-bottom: 2rem;">Get 50% off your first 3 months!</p>
        <div style="font-size: 4rem; margin-bottom: 2rem;">💪</div>
        <button style="background: white; color: #667eea; padding: 1rem 3rem; border: none; border-radius: 50px; font-size: 1.25rem; font-weight: bold; cursor: pointer;">
          Claim Offer
        </button>
      </div>
    `,
    duration: 12000, // 12 seconds
    clickUrl: 'https://example.com/membership',
    impressionId: 'imp-004',
  },
  {
    id: 'ad-image-2',
    type: 'image',
    content: '/gym-community-workout.jpg',
    title: 'Community Workout Event',
    ctaText: 'Register Free',
    clickUrl: 'https://example.com/event',
    impressionId: 'imp-005',
  },
];

/**
 * Get a random ad from the mock ads list
 */
export function getRandomAd(): Ad {
  return mockAds[Math.floor(Math.random() * mockAds.length)];
}

/**
 * Get next ad in rotation
 */
let adIndex = 0;
export function getNextAd(): Ad {
  const ad = mockAds[adIndex % mockAds.length];
  adIndex++;
  return ad;
}
