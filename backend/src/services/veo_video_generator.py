"""
Working Veo Video Generation Service using Google Gemini API
Generates exercise form instruction videos using Veo 3 Fast model
"""

import os
import json
import hashlib
import asyncio
import time
from typing import Dict, List, Optional
from datetime import datetime

# Google Generative AI SDK
import google.generativeai as genai

class VeoVideoGenerator:
    """Generate exercise form instruction videos using Google Gemini API with Veo models"""
    
    def __init__(self, api_key: str = None, cache_dir: str = "./video_cache"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        
        if not self.api_key:
            raise ValueError("No API key provided. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.")
        
        # Configure the API
        genai.configure(api_key=self.api_key)
        print(f"[VeoVideoGenerator] Initialized with API key: {self.api_key[:10]}...")
        
        # Use Veo 3 Fast model
        self.model_name = "veo-3.0-fast"
        print(f"[VeoVideoGenerator] Using model: {self.model_name}")
        
    def generate_prompt(self, exercise: Dict) -> str:
        """Generate detailed prompt for video generation"""
        
        exercise_name = exercise.get("name", "")
        muscle_groups = exercise.get("muscleGroups", [])
        equipment = exercise.get("equipment", "bodyweight")
        category = exercise.get("category", "")
        
        prompt = f"""
Create a high-quality instructional video demonstrating proper form for {exercise_name}.

REQUIREMENTS:
- Professional gym setting with good lighting
- Fit athletic person demonstrating the exercise
- Clean, modern aesthetic
- Clear view of the movement from front and side angles
- 8-second duration showing full range of motion
- Smooth, controlled movement
- Use a thin RED PATH LINE that traces the main movement entire rep (BAR PATH).
- Make sure if it is normal bench press, they are flat on the bench, incline bench press, they are at the incline angle, etc.

KEY FORM POINTS:
- Starting position with proper posture
- Movement execution with controlled tempo
- Full range of motion
- Breathing pattern
- Common mistakes to avoid

MUSCLE FOCUS: {', '.join(muscle_groups) if muscle_groups else 'Not specified'}
EQUIPMENT: {equipment}
CATEGORY: {category}

STYLE: Cinematic, professional fitness instruction video
CAMERA: Multi-angle view (front 70%, side 30%)
LIGHTING: Bright, professional gym lighting
QUALITY: 1080p resolution, 30fps
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
        duration: int = 12,  # Veo 3 Fast generates 8-second videos
        use_cache: bool = True,
        includeCommonMistakes: bool = True,
        includeCues: bool = True,
        difficulty: str = "intermediate"
    ) -> Dict:
        """
        Generate form instruction video using Veo 3 Fast
        
        Args:
            exercise: Exercise details (name, muscleGroups, equipment, etc.)
            variation: Video variation (standard, slow-motion, multi-angle)
            duration: Video duration in seconds (Veo 3 Fast is 8 seconds)
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
            print(f"[VeoVideoGenerator] Starting video generation for {exercise.get('name')}")
            
            # Use the Veo model with generate_videos method
            model = genai.GenerativeModel(model_name=self.model_name)
            
            # The GenAI SDK is synchronous; run it in a thread to avoid blocking
            loop = asyncio.get_running_loop()

            def _run_generation():
                print(f"[VeoVideoGenerator] Calling {self.model_name} API...")
                
                # Generate video using the correct Veo method
                operation = model.generate_videos(prompt=prompt)
                
                print("[VeoVideoGenerator] Video generation started, polling for completion...")
                
                # Poll until done
                while not operation.done:
                    time.sleep(10)  # Wait 10 seconds between polls
                    operation = model.get_operation(operation.name)
                    print("[VeoVideoGenerator] Still processing...")
                
                print("[VeoVideoGenerator] Video generation completed")
                
                # Get the video URL from the response
                if hasattr(operation, 'response') and operation.response:
                    video_url = operation.response.get('video', {}).get('url')
                    return video_url, operation.response
                else:
                    raise RuntimeError("No video URL in response")
                
            video_url, response_data = await loop.run_in_executor(None, _run_generation)
            
            # Create video data
            video_data = {
                "video_id": cache_key,
                "video_url": video_url,
                "thumbnail_url": None,
                "status": "completed",
                "exercise": exercise.get("name"),
                "duration": duration,
                "generated_at": datetime.utcnow().isoformat(),
                "prompt": prompt,
                "metadata": {
                    "variation": variation,
                    "model": self.model_name,
                    "response_data": response_data
                },
            }

            # Save metadata to cache
            with open(cache_path, "w") as f:
                json.dump(video_data, f, indent=2)

            print(f"[VeoVideoGenerator] Video generated successfully: {video_url}")
            return video_data
            
        except Exception as e:
            print(f"[VeoVideoGenerator] Error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "exercise": exercise.get("name"),
                "model": self.model_name
            }
    
    async def batch_generate_videos(
        self, 
        exercises: List[Dict],
        variations: List[str] = ["standard"]
    ) -> List[Dict]:
        """Generate videos for multiple exercises"""
        
        results = []
        for exercise in exercises:
            for variation in variations:
                result = await self.generate_video(exercise, variation)
                results.append(result)
        
        return results
    
    def get_video_by_exercise(self, exercise_id: str) -> Optional[Dict]:
        """Get cached video for an exercise"""
        
        cache_key = hashlib.md5(f"{exercise_id}_standard".encode()).hexdigest()
        cache_path = os.path.join(self.cache_dir, f"{cache_key}.json")
        
        if os.path.exists(cache_path):
            with open(cache_path, 'r') as f:
                return json.load(f)
        
        return None

    def get_model_name(self) -> str:
        """Get the model being used"""
        return self.model_name


# Example usage and test
if __name__ == "__main__":
    import asyncio
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    # Test with a sample exercise from the workout data
    sample_exercise = {
        "id": "bench-press",
        "name": "Bench Press",
        "muscleGroups": ["chest", "triceps", "shoulders"],
        "equipment": "barbell",
        "category": "chest"
    }
    
    async def main():
        try:
            generator = VeoVideoGenerator()
            print(f"Using model: {generator.get_model_name()}")
            
            # Generate video
            result = await generator.generate_video(sample_exercise)
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(f"Error: {e}")
    
    asyncio.run(main())

