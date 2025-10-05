# AI Form Video Integration Guide

## Overview

Your AI form video generation system is now integrated into the Gym-Scroller app! Users can generate personalized form instruction videos for each exercise in their workouts using Google's Veo 2 AI model.

## How It Works

### Exercise-Based Generation
- **Automatic Integration**: Each exercise in your `ExerciseItem` component now has a video icon button
- **Exercise-Specific Prompts**: The system automatically generates detailed prompts based on the exercise name
- **Smart Caching**: Videos are cached to avoid regenerating the same exercise multiple times

### Components Created

#### 1. `ExerciseFormVideo` Component
- **Location**: `frontend/components/ExerciseFormVideo.tsx`
- **Purpose**: Displays AI-generated form videos for individual exercises
- **Features**:
  - Video generation with customizable settings (difficulty, cues, common mistakes)
  - Real-time status updates and polling
  - Video player with controls
  - Error handling and retry functionality

#### 2. `WorkoutFormVideos` Component
- **Location**: `frontend/components/WorkoutFormVideos.tsx`
- **Purpose**: Batch generate and manage form videos for entire workouts
- **Features**:
  - Progress tracking for multiple video generation
  - Bulk generation for all exercises in a workout
  - Status overview with individual exercise details

#### 3. Enhanced `ExerciseItem` Component
- **Location**: `frontend/components/ExerciseItem.tsx`
- **Enhancement**: Added video icon button that toggles the form video component
- **Integration**: Seamlessly embedded in existing exercise tracking interface

### Services and Hooks

#### 1. `ExerciseFormVideoService`
- **Location**: `frontend/lib/exercise-form-video-service.ts`
- **Purpose**: Handles API communication for video generation and retrieval
- **Features**:
  - Exercise-specific prompt generation
  - Batch operations for multiple exercises
  - Smart prompt customization based on exercise type

#### 2. `useExerciseFormVideo` Hook
- **Location**: `frontend/lib/use-exercise-form-video.ts`
- **Purpose**: React hook for managing video state and operations
- **Features**:
  - Automatic video loading
  - Status polling for processing videos
  - Error handling and retry logic

## Integration Steps

### 1. Backend Setup (Already Configured)
```typescript
// backend/src/index.ts - Form video routes added
app.use('/api/form-videos', formVideoRoutes);
```

### 2. Environment Setup
Add your Veo 2 API key to your backend environment:
```bash
# In backend/.env
VEO2_API_KEY=your-google-veo2-api-key-here
```

### 3. Using in Your App

#### Individual Exercise Form Videos
```tsx
// In any component where you want to show form videos
import { ExerciseFormVideo } from '@/components/ExerciseFormVideo';

<ExerciseFormVideo 
  exerciseName="Back Squat"
  exerciseId="1"
  onClose={() => setShowVideo(false)}
/>
```

#### Workout-Level Form Videos
```tsx
// For generating videos for entire workouts
import { WorkoutFormVideos } from '@/components/WorkoutFormVideos';

<WorkoutFormVideos 
  exerciseIds={['1', '2', '3']} // Array of exercise IDs
  workoutName="Push Day"
/>
```

#### Using the Hook Directly
```tsx
// For custom implementations
import { useExerciseFormVideo } from '@/lib/use-exercise-form-video';

const MyComponent = ({ exerciseId, exerciseName }) => {
  const { video, isGenerating, generateVideo, isCompleted } = useExerciseFormVideo(
    exerciseId, 
    exerciseName
  );
  
  return (
    <div>
      {isCompleted ? (
        <video src={video.videoUrl} controls />
      ) : (
        <button onClick={() => generateVideo()}>
          Generate Form Video
        </button>
      )}
    </div>
  );
};
```

## Exercise-Specific Features

### Smart Prompt Generation
The system automatically creates detailed prompts based on exercise type:

- **Compound Movements** (Squat, Bench, Deadlift): Focus on setup, bar path, and safety
- **Bodyweight Exercises** (Pull-ups, Push-ups): Emphasize body positioning and range of motion  
- **Accessory Movements** (Curls, Raises): Highlight muscle activation and form cues

### Difficulty Levels
- **Beginner**: Basic form, safety emphasis, slower movements
- **Intermediate**: Standard technique, normal pace
- **Advanced**: Performance optimization, competition-level execution

### Customization Options
- **Include Common Mistakes**: Shows what to avoid
- **Include Coaching Cues**: Provides verbal guidance
- **Multiple Camera Angles**: Front, side, and 45-degree views

## Current Integration Status

✅ **Backend Routes**: Form video API routes integrated into main server
✅ **Enhanced ExerciseItem**: Video button added to each exercise
✅ **Form Video Component**: Complete video generation and playback
✅ **Workout Videos**: Batch generation for multiple exercises
✅ **React Hooks**: Easy-to-use state management
✅ **Exercise Catalog**: All 20 exercises ready for video generation

## Next Steps

### 1. Get Veo 2 API Access
- Sign up for Google Cloud account
- Enable Veo 2 API
- Generate API key
- Add to environment variables

### 2. Test Integration
```bash
# Start your backend server
cd backend
npm start

# Start your frontend
cd frontend
npm run dev

# Test video generation:
# 1. Navigate to a workout
# 2. Click the video icon on any exercise
# 3. Click "Generate Form Video"
```

### 3. Deploy and Scale
- Deploy to production with environment variables
- Monitor API usage and costs
- Consider caching strategies for popular exercises

## User Experience Flow

1. **User starts workout** → Sees exercises with video icons
2. **Clicks video icon** → Form video component opens
3. **Generates video** → AI creates personalized instruction video
4. **Watches video** → Learns proper form before exercising
5. **Video cached** → Available for future workouts instantly

## Benefits

- **Personalized**: Videos tailored to specific exercises and difficulty levels
- **Educational**: Proper form instruction reduces injury risk
- **Convenient**: Generated on-demand within the workout interface
- **Comprehensive**: Covers setup, execution, and common mistakes
- **Scalable**: Works with any exercise in your catalog

Your AI form video system is now ready to help users learn proper exercise technique and improve their workout quality!