"""
Video Generation Service for Python Backend
Integrates Veo 3 video generation directly into the FastAPI backend
"""

import os
import json
import hashlib
import asyncio
import time
from datetime import datetime
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Google GenAI SDK
from google import genai
from google.genai import types

class VideoGenerationService:
    """Video generation service integrated with the Python backend"""
    
    def __init__(self, cache_dir: str = "./video_cache"):
        # Load environment variables
        load_dotenv()
        
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        
        if not self.api_key:
            raise ValueError("No API key provided. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.")
        
        # Initialize the GenAI client
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "veo-3.0-generate-001"
        
        print(f"[VideoGenerationService] Initialized with API key: {self.api_key[:10]}...")
        print(f"[VideoGenerationService] Using model: {self.model_name}")
        
    def generate_prompt(self, exercise: Dict) -> str:
        """Generate detailed prompt for video generation"""
        
        exercise_name = exercise.get("name", "")
        muscle_groups = exercise.get("muscleGroups", [])
        equipment = exercise.get("equipment", "bodyweight")
        category = exercise.get("category", "")
        
        prompt = prompt = f"""
Create a crisp, professional instructional video that teaches proper form for {exercise_name}.

GOAL
- Show the full RANGE OF MOTION with smooth, controlled tempo.
- Always maintain context from both FRONT and SIDE views.
- Overlay a thin RED PATH LINE that traces the main moving implement/joint across the entire rep.

SCENE & TALENT
- Professional gym; uncluttered background; good lighting with soft shadows.
- Fit athletic demonstrator in neutral, non-branded attire (no logos).
- Camera distance: waist-up to full body as needed; avoid extreme closeups.

DURATION & RHYTHM (≈8s total)
- 0–1s: Front angle static frame. Title card (small, bottom-left): "{exercise_name}".
- 1–6s: Execute 1–2 controlled reps (2–3s per rep). Keep full ROM clearly visible. Red path line tracks the moving part continuously.
- 6–8s: Cut to side angle for the final rep phase + lockout; hold 0.5s on end position.

CAMERA
- Multi-angle coverage: ~70% front, ~30% side.
- Static tripod look; no whip pans, no aggressive zooms, no fisheye.
- Framing ensures joints and implement are never cropped during ROM.

LIGHTING & LOOK
- Bright, even, professional gym lighting; high contrast between subject and background.
- Clean, modern aesthetic; colors natural and accurate.

ON-SCREEN GUIDES (subtle)
- Thin RED PATH LINE follows the target segment/implement throughout the rep.
- Optional minimalist callouts (small text, bottom-right) at key moments: "Start", "Midpoint", "Lockout".

KEY FORM POINTS TO VISUALIZE
- Starting position: neutral spine, braced posture, setup shown clearly.
- Execution: controlled concentric and eccentric; no bouncing; consistent tempo.
- Full range of motion: show bottom and top endpoints clearly.
- Breathing: subtle cue (inhale on lowering, exhale on exertion), no exaggerated audio.
- Common mistakes: briefly hint visually (do NOT perform them) via quick text labels like "Don’t round back", "Avoid knees caving".

TECH SPECS
- QUALITY: 1080p, 30fps, sharp focus.
- AUDIO: Gym ambience minimal; no loud music; focus on clarity of movement.
- COLOR: Natural skin tones; no heavy filters or color casts.

METADATA
- MUSCLE FOCUS: {', '.join(muscle_groups) if muscle_groups else 'Not specified'}
- EQUIPMENT: {equipment}
- CATEGORY: {category}
- STYLE: Cinematic, professional fitness instruction
- NEGATIVE: No shaky cam, no lens distortion, no clutter, no text blocks covering joints, no overexposed highlights.

OUTPUT
- A single ~8-second clip that clearly shows controlled movement and FULL ROM from front and side, with a thin red line tracing the motion path throughout.
"""

        return prompt.strip()
    
    def get_cache_key(self, exercise: Dict, variation: str = "standard") -> str:
        """Generate cache key for video"""
        content = f"{exercise.get('id', exercise.get('name', ''))}_{variation}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def generate_video(
        self, 
        exercise: Dict,
        variation: str = "standard",
        duration: int = 8,
        use_cache: bool = True
    ) -> Dict:
        """
        Generate form instruction video using real Veo API
        
        Args:
            exercise: Exercise details (name, muscleGroups, equipment, etc.)
            variation: Video variation (standard, slow-motion, multi-angle)
            duration: Video duration in seconds
            use_cache: Whether to use cached video if available
            
        Returns:
            Dict with video_url, status, metadata
        """
        
        cache_key = self.get_cache_key(exercise, variation)
        cache_path = os.path.join(self.cache_dir, f"{cache_key}.json")
        
        # Check cache first
        if use_cache and os.path.exists(cache_path):
            with open(cache_path, 'r') as f:
                cached_data = json.load(f)
                if cached_data.get("status") == "completed":
                    return cached_data
        
        # Generate new video
        prompt = self.generate_prompt(exercise)
        
        try:
            print(f"[VideoGenerationService] Starting video generation for {exercise.get('name')}")
            
            # Generate video using the correct Veo method
            operation = self.client.models.generate_videos(
                model=self.model_name,
                prompt=prompt,
            )
            
            print("[VideoGenerationService] Video generation started, polling for completion...")
            
            # Poll until done
            while not operation.done:
                print("Waiting for video generation to complete...")
                time.sleep(10)
                operation = self.client.operations.get(operation)
            
            print("[VideoGenerationService] Video generation completed")
            
            # Download the generated video
            generated_video = operation.response.generated_videos[0]
            video_file = self.client.files.download(file=generated_video.video)
            
            # Save the video file
            filename = f"veo_{cache_key}.mp4"
            video_path = os.path.join(self.cache_dir, filename)
            generated_video.video.save(video_path)
            
            print(f"[VideoGenerationService] Video saved to: {video_path}")
            
            # Create video data
            video_data = {
                "id": cache_key,
                "exerciseId": exercise.get("id"),
                "exerciseName": exercise.get("name"),
                "videoUrl": f"http://localhost:3000/cache/{filename}",
                "thumbnailUrl": None,
                "status": "completed",
                "variation": variation,
                "createdAt": datetime.utcnow().isoformat(),
                "completedAt": datetime.utcnow().isoformat(),
                "prompt": prompt,
                "metadata": {
                    "model": self.model_name,
                    "video_path": video_path,
                    "real_generation": True
                },
            }

            # Save metadata to cache
            with open(cache_path, "w") as f:
                json.dump(video_data, f, indent=2)

            print(f"[VideoGenerationService] Video generated successfully: {video_path}")
            return video_data
            
        except Exception as e:
            print(f"[VideoGenerationService] Error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "exercise": exercise.get("name"),
                "model": self.model_name
            }
    
    def get_video_by_exercise(self, exercise_id: str) -> Optional[Dict]:
        """Get cached video for an exercise"""
        
        cache_key = hashlib.md5(f"{exercise_id}_standard".encode()).hexdigest()
        cache_path = os.path.join(self.cache_dir, f"{cache_key}.json")
        
        if os.path.exists(cache_path):
            with open(cache_path, 'r') as f:
                cached_data = json.load(f)
                # Convert old format to new format for frontend compatibility
                return self._convert_to_frontend_format(cached_data, exercise_id)
        
        return None
    
    def _convert_to_frontend_format(self, cached_data: Dict, exercise_id: str) -> Dict:
        """Convert cached video data to frontend format"""
        
        # If already in new format, return as-is
        if "videoUrl" in cached_data:
            return cached_data
        
        # Convert old format to new format
        return {
            "id": cached_data.get("video_id", ""),
            "exerciseId": exercise_id,
            "exerciseName": cached_data.get("exercise", ""),
            "videoUrl": cached_data.get("video_url"),
            "thumbnailUrl": cached_data.get("thumbnail_url"),
            "status": cached_data.get("status", "completed"),
            "variation": cached_data.get("metadata", {}).get("variation", "standard"),
            "createdAt": cached_data.get("generated_at", ""),
            "completedAt": cached_data.get("generated_at", ""),
            "prompt": cached_data.get("prompt", ""),
            "metadata": cached_data.get("metadata", {})
        }

    def get_model_name(self) -> str:
        """Get the model being used"""
        return self.model_name


# Global instance
video_service = VideoGenerationService()
