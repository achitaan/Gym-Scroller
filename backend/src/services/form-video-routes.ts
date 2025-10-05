/**
 * Form Video API Routes
 * Endpoints for generating and retrieving exercise form videos using Veo2
 */

import express, { Request, Response } from 'express';
import { formVideoService, Exercise, FormVideoOptions } from './form-video-service';
import { spawn } from 'child_process';
import * as path from 'path';

const router = express.Router();

/**
 * Call Python form video generator using the standalone Veo generator
 */
async function callPythonGenerator(exercise: any, options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'standalone_video_generator.py');
    const pythonProcess = spawn('python', [pythonScript], {
      cwd: path.join(__dirname, '..', '..'),
      env: { 
        ...process.env,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
      }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse Python output'));
        }
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });

    // Send exercise data to Python script
    const input = JSON.stringify({ exercise, options });
    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();
  });
}

/**
 * POST /api/form-video/generate
 * Generate a new form instruction video using Veo2
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { 
      exercise, 
      variation = 'standard', 
      duration = 30,
      includeCommonMistakes = true,
      includeCues = true,
      difficulty = 'intermediate'
    } = req.body;

    if (!exercise || !exercise.id || !exercise.name) {
      return res.status(400).json({
        error: 'Invalid exercise data. Required: id, name, muscleGroups, equipment',
      });
    }

    const options: FormVideoOptions = {
      variation,
      duration,
      includeCommonMistakes,
      includeCues,
      difficulty,
    };

    // Use Python service only (real Veo-3 generation)
    console.log('[FormVideoRoutes] Using Python service for real Veo-3 generation...');
    const result = await callPythonGenerator(exercise, options);
    console.log('[FormVideoRoutes] Python service completed');

    res.json({
      success: true,
      video: result,
    });
  } catch (error: any) {
    console.error('Error generating form video:', error);
    res.status(500).json({
      error: 'Failed to generate form video',
      message: error.message || 'Unknown error occurred',
    });
  }
});

/**
 * GET /api/form-video/:exerciseId
 * Get cached form video for an exercise
 */
router.get('/:exerciseId', async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const { 
      variation = 'standard',
      difficulty = 'intermediate'
    } = req.query;

    const options: FormVideoOptions = {
      variation: variation as string,
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
    };

    const video = await formVideoService.getVideo(exerciseId, options);

    if (video) {
      res.json({
        success: true,
        video,
        cached: true,
      });
    } else {
      res.status(404).json({
        error: 'Form video not found',
        message: 'Video needs to be generated first',
      });
    }
  } catch (error: any) {
    console.error('Error fetching form video:', error);
    res.status(500).json({
      error: 'Failed to fetch form video',
      message: error.message || 'Unknown error occurred',
    });
  }
});

/**
 * GET /api/form-video/status/:videoId
 * Check the status of a video generation job
 */
router.get('/status/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    
    const video = await formVideoService.checkVideoStatus(videoId);
    
    if (video) {
      res.json({
        success: true,
        video,
      });
    } else {
      res.status(404).json({
        error: 'Video not found',
        message: 'Video ID not found in cache',
      });
    }
  } catch (error: any) {
    console.error('Error checking video status:', error);
    res.status(500).json({
      error: 'Failed to check video status',
      message: error.message || 'Unknown error occurred',
    });
  }
});

/**
 * POST /api/form-video/batch-generate
 * Generate videos for multiple exercises
 */
router.post('/batch-generate', async (req: Request, res: Response) => {
  try {
    const { 
      exercises, 
      variation = 'standard',
      difficulty = 'intermediate',
      duration = 30 
    } = req.body;

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({
        error: 'Invalid exercises array',
      });
    }

    const options: FormVideoOptions = {
      variation,
      difficulty,
      duration,
    };

    const results = await formVideoService.generateBatchVideos(exercises, options);

    res.json({
      success: true,
      results,
      total: results.length,
      pending: results.filter(r => r.status === 'pending').length,
      processing: results.filter(r => r.status === 'processing').length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
    });
  } catch (error: any) {
    console.error('Error in batch generation:', error);
    res.status(500).json({
      error: 'Failed to batch generate videos',
      message: error.message || 'Unknown error occurred',
    });
  }
});

/**
 * GET /api/form-video/list
 * List all cached form videos
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const videos = formVideoService.listCachedVideos();

    res.json({
      success: true,
      count: videos.length,
      videos,
      summary: {
        pending: videos.filter(v => v.status === 'pending').length,
        processing: videos.filter(v => v.status === 'processing').length,
        completed: videos.filter(v => v.status === 'completed').length,
        failed: videos.filter(v => v.status === 'failed').length,
      }
    });
  } catch (error: any) {
    console.error('Error listing form videos:', error);
    res.status(500).json({
      error: 'Failed to list form videos',
      message: error.message || 'Unknown error occurred',
    });
  }
});

export default router;
