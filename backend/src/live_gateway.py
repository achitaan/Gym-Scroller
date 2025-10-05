import asyncio
import socketio
from typing import Dict, List, Any
from datetime import datetime
import random
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from collections import deque
from calculation_service import CalculationService, RepEvent, RepMetrics, SetEnd, _trapz_integrate


class LiveGateway:
    """
    WebSocket gateway for live workout tracking using Socket.IO
    """

    def __init__(self, sio: socketio.AsyncServer, calculation_service: CalculationService):
        self.sio = sio
        self.calculation_service = calculation_service
        self.connected_clients: Dict[str, Any] = {}
        self.last_pong_times: Dict[str, datetime] = {}
        self.update_task: asyncio.Task = None
        self.stale_monitor_task: asyncio.Task = None
        self.health_broadcast_task: asyncio.Task = None

        # Real-time plotting data storage
        self.max_points = 500  # Keep last 500 points
        self.time_data = deque(maxlen=self.max_points)
        self.accel_data = deque(maxlen=self.max_points)
        self.velocity_data = deque(maxlen=self.max_points)
        self.position_data = deque(maxlen=self.max_points)
        self.start_time = None

        # Setup matplotlib for real-time plotting
        plt.ion()
        self.fig, self.axes = plt.subplots(3, 1, figsize=(12, 8))
        self.fig.suptitle('Real-Time Sensor Data')

        self.axes[0].set_ylabel('Acceleration (m/s²)')
        self.axes[0].grid(True)
        self.axes[1].set_ylabel('Velocity (m/s)')
        self.axes[1].grid(True)
        self.axes[2].set_ylabel('Position (m)')
        self.axes[2].set_xlabel('Time (s)')
        self.axes[2].grid(True)

        self.line_accel, = self.axes[0].plot([], [], 'r-', label='Acceleration')
        self.line_vel, = self.axes[1].plot([], [], 'g-', label='Velocity')
        self.line_pos, = self.axes[2].plot([], [], 'b-', label='Position')

        self.axes[0].legend()
        self.axes[1].legend()
        self.axes[2].legend()

        plt.tight_layout()

        self._setup_socket_handlers()

    def _setup_socket_handlers(self):
        """Setup Socket.IO event handlers"""

        @self.sio.event
        async def connect(sid, environ):
            # Parse query string for reconnection detection
            query_string = environ.get('QUERY_STRING', '')
            prev_sid = None
            is_reconnection = False

            # Simple query string parsing
            if 'prev_sid=' in query_string:
                params = query_string.split('&')
                for param in params:
                    if param.startswith('prev_sid='):
                        prev_sid = param.split('=')[1]
                        if prev_sid in self.connected_clients:
                            is_reconnection = True
                            print(f"🔄 Reconnection detected - previous sid: {prev_sid}")
                        break

            print(f"🟢 Client connected: {sid}")

            # Track connection state with detailed metadata
            self.connected_clients[sid] = {
                "connected_at": datetime.now(),
                "chunks_received": 0,
                "last_chunk_time": datetime.now(),
                "is_reconnection": is_reconnection,
                "prev_sid": prev_sid,
                "reconnection_count": 0,
                "errors": 0,
                "timeouts": 0,
            }

            # Send connection acknowledgment to client
            await self.sio.emit("connection_ack", {
                "status": "connected",
                "sid": sid,
                "is_reconnection": is_reconnection
            }, room=sid)
            print(f"✅ Connection acknowledged for {sid}")

        @self.sio.event
        async def disconnect(sid):
            if sid in self.connected_clients:
                # Calculate connection duration and stats
                client_info = self.connected_clients[sid]
                duration = (datetime.now() - client_info["connected_at"]).total_seconds()
                chunks = client_info["chunks_received"]

                # Detect graceful vs unexpected disconnects
                is_graceful = duration < 1
                disconnect_type = 'graceful' if is_graceful else 'unexpected'

                print(f"🔴 Client disconnected: {sid} ({disconnect_type})")
                print(f"   Duration: {duration:.1f}s | Chunks processed: {chunks}")

                # Clean up tracking data
                del self.connected_clients[sid]
                if sid in self.last_pong_times:
                    del self.last_pong_times[sid]
            else:
                print(f"🔴 Client disconnected: {sid} (no session data)")

        @self.sio.event
        async def heartbeat(sid, data):
            """
            Respond to client heartbeat to keep connection active.
            This ensures NAT mappings stay alive and connection health is verified.
            Heartbeat every 5 seconds keeps routers from timing out connections.
            """
            if sid in self.connected_clients:
                # Update last activity time
                self.connected_clients[sid]["last_chunk_time"] = datetime.now()
                self.last_pong_times[sid] = datetime.now()

                # Echo back with server timestamp for latency calculation
                await self.sio.emit("heartbeat_ack", {
                    "client_ts": data.get("timestamp"),
                    "server_ts": datetime.now().timestamp() * 1000,
                    "sid": sid
                }, room=sid)

        @self.sio.event
        async def startSet(sid, data):
            print(f"Set started by {sid}: {data}")
            # Reset plot data for new set
            self.reset_plot_data()

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

        @self.sio.event
        async def sensorData(sid, data):
            """Handle incoming state data from ESP8266 with timeout protection"""
            # Update connection tracking
            if sid in self.connected_clients:
                self.connected_clients[sid]["chunks_received"] += 1
                self.connected_clients[sid]["last_chunk_time"] = datetime.now()

            try:
                # Timeout protection: 2 seconds max for processing
                # This prevents slow processing from blocking the event loop
                await asyncio.wait_for(
                    self._process_sensor_chunk(sid, data),
                    timeout=2.0
                )
            except asyncio.TimeoutError:
                # Processing took too long - log error and notify client
                if sid in self.connected_clients:
                    self.connected_clients[sid]["timeouts"] += 1
                print(f"❌ Processing timeout for {sid} - chunk took >2s to process")
                await self.sio.emit("processing_error", {
                    "error": "timeout",
                    "code": "PROCESSING_TIMEOUT",
                    "message": "Sensor data processing exceeded 2s limit"
                }, room=sid)
            except Exception as e:
                # General error handling - catch all exceptions to prevent crashes
                if sid in self.connected_clients:
                    self.connected_clients[sid]["errors"] += 1
                print(f"❌ Error processing sensor data from {sid}: {str(e)}")
                await self.sio.emit("processing_error", {
                    "error": "processing_failed",
                    "code": "PROCESSING_ERROR",
                    "message": f"Failed to process sensor data: {str(e)}"
                }, room=sid)

        async def _process_sensor_chunk(sid: str, data):
            """Internal method to process state string with logging"""
            # Data is now a simple string: "failure", "concentric", "eccentric", or "waiting"
            print(f"[{sid}] State: {data}")
            # Broadcast state to all connected frontend clients
            await self.sio.emit("sensorData", data)

        # Make the helper function accessible
        self._process_sensor_chunk = _process_sensor_chunk

    def process_sensor_data(self, data: Dict[str, Any]):
        """Process incoming sensor data and update plots"""
        if 'accel' not in data:
            return

        # Initialize start time on first data point
        if self.start_time is None:
            self.start_time = datetime.now()

        # Calculate elapsed time
        current_time = (datetime.now() - self.start_time).total_seconds()

        # Extract acceleration magnitude (or use z-axis for vertical movement)
        accel = data['accel']['z']  # Using z-axis, change to x or y as needed
        # Or use magnitude: accel = np.sqrt(data['accel']['x']**2 + data['accel']['y']**2 + data['accel']['z']**2)

        # Store time and acceleration
        self.time_data.append(current_time)
        self.accel_data.append(accel)

        # Convert to numpy arrays for integration
        t = np.array(self.time_data)
        a = np.array(self.accel_data)

        # Calculate velocity using trapezoidal integration
        if len(t) > 1:
            v = _trapz_integrate(a, t)
            self.velocity_data.append(v[-1])

            # Calculate position by integrating velocity
            v_array = np.array(self.velocity_data)
            t_v = t[-len(v_array):]  # Match time array length
            x = _trapz_integrate(v_array, t_v)
            x = x - x[0]  # Start at 0
            self.position_data.append(x[-1])
        else:
            self.velocity_data.append(0)
            self.position_data.append(0)

        # Update plot
        self.update_plot()

    def update_plot(self):
        """Update the real-time plot with current data"""
        if len(self.time_data) == 0:
            return

        t = list(self.time_data)
        a = list(self.accel_data)
        v = list(self.velocity_data)
        x = list(self.position_data)

        # Update line data
        self.line_accel.set_data(t, a)
        self.line_vel.set_data(t, v)
        self.line_pos.set_data(t, x)

        # Auto-scale axes
        for ax in self.axes:
            ax.relim()
            ax.autoscale_view()

        # Redraw
        self.fig.canvas.draw()
        self.fig.canvas.flush_events()

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

    async def monitor_stale_connections(self):
        """
        Monitor and disconnect stale connections that haven't sent data recently.
        Runs every 30 seconds and disconnects clients inactive for >120 seconds.
        Also checks for heartbeat timeout (>60 seconds without heartbeat).
        """
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds

                now = datetime.now()
                stale_clients = []

                # Find stale connections (no data for 120+ seconds or no heartbeat for 60+ seconds)
                for sid, client_info in self.connected_clients.items():
                    inactive_duration = (now - client_info["last_chunk_time"]).total_seconds()
                    reason = None

                    # Check for data inactivity
                    if inactive_duration > 120:  # 2 minutes of inactivity
                        reason = "data_inactivity"
                        stale_clients.append((sid, inactive_duration, reason))
                    # Check for heartbeat timeout
                    elif sid in self.last_pong_times:
                        heartbeat_age = (now - self.last_pong_times[sid]).total_seconds()
                        if heartbeat_age > 60:  # 60 seconds without heartbeat
                            reason = "ping_timeout"
                            stale_clients.append((sid, heartbeat_age, reason))

                # Disconnect stale clients
                for sid, duration, reason in stale_clients:
                    if sid not in self.connected_clients:
                        continue

                    chunks = self.connected_clients[sid]["chunks_received"]
                    print(f"⚠️  Disconnecting stale client {sid} (reason: {reason})")
                    print(f"   Inactive for {duration:.1f}s | Chunks received: {chunks}")

                    # Notify client before disconnecting
                    await self.sio.emit("connection_timeout", {
                        "reason": reason,
                        "inactive_seconds": duration
                    }, room=sid)

                    # Disconnect the client
                    await self.sio.disconnect(sid)

            except asyncio.CancelledError:
                # Graceful shutdown
                print("🛑 Stale connection monitor stopped")
                break
            except Exception as e:
                print(f"❌ Error in stale connection monitor: {str(e)}")
                # Continue monitoring despite errors
                await asyncio.sleep(5)

    async def broadcast_health_status(self):
        """Broadcast server health status every 60 seconds"""
        while True:
            try:
                await asyncio.sleep(60)

                health = {
                    "status": "healthy",
                    "timestamp": datetime.now().isoformat(),
                    "connected_clients": len(self.connected_clients)
                }

                await self.sio.emit("server_health", health)

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"❌ Error broadcasting health: {str(e)}")

    def start_background_tasks(self):
        """Start background tasks (stale connection monitoring, health broadcast)"""
        # self.update_task = asyncio.create_task(self.start_mock_events())  # Disabled - using real ESP8266 data
        self.stale_monitor_task = asyncio.create_task(self.monitor_stale_connections())
        self.health_broadcast_task = asyncio.create_task(self.broadcast_health_status())
        print("✅ Background tasks started (stale connection monitor, health broadcast)")

    def reset_plot_data(self):
        """Reset all plot data (useful for starting a new set)"""
        self.time_data.clear()
        self.accel_data.clear()
        self.velocity_data.clear()
        self.position_data.clear()
        self.start_time = None

    async def cleanup(self):
        """Cleanup resources"""
        # Cancel mock events task
        if self.update_task:
            self.update_task.cancel()
            try:
                await self.update_task
            except asyncio.CancelledError:
                pass

        # Cancel stale connection monitor task
        if self.stale_monitor_task:
            self.stale_monitor_task.cancel()
            try:
                await self.stale_monitor_task
            except asyncio.CancelledError:
                pass

        # Cancel health broadcast task
        if self.health_broadcast_task:
            self.health_broadcast_task.cancel()
            try:
                await self.health_broadcast_task
            except asyncio.CancelledError:
                pass

        # Close matplotlib figure
        plt.close(self.fig)
        print("🧹 LiveGateway cleanup complete")
