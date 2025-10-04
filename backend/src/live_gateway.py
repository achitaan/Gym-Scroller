import asyncio
import socketio
from typing import Dict, List, Any
from datetime import datetime
import random
from calculation_service import CalculationService, RepEvent, RepMetrics, SetEnd


class LiveGateway:
    """
    WebSocket gateway for live workout tracking using Socket.IO
    """

    def __init__(self, sio: socketio.AsyncServer, calculation_service: CalculationService):
        self.sio = sio
        self.calculation_service = calculation_service
        self.connected_clients: Dict[str, Any] = {}
        self.update_task: asyncio.Task = None
        self._setup_socket_handlers()

    def _setup_socket_handlers(self):
        """Setup Socket.IO event handlers"""

        @self.sio.event
        async def connect(sid, environ):
            print(f"Client connected: {sid}")
            self.connected_clients[sid] = {"connected_at": datetime.now()}

        @self.sio.event
        async def disconnect(sid):
            print(f"Client disconnected: {sid}")
            if sid in self.connected_clients:
                del self.connected_clients[sid]

        @self.sio.event
        async def startSet(sid, data):
            print(f"Set started by {sid}: {data}")

        @self.sio.event
        async def endSet(sid, data):
            print(f"Set ended by {sid}: {data}")
            reps = data.get("reps", [])
            # Convert dict reps to RepEvent objects if needed
            rep_events = []
            for rep in reps:
                if isinstance(rep, dict):
                    rep_events.append(
                        RepEvent(
                            id=rep.get("id", ""),
                            valid=rep.get("valid", True),
                            metrics=RepMetrics(
                                tut=rep.get("metrics", {}).get("tut", 0),
                                speed=rep.get("metrics", {}).get("speed", 0),
                                vl=rep.get("metrics", {}).get("vl", 0),
                                rom_hit=rep.get("metrics", {}).get("romHit", False),
                            ),
                            ts=rep.get("ts", 0),
                        )
                    )
                else:
                    rep_events.append(rep)

            summary = self.calculation_service.calculate_set_summary(rep_events)
            await self.broadcast_set_end(summary)

    async def broadcast_rep(self, rep: Dict[str, Any]):
        """Broadcast rep event to all connected clients"""
        await self.sio.emit("rep", rep)

    async def broadcast_set_update(self, update: Dict[str, Any]):
        """Broadcast set update to all connected clients"""
        await self.sio.emit("setUpdate", update)

    async def broadcast_set_end(self, summary: SetEnd):
        """Broadcast set end to all connected clients"""
        await self.sio.emit(
            "setEnd",
            {
                "summary": {
                    "reps": summary.summary.reps,
                    "tut": summary.summary.tut,
                    "avgSpeed": summary.summary.avg_speed,
                    "vl": summary.summary.vl,
                    "romHitRate": summary.summary.rom_hit_rate,
                    "romVariability": summary.summary.rom_variability,
                },
                "tip": summary.tip,
            },
        )

    async def broadcast_music_cue(self, action: str):
        """Broadcast music cue (duck or restore)"""
        await self.sio.emit("musicCue", {"action": action})

    async def broadcast_shorts_queue(self, queue: List[str]):
        """Broadcast shorts queue"""
        await self.sio.emit("shorts", {"queue": queue})

    async def start_mock_events(self):
        """Mock events for demo (remove in production)"""
        await asyncio.sleep(3)  # Wait 3 seconds before starting
        rep_count = 0
        set_active = True

        print("Mock set started")

        while True:
            if not set_active:
                await asyncio.sleep(60)  # Wait 60 seconds before restarting
                set_active = True
                rep_count = 0
                print("Mock set restarted")
                continue

            await asyncio.sleep(3)  # Simulate a rep every 3 seconds

            # Simulate a rep every iteration with 60% probability
            if random.random() > 0.4:
                rep_count += 1

                mock_rep = {
                    "id": f"rep-{rep_count}",
                    "valid": random.random() > 0.2,  # 80% valid
                    "metrics": {
                        "tut": random.uniform(2, 4),  # 2-4 seconds
                        "speed": random.uniform(0.3, 0.6),  # 0.3-0.6 m/s
                        "vl": rep_count * 3 + random.uniform(0, 5),  # Increasing VL
                        "romHit": random.random() > 0.1,  # 90% ROM hit
                    },
                    "ts": int(datetime.now().timestamp() * 1000),
                }

                await self.broadcast_rep(mock_rep)

                # Broadcast set update
                mock_update = {
                    "repsCompleted": rep_count,
                    "avgSpeed": 0.45 - rep_count * 0.02,
                    "vl": rep_count * 3,
                    "romHitRate": 95 - rep_count,
                    "rir": max(0, 5 - rep_count),
                    "ts": int(datetime.now().timestamp() * 1000),
                }

                await self.broadcast_set_update(mock_update)

                # End set after 8 reps
                if rep_count >= 8:
                    set_active = False

                    mock_summary = SetEnd(
                        summary=type(
                            "Summary",
                            (),
                            {
                                "reps": rep_count,
                                "tut": rep_count * 3.5,
                                "avg_speed": 0.42,
                                "vl": 18.0,
                                "rom_hit_rate": 92.0,
                                "rom_variability": 2.3,
                            },
                        )(),
                        tip="Great set! Your velocity stayed consistent. Consider +5lb next time.",
                    )

                    await self.broadcast_set_end(mock_summary)

    def start_background_tasks(self):
        """Start background tasks (like mock events)"""
        self.update_task = asyncio.create_task(self.start_mock_events())

    async def cleanup(self):
        """Cleanup resources"""
        if self.update_task:
            self.update_task.cancel()
            try:
                await self.update_task
            except asyncio.CancelledError:
                pass
