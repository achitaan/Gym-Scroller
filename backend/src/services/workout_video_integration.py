"""
Complete Workout Video Integration Service
Integrates real Veo video generation with the existing workout system
"""

import os
import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv

# Import the real Veo generator
from .real_veo_generator import RealVeoGenerator

class WorkoutVideoIntegration:
    """Complete integration service for workout video generation"""
    
    def __init__(self, api_key: str = None, cache_dir: str = "./video_cache"):
        # Load environment variables
        load_dotenv()
        
        self.veo_generator = RealVeoGenerator(api_key, cache_dir)
        self.cache_dir = cache_dir
        
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
        return await self.veo_generator.generate_video(exercise, variation)
    
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
        
        print(f"[WorkoutVideoIntegration] Generating videos for {len(exercises)} exercises...")
        
        for i, exercise in enumerate(exercises):
            print(f"[WorkoutVideoIntegration] Processing exercise {i+1}/{len(exercises)}: {exercise.get('name')}")
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
        return await self.veo_generator.batch_generate_videos(exercises)
    
    def get_video_for_exercise(self, exercise_id: str) -> Optional[Dict]:
        """
        Get cached video for an exercise
        
        Args:
            exercise_id: Exercise identifier
            
        Returns:
            Cached video data or None
        """
        return self.veo_generator.get_video_by_exercise(exercise_id)
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return [self.veo_generator.get_model_name()]
    
    def get_workout_video_summary(self, workout: Dict) -> Dict:
        """
        Get a summary of all videos for a workout
        
        Args:
            workout: Workout data
            
        Returns:
            Summary with video counts and status
        """
        exercises = workout.get("exercises", [])
        total_exercises = len(exercises)
        videos_available = 0
        videos_generating = 0
        videos_error = 0
        
        for exercise in exercises:
            video_data = self.get_video_for_exercise(exercise.get("id", ""))
            if video_data:
                if video_data.get("status") == "completed":
                    videos_available += 1
                elif video_data.get("status") == "error":
                    videos_error += 1
                else:
                    videos_generating += 1
        
        return {
            "total_exercises": total_exercises,
            "videos_available": videos_available,
            "videos_generating": videos_generating,
            "videos_error": videos_error,
            "completion_percentage": (videos_available / total_exercises * 100) if total_exercises > 0 else 0
        }


# Example usage with current workout data
if __name__ == "__main__":
    import asyncio
    
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
            integration = WorkoutVideoIntegration()
            print(f"Available models: {integration.get_available_models()}")
            
            # Get current video summary
            summary = integration.get_workout_video_summary(sample_workout)
            print(f"\nCurrent video summary:")
            print(f"Total exercises: {summary['total_exercises']}")
            print(f"Videos available: {summary['videos_available']}")
            print(f"Videos generating: {summary['videos_generating']}")
            print(f"Videos with errors: {summary['videos_error']}")
            print(f"Completion: {summary['completion_percentage']:.1f}%")
            
            # Generate videos for the workout
            print(f"\nGenerating videos for workout exercises...")
            results = await integration.generate_videos_for_workout(sample_workout)
            
            print(f"\nVideo generation results:")
            for i, result in enumerate(results):
                print(f"\nExercise {i+1}: {result.get('exercise', 'Unknown')}")
                print(f"Status: {result.get('status', 'Unknown')}")
                if result.get('status') == 'completed':
                    print(f"Video URL: {result.get('video_url', 'N/A')}")
                    print(f"Duration: {result.get('duration', 'N/A')} seconds")
                    print(f"Model: {result.get('metadata', {}).get('model', 'N/A')}")
                    print(f"Real generation: {result.get('metadata', {}).get('real_generation', False)}")
                else:
                    print(f"Error: {result.get('error', 'Unknown error')}")
                    
        except Exception as e:
            print(f"Error: {e}")
    
    asyncio.run(main())

