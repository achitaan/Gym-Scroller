"""
End-to-end tester for live_gateway + calculation_service.

Streams fake IMU (50 Hz), auto-segments reps with CalculationService,
AND for EACH REP opens TWO graphs:
  1) Time-domain: acceleration (red) and velocity (blue) for that rep segment.
  2) Normalized comparison (peak-aligned): reference, aligned user velocity, and error (user − ref).

Now includes ROM% and PoSR/effort label in the per-rep title.
Also keeps the live 2×2 dashboard and sends events to the Socket.IO server.
"""

import asyncio
import socketio
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
import random
import threading
from typing import List, Dict, Any
from collections import deque

from calculation_service import CalculationService, RepEvent


# ---------------- Simulator ----------------

class AccelerometerSimulator:
    """Simulates realistic accelerometer data for a squat movement"""

    def __init__(self, sampling_rate: int = 50):
        self.sampling_rate = sampling_rate
        self.dt = 1.0 / sampling_rate
        self.t = 0.0

    def _rep_accel(self, t: float, q: float = 1.0) -> float:
        # ~3.5 s rep at top quality; gets slower with fatigue
        rep_T = 3.5 / q
        phase = (t % rep_T) / rep_T
        if phase < 0.4:               # descent
            a = -9.8 * np.sin(phase * np.pi / 0.4) * q
        elif phase < 0.5:             # bottom pause
            a = -2.0 + random.gauss(0, 0.5)
        elif phase < 0.9:             # ascent
            a = 12.0 * np.sin((phase - 0.5) * np.pi / 0.4) * q
        else:                         # top settle
            a = 2.0 * (1 - (phase - 0.9) / 0.1)
        return a + random.gauss(0, 0.3)

    def next_sample(self, fatigue: float = 0.0) -> Dict[str, float]:
        q = 1.0 - 0.5 * fatigue
        az = self._rep_accel(self.t, q)
        sample = {
            "ax": random.gauss(0, 0.05),
            "ay": random.gauss(0, 0.05),
            "az": az,
            "t": self.t + self.dt,
        }
        self.t += self.dt
        return sample


# ---------------- Tester ----------------

class LiveGatewayTester:
    def __init__(self, server_url: str = "http://localhost:3001"):
        self.server_url = server_url
        self.sio = socketio.AsyncClient()
        self.calc = CalculationService()
        self.sim = AccelerometerSimulator(sampling_rate=50)

        # live graphs (last 20 s = 1000 samples)
        self.timestamps = deque(maxlen=1000)
        self.vel_proxy = deque(maxlen=1000)   # simple proxy for panel 1
        self.acc_z = deque(maxlen=1000)

        # continuous stream buffers for segmentation
        self.stream_ax: List[float] = []
        self.stream_ay: List[float] = []
        self.stream_az: List[float] = []
        self.stream_t: List[float] = []
        self.last_seg_count = 0

        # rep bookkeeping
        self.rep_count = 0
        self.completed_reps: List[Dict[str, Any]] = []
        self.completed_events: List[RepEvent] = []

        # set control
        self.set_duration = 20.0
        self.set_start = None
        self.set_summary = None
        self.is_running = False

        # normalized overlay state for live dashboard
        self.last_norm_plot = None
        self.last_profile_accuracy = None

        # plotting
        plt.ion()
        self.fig, self.axes = plt.subplots(2, 2, figsize=(14, 10))
        self.fig.suptitle("Live Gateway Test – Real-Time + Normalized (Peak-Aligned)", fontsize=16)
        plt.show(block=False)
        self.plot_thread = None
        self.plot_update_interval = 0.1

        self._setup_socket_handlers()

    # ---- Socket handlers ----
    def _setup_socket_handlers(self):
        @self.sio.event
        async def connect():
            print(f"✓ Connected to {self.server_url}")

        @self.sio.event
        async def disconnect():
            print("✗ Disconnected from server")

        @self.sio.event
        async def rep(data):
            print(f"Rep echoed by server: {data['id']} (valid={data['valid']})")

        @self.sio.event
        async def setUpdate(data):
            print(f"Set update: {data['repsCompleted']} reps  |  VL {data['vl']:.1f}%  |  RIR {data['rir']}")

        @self.sio.event
        async def setEnd(data):
            self.set_summary = data
            s = data['summary']
            print("\n" + "="*60)
            print("SET COMPLETE (server)")
            print("="*60)
            print(f"Reps: {s['reps']} | TUT: {s['tut']:.1f}s | Avg v: {s['avgSpeed']:.2f} m/s | VL: {s['vl']:.1f}%")
            print(f"ROM hits: {s['romHitRate']:.1f}% | ROM Var: {s['romVariability']:.1f} cm")
            print("Tip:", data['tip'])
            print("="*60 + "\n")

            # Local cross-check using CalculationService
            if self.completed_events:
                local = self.calc.calculate_set_summary(self.completed_events)
                ls = local.summary
                print("[Local] Reps:", ls.reps,
                      "| TUT:", round(ls.tut, 2),
                      "| AvgSpeed:", round(ls.avg_speed, 2),
                      "| VL:", round(ls.vl, 1),
                      "| ROM hit:", round(ls.rom_hit_rate, 1))
                accs = [ev.extras["profile_accuracy"] for ev in self.completed_events if ev.extras and "profile_accuracy" in ev.extras]
                if accs:
                    print("[Local] Mean profile match:", round(float(np.mean(accs)), 1), "%")

    # ---- Connect ----
    async def _connect(self) -> bool:
        try:
            await self.sio.connect(self.server_url)
            await asyncio.sleep(0.5)
            return True
        except Exception as e:
            print("Failed to connect:", e)
            return False

    # ---- Streaming loop ----
    async def _stream(self):
        self.set_start = datetime.now()
        elapsed = 0.0
        fs = self.sim.sampling_rate
        self.is_running = True
        self._start_plot_thread()

        await self.sio.emit("startSet", {"exercise": "Squat", "timestamp": int(datetime.now().timestamp() * 1000)})
        print(f"\nStreaming 50 Hz IMU for {self.set_duration:.0f}s...\n")

        while elapsed < self.set_duration:
            fatigue = (elapsed / self.set_duration) * 0.7
            s = self.sim.next_sample(fatigue)
            ax, ay, az, t = s["ax"], s["ay"], s["az"], s["t"]

            # live graphs
            self.timestamps.append(elapsed)
            self.vel_proxy.append(abs(az) * (1.0 / fs) * 0.1)
            self.acc_z.append(az)

            # add to continuous buffers
            self.stream_ax.append(ax); self.stream_ay.append(ay); self.stream_az.append(az); self.stream_t.append(t)

            # every ~0.2s, try to segment reps
            if len(self.stream_t) % 10 == 0:
                reps = self.calc.segment_reps_from_stream({
                    "ax": self.stream_ax, "ay": self.stream_ay, "az": self.stream_az,
                    "t": self.stream_t, "fs": fs, "lift": "squat"
                })
                if len(reps) > self.last_seg_count:
                    new = reps[self.last_seg_count:]
                    for ev in new:
                        await self._emit_rep(ev)
                        self.completed_events.append(ev)
                        # keep latest overlay for dashboard
                        if ev.extras and "norm_plot" in ev.extras:
                            self.last_norm_plot = ev.extras["norm_plot"]
                            self.last_profile_accuracy = ev.extras.get("profile_accuracy", None)
                        # open per-rep windows
                        self._show_rep_windows(ev)
                    self.last_seg_count = len(reps)

            await asyncio.sleep(1.0 / fs)
            elapsed = (datetime.now() - self.set_start).total_seconds()

        await self._end_set()
        self.is_running = False

    async def _emit_rep(self, ev: RepEvent):
        self.rep_count += 1
        rep_dict = {
            "id": f"rep-{self.rep_count}",
            "valid": ev.valid,
            "metrics": {
                "tut": round(ev.metrics.tut, 2),
                "speed": round(ev.metrics.speed, 3),
                "vl": 0.0,
                "romHit": ev.metrics.rom_hit,
            },
            "ts": ev.ts
        }
        self.completed_reps.append(rep_dict)
        await self.sio.emit("rep", rep_dict)

    async def _end_set(self):
        await self.sio.emit("endSet", {
            "reps": self.completed_reps,
            "timestamp": int(datetime.now().timestamp() * 1000)
        })
        await asyncio.sleep(2.0)

    # ---- Per-rep figures ----
    def _show_rep_windows(self, ev: RepEvent):
        """Open two figures per rep:
           (A) time-domain acc (red) + vel (blue)
           (B) normalized ref vs aligned user and error (user − ref) with ROM% & label
        """
        if not ev.extras:
            return

        # A) Time-domain
        raw = ev.extras.get("raw_plot", None)
        if raw:
            t_raw = np.array(raw["t_raw"])
            a_raw = np.array(raw["acc_raw"])
            v_raw = np.array(raw["vel_raw"])

            figA = plt.figure()
            plt.plot(t_raw, a_raw, "r-", linewidth=1.2, label="Acceleration")
            plt.plot(t_raw, v_raw, "b-", linewidth=1.6, label="Velocity")
            plt.title(f"Rep {self.rep_count}: Accel (red) & Vel (blue)")
            plt.xlabel("Time (s)"); plt.ylabel("Signal")
            plt.grid(True, alpha=0.3); plt.legend(loc="upper right")
            figA.canvas.manager.set_window_title(f"Rep {self.rep_count} – Time-Domain")

        # B) Normalized comparison (peak-aligned)
        norm = ev.extras.get("norm_plot", None)
        eff = ev.extras.get("effort", {})
        if norm:
            ut = np.array(norm["user_t"]); uv = np.array(norm["user_v"])
            rt = np.array(norm["ref_t"]);  rv = np.array(norm["ref_v"])
            diff = np.array(norm["diff"])
            align = norm.get("alignment", {})
            rom_pct = eff.get("rom_pct", None)
            label = eff.get("label", "")

            figB = plt.figure()
            plt.plot(rt, rv, linestyle="--", linewidth=1.8, label="Reference")
            plt.plot(ut, uv, "b-", linewidth=1.8, label="Your velocity (aligned)")
            plt.plot(ut, diff, linestyle=":", linewidth=1.6, label="Error (user − ref)")
            plt.axhline(0, linestyle="--", linewidth=0.8)
            acc = ev.extras.get("profile_accuracy", None)
            subtitle = f"Match {acc:.0f}%" if acc is not None else ""
            rom_text = f" | ROM {rom_pct*100:.0f}%" if rom_pct is not None else ""
            mode = align.get("mode", "aligned")
            plt.title(f"Rep {self.rep_count}: Normalized ({mode}) [{label}]{rom_text} {subtitle}")
            plt.xlabel("Concentric time (0–1)"); plt.ylabel("Normalized value / Error")
            plt.grid(True, alpha=0.3); plt.legend(loc="upper right")
            figB.canvas.manager.set_window_title(f"Rep {self.rep_count} – Normalized & Error")

        plt.pause(0.001)

    # ---- Live dashboard plotting ----
    def _start_plot_thread(self):
        def loop():
            while self.is_running or not self.set_summary:
                try:
                    self._update_plots()
                    plt.pause(self.plot_update_interval)
                except Exception as e:
                    print("Plot error:", e)
                    break
        self.plot_thread = threading.Thread(target=loop, daemon=True)
        self.plot_thread.start()

    def _update_plots(self):
        if not self.timestamps:
            return
        times = np.array(self.timestamps)
        vels = np.array(self.vel_proxy)
        accs = np.array(self.acc_z)

        # 1) Velocity proxy
        ax1 = self.axes[0, 0]; ax1.clear()
        ax1.plot(times, vels, linewidth=1.5, label="Velocity (proxy)")
        ax1.set_xlabel("Time (s)"); ax1.set_ylabel("Velocity (m/s)")
        ax1.set_title("Real-time Bar Velocity")
        ax1.grid(True, alpha=0.3); ax1.legend(loc="upper right")

        # 2) Acceleration
        ax2 = self.axes[0, 1]; ax2.clear()
        ax2.plot(times, accs, linewidth=1.0, alpha=0.85, label="Acceleration (az)")
        ax2.axhline(0, linestyle="--", linewidth=0.8)
        ax2.set_xlabel("Time (s)"); ax2.set_ylabel("Acceleration (m/s²)")
        ax2.set_title("Real-time Accelerometer Data")
        ax2.grid(True, alpha=0.3); ax2.legend(loc="upper right")

        # 3) Rep metrics
        ax3 = self.axes[1, 0]; ax3.clear()
        if self.completed_reps:
            rep_nums = list(range(1, len(self.completed_reps) + 1))
            speeds = [r["metrics"]["speed"] for r in self.completed_reps]
            tuts = [r["metrics"]["tut"] for r in self.completed_reps]
            ax3_t = ax3.twinx()
            l1 = ax3.plot(rep_nums, speeds, "o-", linewidth=2, markersize=6, label="Speed")
            l2 = ax3_t.plot(rep_nums, tuts, "s-", linewidth=2, markersize=6, label="TUT")
            ax3.set_xlabel("Rep #"); ax3.set_ylabel("Speed (m/s)"); ax3_t.set_ylabel("TUT (s)")
            ax3.set_title("Rep-by-Rep Metrics"); ax3.grid(True, alpha=0.3)
            lines = l1 + l2; labels = [ln.get_label() for ln in lines]
            ax3.legend(lines, labels, loc="upper right")
        else:
            ax3.text(0.5, 0.5, "Waiting for reps…", ha="center", va="center", fontsize=12)
            ax3.set_title("Rep-by-Rep Metrics")

        # 4) Normalized overlay (latest) or server summary
        ax4 = self.axes[1, 1]; ax4.clear()
        if not self.set_summary and self.last_norm_plot:
            p = self.last_norm_plot
            user_t = np.array(p["user_t"]); user_v = np.array(p["user_v"])
            ref_t = np.array(p["ref_t"]);  ref_v = np.array(p["ref_v"])
            diff = np.array(p["diff"])

            ax4.plot(ref_t, ref_v, linestyle="--", linewidth=1.6, label="Reference")
            ax4.plot(user_t, user_v, "b-", linewidth=1.6, label="Your (aligned)")
            ax4.plot(user_t, diff, linestyle=":", linewidth=1.2, label="Error")
            ax4.axhline(0, linestyle="--", linewidth=0.8)
            title = "Latest Rep – Normalized (Peak-Aligned)"
            if self.last_profile_accuracy is not None:
                title += f" (Match {self.last_profile_accuracy:.0f}%)"
            ax4.set_title(title)
            ax4.set_xlabel("Concentric time (0–1)"); ax4.set_ylabel("Normalized / Error")
            ax4.grid(True, alpha=0.3); ax4.legend(loc="upper right")
        elif self.set_summary:
            ax4.axis("off")
            s = self.set_summary["summary"]; tip = self.set_summary["tip"]
            block = f"""
SET SUMMARY (server)
{'='*40}
Reps: {s['reps']}
Total TUT: {s['tut']:.1f} s
Avg Speed: {s['avgSpeed']:.2f} m/s
Velocity Loss: {s['vl']:.1f} %
ROM Hit Rate: {s['romHitRate']:.1f} %
ROM Variability: {s['romVariability']:.1f} cm

Tip:
{tip}
"""
            ax4.text(0.05, 0.5, block, fontsize=9, va="center",
                     family="monospace", bbox=dict(boxstyle="round", facecolor="wheat", alpha=0.7))
        else:
            ax4.text(0.5, 0.5, "Waiting for normalized profile…", ha="center", va="center", fontsize=12)
            ax4.set_title("Normalized Profile")

        self.fig.tight_layout()
        self.fig.canvas.draw_idle()
        self.fig.canvas.flush_events()

    # ---- Runner ----
    async def run(self):
        if not await self._connect():
            print("Cannot proceed without server connection.")
            return
        try:
            await self._stream()
            await asyncio.sleep(1.0)
            self._update_plots()
            print("\n" + "="*60)
            print("TEST COMPLETE")
            print("="*60)
            print(f"Reps sent: {len(self.completed_reps)}")
            print(f"Valid reps: {sum(1 for r in self.completed_reps if r['valid'])}")
            print("Close plot windows to exit.")
            plt.show(block=True)
        finally:
            self.is_running = False
            await self.sio.disconnect()


# ---------------- Main ----------------

async def main():
    print("\n" + "="*60)
    print("LIVE GATEWAY TESTER")
    print("="*60)
    print("Stream fake IMU, auto-segment reps, per-rep plots:\n"
          "  • Acc (red) + Vel (blue)\n"
          "  • Ref vs Aligned Vel + Error (user − ref) + ROM% & label\n")
    tester = LiveGatewayTester(server_url="http://localhost:3001")
    await tester.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nInterrupted by user")
