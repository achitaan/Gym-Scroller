# Ad System Documentation

## Overview

The Ad System provides instant interruption of the YouTube Shorts feed with full-screen ads that can only be dismissed via programmatic triggers. Ads seamlessly pause the feed and resume from the exact position when dismissed.

## Architecture

### Core Components

1. **Type Definitions** (`/lib/ad-types.ts`)
   - Ad interface with support for video, image, and HTML ads
   - TypeScript types for ad events and state management

2. **Event Bus** (`/lib/ad-event-bus.ts`)
   - Global event system using browser EventTarget API
   - Trigger methods accessible from anywhere in the app
   - Keyboard shortcuts for development (Ctrl+Shift+A / Ctrl+Shift+D)

3. **Ad Manager Hook** (`/lib/use-ad-manager.ts`)
   - React hook for ad state management
   - Handles ad show/dismiss logic
   - Auto-dismiss timer support
   - Scroll locking during ads

4. **Ad Overlay Component** (`/components/AdOverlay.tsx`)
   - Full-screen overlay (z-index: 9999)
   - Renders video, image, or HTML ads
   - Countdown timer display
   - Click-through support

5. **Socket Integration** (`/lib/socket-context.tsx`)
   - Backend-triggered ads via Socket.IO
   - Events: `showAd`, `dismissAd`

6. **Global Functions** (`/components/ad-system-init.tsx`)
   - `window.triggerAd()` and `window.dismissAd()` available globally
   - Initialized in app layout

## Triggering Ads

### Method 1: Browser Console / Global Functions

```javascript
// Trigger an ad with custom data
window.triggerAd({
  type: 'video',
  content: 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1',
  duration: 15000, // 15 seconds (optional auto-dismiss)
  title: 'My Ad',
  clickUrl: 'https://example.com',
  impressionId: 'ad-123'
});

// Trigger next ad in rotation (uses mock ads)
window.triggerAd();

// Dismiss current ad
window.dismissAd();
```

### Method 2: Socket Events (Backend Triggered)

**Backend (Python/FastAPI):**
```python
# Trigger ad from backend
await sio.emit('showAd', {
    'id': 'ad-001',
    'type': 'video',
    'content': 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1',
    'duration': 15000,
    'title': 'Special Offer',
    'clickUrl': 'https://example.com/offer'
})

# Dismiss ad from backend
await sio.emit('dismissAd')
```

**Backend (Node.js/TypeScript):**
```typescript
// Trigger ad from backend
io.emit('showAd', {
  id: 'ad-001',
  type: 'video',
  content: 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1',
  duration: 15000,
  title: 'Special Offer',
  clickUrl: 'https://example.com/offer'
});

// Dismiss ad from backend
io.emit('dismissAd');
```

### Method 3: Programmatic (From React Components)

```typescript
import { useAdManager } from '@/lib/use-ad-manager';

function MyComponent() {
  const { showAd, dismissAd, isAdShowing, currentAd } = useAdManager();

  const triggerVideoAd = () => {
    showAd({
      type: 'video',
      content: 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1',
      duration: 20000
    });
  };

  const triggerImageAd = () => {
    showAd({
      type: 'image',
      content: '/path/to/image.jpg',
      title: 'Special Offer',
      ctaText: 'Shop Now',
      clickUrl: 'https://example.com',
      duration: 10000
    });
  };

  return (
    <>
      <button onClick={triggerVideoAd}>Show Video Ad</button>
      <button onClick={triggerImageAd}>Show Image Ad</button>
      {isAdShowing && <button onClick={dismissAd}>Dismiss</button>}
    </>
  );
}
```

### Method 4: Keyboard Shortcuts (Dev Mode)

- **Ctrl+Shift+A** - Trigger test ad (next in rotation)
- **Ctrl+Shift+D** - Dismiss current ad

## Ad Types

### Video Ads

```typescript
{
  type: 'video',
  content: 'https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1',
  duration: 15000, // Auto-dismiss after 15 seconds
  clickUrl: 'https://example.com',
  impressionId: 'imp-001'
}
```

### Image Ads

```typescript
{
  type: 'image',
  content: '/path/to/image.jpg',
  title: 'Special Offer',
  ctaText: 'Shop Now',
  clickUrl: 'https://example.com',
  duration: 10000
}
```

### HTML Ads

```typescript
{
  type: 'html',
  content: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem;">
      <h1 style="font-size: 3rem; margin-bottom: 1rem;">Premium Membership</h1>
      <p style="font-size: 1.5rem;">Get 50% off!</p>
      <button style="background: white; color: #667eea; padding: 1rem 3rem; border: none; border-radius: 50px; font-size: 1.25rem; cursor: pointer;">
        Claim Offer
      </button>
    </div>
  `,
  duration: 12000,
  clickUrl: 'https://example.com/membership'
}
```

## Features

✅ **Instant interruption** - Ad appears immediately on trigger  
✅ **No user dismiss** - Only programmatic triggers can close ads  
✅ **Seamless resume** - Feed continues from exact paused position  
✅ **Multiple trigger sources** - Console, socket, programmatic, keyboard  
✅ **Type flexibility** - Video, image, or custom HTML ads  
✅ **Auto-dismiss** - Optional timer for automatic closure  
✅ **Scroll locking** - Feed frozen during ad display  
✅ **Video pause/resume** - Current video pauses and resumes properly  
✅ **Click-through tracking** - Track ad impressions and clicks  
✅ **Countdown timer** - Visual indicator for auto-dismiss  

## Development Controls

When running in development mode (`NODE_ENV=development`), the feed page includes:

1. **Three ad test buttons:**
   - 🎬 Video Ad - Trigger video ad example
   - 🖼️ Image Ad - Trigger image ad example
   - 🎨 HTML Ad - Trigger HTML ad example

2. **Keyboard shortcut reminder** at bottom of screen

3. **Console logging** for all ad events

## Testing

### Quick Test in Browser Console

```javascript
// Test video ad
window.triggerAd({
  type: 'video',
  content: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
  duration: 10000
});

// Wait 10 seconds or manually dismiss
window.dismissAd();
```

### Test from Backend

```bash
# In Python backend (with Socket.IO)
python -c "
import socketio
sio = socketio.Client()
sio.connect('http://localhost:3001')
sio.emit('showAd', {
    'type': 'video',
    'content': 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    'duration': 15000
})
"
```

## Integration Examples

### Trigger Ad After X Reps

```typescript
import { useAdManager } from '@/lib/use-ad-manager';

function WorkoutComponent() {
  const { showAd } = useAdManager();
  const [repCount, setRepCount] = useState(0);

  useEffect(() => {
    if (repCount > 0 && repCount % 10 === 0) {
      // Show ad every 10 reps
      showAd({
        type: 'video',
        content: 'https://www.youtube.com/embed/AD_VIDEO_ID?autoplay=1',
        duration: 15000
      });
    }
  }, [repCount, showAd]);

  // ... rest of component
}
```

### Trigger Ad During Rest Period

```typescript
function RestTimer() {
  const { showAd } = useAdManager();
  const [isResting, setIsResting] = useState(false);

  const startRest = () => {
    setIsResting(true);
    
    // Show ad at start of rest period
    showAd({
      type: 'image',
      content: '/rest-period-ad.jpg',
      duration: 30000 // 30 second rest
    });
  };

  return (
    <button onClick={startRest}>Start Rest</button>
  );
}
```

## Mock Ads

The system includes 5 mock ads for testing (`/lib/mock-ads.ts`):

1. Video ad - YouTube embed
2. Image ad - Static image with CTA
3. Video ad - Another YouTube embed
4. HTML ad - Custom gradient with button
5. Image ad - Community event

Use `getNextAd()` to rotate through mock ads or `getRandomAd()` for random selection.

## API Reference

### `useAdManager()` Hook

```typescript
const {
  currentAd,        // Current ad being shown (or null)
  isAdShowing,      // Boolean - is ad currently visible
  pausedVideoIndex, // Video index when ad was triggered
  showAd,          // Function to show an ad
  dismissAd,       // Function to dismiss current ad
  handleAdClick,   // Function to handle ad click
  clearPausedIndex // Function to clear paused video index
} = useAdManager();
```

### `adEventBus` Methods

```typescript
import { adEventBus } from '@/lib/ad-event-bus';

// Trigger ad
adEventBus.triggerAd(ad?);

// Dismiss ad
adEventBus.dismissAd();

// Subscribe to events
const unsubscribe = adEventBus.onShowAd((ad) => {
  console.log('Ad shown:', ad);
});
unsubscribe(); // Clean up
```

## Troubleshooting

### Ad not showing?

1. Check browser console for errors
2. Verify `AdSystemInit` is in layout.tsx
3. Check that `window.triggerAd` is defined in console
4. Ensure feed page has `useAdManager()` hook

### Ad not dismissing?

1. Check that `duration` property is set for auto-dismiss
2. Try manual dismiss: `window.dismissAd()`
3. Check browser console for event logs

### Video not resuming after ad?

1. Verify `pausedVideoIndex` is being tracked
2. Check `clearPausedIndex()` is called after resume
3. Inspect `useEffect` in feed page for resume logic

## Future Enhancements

- [ ] Ad analytics integration
- [ ] A/B testing support
- [ ] Ad frequency capping
- [ ] User targeting
- [ ] Ad preloading
- [ ] Viewability tracking
- [ ] Skip after X seconds option
- [ ] Native app ads (React Native)

## File Structure

```
frontend/
├── lib/
│   ├── ad-types.ts           # Type definitions
│   ├── ad-event-bus.ts       # Global event system
│   ├── use-ad-manager.ts     # Ad state hook
│   ├── mock-ads.ts           # Test ad data
│   └── socket-context.tsx    # Socket integration (updated)
├── components/
│   ├── AdOverlay.tsx         # Full-screen ad component
│   └── ad-system-init.tsx    # Global function setup
└── app/
    ├── layout.tsx            # Ad init (updated)
    └── feed/
        └── page.tsx          # Ad integration (updated)
```
