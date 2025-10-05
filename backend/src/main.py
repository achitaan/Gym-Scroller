import os
import signal
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import socketio
from dotenv import load_dotenv
import uvicorn

from live_gateway import LiveGateway
from calculation_service import CalculationService
from shorts_api import ShortsAPI

# Load environment variables
load_dotenv()

# Create Socket.IO server with CORS configuration and aggressive keepalive settings
# Optimized for real-time IMU streaming from ESP8266 sensors
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",  # Allow all origins for development
    logger=True,
    engineio_logger=True,
    # Aggressive keepalive settings for real-time streaming
    ping_timeout=90,  # 90 seconds - handle mobile network delays and brief disconnections
    ping_interval=20,  # 20 seconds - frequent keepalives to detect dead connections quickly
    max_http_buffer_size=5 * 1024 * 1024,  # 5MB buffer for chunked IMU data
    compression_threshold=512,  # Compress messages > 512 bytes to reduce bandwidth
)

# Services (initialized after app creation)
calculation_service = None
shorts_api = None
live_gateway = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""
    global calculation_service, shorts_api, live_gateway

    # Startup
    calculation_service = CalculationService()
    shorts_api = ShortsAPI()
    live_gateway = LiveGateway(sio, calculation_service)

    # Start background tasks (mock events for demo)
    live_gateway.start_background_tasks()

    print("🚀 Server running")
    print("📊 WebSocket gateway ready")
    print("🎬 Shorts curation service ready")

    yield

    # Shutdown
    await live_gateway.cleanup()
    print("Server shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Gym Scroller Backend",
    description="Backend services for Gym Scroller strength training app",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, app)


# Pydantic models for request/response
class HistoryAggregateRequest(BaseModel):
    exerciseId: str
    programType: str
    startDate: str
    endDate: str


class AICoachRequest(BaseModel):
    recentSets: List[Any]
    context: Optional[str] = None


class AIPlanRequest(BaseModel):
    currentStats: dict
    goals: dict
    weeks: int


# REST API endpoints
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": int(os.times().elapsed * 1000)}


@app.get("/api/shorts/queue")
async def get_shorts_queue(count: int = Query(default=10, ge=1, le=50)):
    """Get curated shorts queue"""
    try:
        result = await shorts_api.get_curated_queue(count)
        return result.model_dump()
    except Exception as error:
        print(f"Error fetching shorts queue: {error}")
        raise HTTPException(status_code=500, detail="Failed to fetch shorts queue")


@app.get("/api/shorts/discover")
async def discover_shorts(
    q: str = Query(default="strength training"),
    max: int = Query(default=10, ge=1, le=50),
):
    """Discover shorts from YouTube"""
    try:
        result = await shorts_api.fetch_from_youtube(q, max)
        return result.model_dump()
    except Exception as error:
        print(f"Error discovering shorts: {error}")
        raise HTTPException(status_code=500, detail="Failed to discover shorts")


@app.post("/api/history/aggregate")
async def aggregate_history(request: HistoryAggregateRequest):
    """Aggregate workout history"""
    # TODO: Implement history aggregation
    return {
        "vlDistribution": [],
        "speedAtLoad": [],
        "trends": [],
    }


@app.post("/api/ai/coach")
async def ai_coach(request: AICoachRequest):
    """Get AI coaching tip"""
    # TODO: Implement AI coaching tip
    return {
        "tip": "Focus on maintaining consistent bar speed throughout the set.",
    }


@app.post("/api/ai/plan")
async def ai_plan(request: AIPlanRequest):
    """Generate AI training plan"""
    # TODO: Implement AI plan generation
    return {
        "plan": [],
    }


# Graceful shutdown handler
def shutdown_handler(signum, frame):
    print("SIGTERM received, closing server...")
    # Uvicorn will handle the actual shutdown


if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGTERM, shutdown_handler)

    # Get local IP address for display
    import socket

    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
    except Exception:
        local_ip = "unknown"

    # Run the server
    port = int(os.getenv("PORT", "8000"))  # Changed default port to 8000

    print("\n" + "=" * 50)
    print("🚀 Gym Scroller Backend Starting...")
    print("=" * 50)
    print(f"📍 Local access:   http://127.0.0.1:{port}")
    print(f"🌐 Network access: http://{local_ip}:{port}")
    print(f"🔌 ESP8266 should connect to: {local_ip}:{port}")
    print(f"💻 Frontend should use: http://{local_ip}:{port}")
    print("=" * 50 + "\n")

    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",  # Listen on all network interfaces (allows ESP8266 + Frontend connections)
        port=port,
        reload=True,
        log_level="info",
    )
