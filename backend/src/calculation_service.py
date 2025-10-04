import numpy as np
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RepMetrics:
    tut: float
    speed: float
    vl: float
    rom_hit: bool


@dataclass
class RepEvent:
    id: str
    valid: bool
    metrics: RepMetrics
    ts: int


@dataclass
class SetSummary:
    reps: int
    tut: float
    avg_speed: float
    vl: float
    rom_hit_rate: float
    rom_variability: float


@dataclass
class SetEnd:
    summary: SetSummary
    tip: str


class CalculationService:
    """
    Calculation Service using NumPy for efficient array operations
    """

    def calculate_set_summary(self, reps: List[RepEvent]) -> SetEnd:
        """
        Calculate set summary from raw rep events using NumPy
        """
        if not reps:
            return SetEnd(
                summary=SetSummary(
                    reps=0,
                    tut=0.0,
                    avg_speed=0.0,
                    vl=0.0,
                    rom_hit_rate=0.0,
                    rom_variability=0.0,
                ),
                tip="No reps recorded.",
            )

        # Extract metrics into numpy arrays for efficient calculation
        tut_values = np.array([rep.metrics.tut for rep in reps])
        speed_values = np.array([rep.metrics.speed for rep in reps])
        rom_hits = np.array([rep.metrics.rom_hit for rep in reps])

        # Calculate total TUT using numpy sum
        total_tut = float(np.sum(tut_values))

        # Calculate average speed using numpy mean
        avg_speed = float(np.mean(speed_values))

        # Calculate velocity loss
        first_rep_speed = speed_values[0]
        min_speed = float(np.min(speed_values))
        vl = ((first_rep_speed - min_speed) / first_rep_speed) * 100 if first_rep_speed > 0 else 0.0

        # Calculate ROM hit rate
        rom_hit_rate = float(np.mean(rom_hits) * 100)

        # Calculate ROM variability (simplified - would need actual ROM depth data)
        rom_variability = float(np.random.uniform(1.0, 4.0))  # Mock: 1-4 cm

        # Generate tip based on metrics
        tip = self._generate_tip(
            reps=len(reps),
            vl=vl,
            rom_hit_rate=rom_hit_rate,
            avg_speed=avg_speed,
        )

        return SetEnd(
            summary=SetSummary(
                reps=len(reps),
                tut=round(total_tut, 2),
                avg_speed=round(avg_speed, 2),
                vl=round(vl, 1),
                rom_hit_rate=round(rom_hit_rate, 1),
                rom_variability=round(rom_variability, 1),
            ),
            tip=tip,
        )

    def _generate_tip(self, reps: int, vl: float, rom_hit_rate: float, avg_speed: float) -> str:
        """
        Generate a concise coaching tip based on set metrics
        """
        # Velocity loss feedback
        if vl < 10:
            extra_reps = np.ceil(reps * 0.5)
            return (
                f"Excellent speed consistency. You likely had {int(extra_reps)} "
                f"more reps in the tank. Consider adding load."
            )
        elif vl > 30:
            return (
                "High velocity loss detected. Great work pushing hard, but watch for "
                "form breakdown on future sets."
            )

        # ROM feedback
        if rom_hit_rate < 80:
            return (
                f"ROM hit rate was {int(rom_hit_rate)}%. Focus on depth consistency "
                f"next set. Quality over quantity."
            )
        elif rom_hit_rate == 100:
            return "Perfect ROM consistency! Your movement quality is excellent. Keep this up."

        # Speed feedback
        if avg_speed < 0.3:
            return (
                "Bar speed is slowing down. Consider reducing load or increasing "
                "rest between sets."
            )
        elif avg_speed > 0.6:
            return (
                "Fast bar speed indicates room for load progression. "
                "Add 2.5-5% next session."
            )

        # Default positive feedback
        return (
            f"Solid set! VL at {int(vl)}% with {int(rom_hit_rate)}% ROM hits. "
            f"Stay consistent."
        )

    def calculate_rep_metrics(self, raw_data: Any) -> RepEvent:
        """
        Calculate per-rep metrics from raw IMU data (mock implementation)

        In production, this would process IMU data using NumPy to calculate:
        - TUT from acceleration profile
        - Speed from velocity curve
        - VL from speed comparison to first rep
        - ROM hit from depth detection
        """
        return RepEvent(
            id=f"rep-{int(datetime.now().timestamp() * 1000)}",
            valid=True,
            metrics=RepMetrics(
                tut=3.2,
                speed=0.45,
                vl=12.0,
                rom_hit=True,
            ),
            ts=int(datetime.now().timestamp() * 1000),
        )

    def analyze_velocity_trend(self, speed_values: np.ndarray) -> Dict[str, Any]:
        """
        Analyze velocity trends using NumPy operations
        """
        if len(speed_values) < 2:
            return {"trend": "insufficient_data"}

        # Calculate linear regression for velocity trend
        x = np.arange(len(speed_values))
        coefficients = np.polyfit(x, speed_values, 1)
        slope = coefficients[0]

        # Calculate velocity loss percentage
        velocity_loss_pct = (
            ((speed_values[0] - speed_values[-1]) / speed_values[0]) * 100
            if speed_values[0] > 0
            else 0
        )

        return {
            "trend": "declining" if slope < -0.01 else "stable" if slope < 0.01 else "increasing",
            "slope": float(slope),
            "velocity_loss_pct": float(velocity_loss_pct),
            "mean_velocity": float(np.mean(speed_values)),
            "std_velocity": float(np.std(speed_values)),
        }

    def calculate_fatigue_index(self, speed_values: np.ndarray) -> float:
        """
        Calculate fatigue index using NumPy
        Formula: (max_speed - min_speed) / max_speed * 100
        """
        if len(speed_values) == 0:
            return 0.0

        max_speed = np.max(speed_values)
        min_speed = np.min(speed_values)

        if max_speed == 0:
            return 0.0

        fatigue_index = ((max_speed - min_speed) / max_speed) * 100
        return float(fatigue_index)
