"""
Workout Video Generation Service
Generates form instruction videos based on current workout data
"""

import os
import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime

# Import the Veo API client
from .veo_api_client import VeoAPIClient

class WorkoutVideoService:
    """Service for generating workout form videos"""
    
    def __init__(self, api_key: str = None, cache_dir: str = "./video_cache"):
        self.veo_client = VeoAPIClient(api_key, cache_dir)
        
    async def generate_video_for_exercise(
        self, 
        exercise: Dict,
        variation: str = "standard"
    ) -> Dict:
        """
        Generate a form instruction video for a specific exercise
        
        Args:
            exercise: Exercise data with name, muscleGroups, equipment, etc.
            variation: Video variation (standard, slow-motion, multi-angle)
            
        Returns:
            Dict with video_url, status, metadata
        """
        return await self.veo_client.generate_video(exercise, variation)
    
    async def generate_videos_for_workout(
        self, 
        workout: Dict
    ) -> List[Dict]:
        """
        Generate videos for all exercises in a workout
        
        Args:
            workout: Workout data with exercises list
            
        Returns:
            List of video generation results
        """
        exercises = workout.get("exercises", [])
        results = []
        
        for exercise in exercises:
            result = await self.generate_video_for_exercise(exercise)
            results.append(result)
        
        return results
    
    async def generate_videos_for_exercises(
        self, 
        exercises: List[Dict]
    ) -> List[Dict]:
        """
        Generate videos for a list of exercises
        
        Args:
            exercises: List of exercise data
            
        Returns:
            List of video generation results
        """
        return await self.veo_client.batch_generate_videos(exercises)
    
    def get_video_for_exercise(self, exercise_id: str) -> Optional[Dict]:
        """
        Get cached video for an exercise
        
        Args:
            exercise_id: Exercise identifier
            
        Returns:
            Cached video data or None
        """
        return self.veo_client.get_video_by_exercise(exercise_id)
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return [self.veo_client.get_model_name()]


# Example usage with current workout data
if __name__ == "__main__":
    import asyncio
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    # Sample workout data (from your current system)
    sample_workout = {
        "id": "workout-today",
        "name": "Push Day",
        "date": datetime.now().isoformat(),
        "exercises": [
            {
                "id": "ex-1",
                "name": "Bench Press",
                "category": "chest",
                "muscleGroups": ["chest", "triceps", "shoulders"],
                "equipment": "barbell"
            },
            {
                "id": "ex-2",
                "name": "Overhead Press",
                "category": "shoulders",
                "muscleGroups": ["shoulders", "triceps"],
                "equipment": "barbell"
            },
            {
                "id": "ex-3",
                "name": "Incline Dumbbell Press",
                "category": "chest",
                "muscleGroups": ["chest", "triceps"],
                "equipment": "dumbbells"
            }
        ]
    }
    
    async def main():
        try:
            service = WorkoutVideoService()
            print(f"Available models: {service.get_available_models()}")
            
            # Generate videos for the workout
            print("Generating videos for workout exercises...")
            results = await service.generate_videos_for_workout(sample_workout)
            
            print("\nVideo generation results:")
            for i, result in enumerate(results):
                print(f"\nExercise {i+1}: {result.get('exercise', 'Unknown')}")
                print(f"Status: {result.get('status', 'Unknown')}")
                if result.get('status') == 'completed':
                    print(f"Video URL: {result.get('video_url', 'N/A')}")
                else:
                    print(f"Error: {result.get('error', 'Unknown error')}")
                    
        except Exception as e:
            print(f"Error: {e}")
    
    asyncio.run(main())

