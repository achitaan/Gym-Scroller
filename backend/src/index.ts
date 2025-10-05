import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { LiveGateway } from './services/live-gateway';
import { CalculationService } from './services/calculation-service';
import { ShortsAPI } from './services/shorts-api';
import formVideoRoutes from './services/form-video-routes';

dotenv.config();

// Debug API key loading
console.log('🔑 API Key Debug:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET');
console.log('VEO2_API_KEY:', process.env.VEO2_API_KEY ? 'SET' : 'NOT SET');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
// Serve cached/generated videos
import path from 'path';
app.use('/cache', express.static(path.resolve('./video_cache')));

// Services
const calculationService = new CalculationService();
const shortsAPI = new ShortsAPI();
const liveGateway = new LiveGateway(io, calculationService);

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Form video routes (removed duplicate - using /api/form-videos below)

app.get('/api/shorts/queue', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    const result = await shortsAPI.getCuratedQueue(count);
    res.json(result);
  } catch (error) {
    console.error('Error fetching shorts queue:', error);
    res.status(500).json({ error: 'Failed to fetch shorts queue' });
  }
});

app.get('/api/shorts/discover', async (req, res) => {
  try {
    const query = (req.query.q as string) || 'strength training';
    const maxResults = parseInt(req.query.max as string) || 10;
    const result = await shortsAPI.fetchFromYouTube(query, maxResults);
    res.json(result);
  } catch (error) {
    console.error('Error discovering shorts:', error);
    res.status(500).json({ error: 'Failed to discover shorts' });
  }
});

app.post('/api/history/aggregate', (req, res) => {
  const { exerciseId, programType, startDate, endDate } = req.body;
  // TODO: Implement history aggregation
  res.json({
    vlDistribution: [],
    speedAtLoad: [],
    trends: [],
  });
});

app.post('/api/ai/coach', (req, res) => {
  const { recentSets, context } = req.body;
  // TODO: Implement AI coaching tip
  res.json({
    tip: 'Focus on maintaining consistent bar speed throughout the set.',
  });
});

app.post('/api/ai/plan', (req, res) => {
  const { currentStats, goals, weeks } = req.body;
  // TODO: Implement AI plan generation
  res.json({
    plan: [],
  });
});

// Form video generation routes
app.use('/api/form-videos', formVideoRoutes);

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 WebSocket gateway ready`);
  console.log(`🎬 Shorts curation service ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
