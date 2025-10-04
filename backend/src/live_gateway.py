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
        self.update_task: asyncio.Task = None

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
            """Handle incoming sensor data from ESP8266"""
            print(f"Sensor data from {sid}: {data}")
            # Process sensor data for plotting
            self.process_sensor_data(data)
            # Broadcast to all connected frontend clients
            await self.sio.emit("sensorData", data)

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

    def start_background_tasks(self):
        """Start background tasks (like mock events)"""
        self.update_task = asyncio.create_task(self.start_mock_events())

    def reset_plot_data(self):
        """Reset all plot data (useful for starting a new set)"""
        self.time_data.clear()
        self.accel_data.clear()
        self.velocity_data.clear()
        self.position_data.clear()
        self.start_time = None

    async def cleanup(self):
        """Cleanup resources"""
        if self.update_task:
            self.update_task.cancel()
            try:
                await self.update_task
            except asyncio.CancelledError:
                pass
        # Close matplotlib figure
        plt.close(self.fig)
