# AI Form Video Generation - Implementation Guide

## 🎯 What We've Created

A complete pipeline for generating AI-powered exercise form instruction videos using Google Veo 2.

## 📁 Files Created

1. **Backend Service** (`backend/src/services/form_video_generator.py`)
   - Python service for Veo 2 API integration
   - Video generation with structured prompts
   - Caching system for generated videos
   - Batch generation support

2. **API Routes** (`backend/src/services/form-video-routes.ts`)
   - `/api/form-video/generate` - Generate new video
   - `/api/form-video/:exerciseId` - Get cached video
   - `/api/form-video/batch-generate` - Batch generation
   - `/api/form-video/list` - List all videos

3. **Frontend Component** (`frontend/components/FormVideoPlayer.tsx`)
   - Video player with auto-generation
   - Loading states & error handling
   - Thumbnail preview
   - Generate on-demand button

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
# Backend Python dependencies
cd backend
pip install google-cloud-aiplatform  # When Veo 2 API is available

# Node.js already has everything needed
```

### 2. Get Veo 2 API Access

```bash
# Set up Google Cloud credentials
export VEO2_API_KEY="your-api-key-here"

# Or add to backend/.env
echo "VEO2_API_KEY=your-api-key" >> backend/.env
```

### 3. Add API Routes to Backend

Edit `backend/src/index.ts`:

```typescript
import formVideoRoutes from './services/form-video-routes';

// Add route
app.use('/api/form-video', formVideoRoutes);
```

### 4. Use in Frontend

Add to any exercise screen:

```tsx
import { FormVideoPlayer } from '@/components/FormVideoPlayer';

// In your component
<FormVideoPlayer
  exerciseId="back-squat"
  exerciseName="Back Squat"
  autoGenerate={true}
/>
```

## 💡 Integration Points

### Train Screen
Show form video before starting a set:
```tsx
// In train/page.tsx or PreSet component
<FormVideoPlayer 
  exerciseId={currentExercise.id}
  exerciseName={currentExercise.name}
  autoGenerate={true}
/>
```

### Exercise Catalog
Add form videos to exercise details:
```tsx
// In exercise details modal
<FormVideoPlayer 
  exerciseId={exercise.id}
  exerciseName={exercise.name}
/>
```

### Form Check Feature
Compare user's form with AI video:
```tsx
// Side-by-side comparison
<div className="grid grid-cols-2 gap-4">
  <FormVideoPlayer exerciseId={exercise.id} exerciseName="AI Form" />
  <UserVideoRecording />
</div>
```

## 🎨 Customization

### Custom Prompts
Edit `form_video_generator.py`:

```python
def generate_prompt(self, exercise: Dict) -> str:
    # Customize prompt structure
    # Add specific coaching cues
    # Adjust camera angles
    # Set tempo preferences
```

### Video Variations
Generate different versions:

```python
# Slow-motion version
await generator.generate_video(exercise, variation="slow-motion")

# Multi-angle version
await generator.generate_video(exercise, variation="multi-angle")

# Beginner-focused version
await generator.generate_video(exercise, variation="beginner")
```

## 📊 Cost Optimization

1. **Pre-generate popular exercises**
```bash
# Run batch generation for common exercises
python3 backend/src/services/form_video_generator.py batch-generate
```

2. **Cache videos permanently**
```python
# Set use_cache=True (default)
video = await generator.generate_video(exercise, use_cache=True)
```

3. **Use CDN for delivery**
- Upload generated videos to CDN
- Serve from edge locations
- Reduce bandwidth costs

## 🧪 Testing

```bash
# Test video generation
curl -X POST http://localhost:3001/api/form-video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "exercise": {
      "id": "back-squat",
      "name": "Back Squat",
      "muscleGroups": ["quadriceps", "glutes"]
    }
  }'

# Get cached video
curl http://localhost:3001/api/form-video/back-squat
```

## 🔮 Future Enhancements

1. **Personalized Videos**
   - User's equipment availability
   - Fitness level adaptations
   - Injury modifications

2. **Interactive Features**
   - Clickable form cues overlay
   - Pause at key positions
   - Compare with user's form

3. **Voice Instructions**
   - Add narration to videos
   - Multi-language support
   - Tempo countdown

## 📝 Notes

- Veo 2 API access required (currently in limited preview)
- Video generation takes 30-60 seconds per video
- Generated videos are cached indefinitely
- Recommend pre-generating for popular exercises

## 🎯 Next Steps

1. Get Veo 2 API access from Google
2. Add API routes to your backend
3. Test video generation
4. Integrate into exercise screens
5. Pre-generate popular exercises
6. Deploy & monitor usage

---

Your form video generation pipeline is ready! 🎉
