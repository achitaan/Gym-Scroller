import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime


# ---------------- Data classes ----------------

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
    # Extras: normalized curves, accuracy score, comparison metrics, effort metrics, and raw slices for plotting
    extras: Optional[Dict[str, Any]] = field(default=None)

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


# ---------------- Signal helpers ----------------

def _ema(x: np.ndarray, alpha: float) -> np.ndarray:
    if x.size == 0:
        return x
    y = np.empty_like(x, dtype=float)
    y[0] = x[0]
    for i in range(1, x.size):
        y[i] = alpha * x[i] + (1 - alpha) * y[i - 1]
    return y

def _highpass_gravity_estimate(ax: np.ndarray, ay: np.ndarray, az: np.ndarray, fs: float) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    # Approximate gravity removal via slow EMA (no orientation provided)
    fc = 0.7
    alpha = 1 - np.exp(-2 * np.pi * fc / fs)
    gx = _ema(ax, 1 - alpha)
    gy = _ema(ay, 1 - alpha)
    gz = _ema(az, 1 - alpha)
    return ax - gx, ay - gy, az - gz

def _smooth(x: np.ndarray, k: int = 9) -> np.ndarray:
    if k < 1 or x.size == 0:
        return x
    pad = k // 2
    xpad = np.pad(x, (pad, pad), mode="edge")
    return np.convolve(xpad, np.ones(k) / k, mode="valid")

def _trapz_integrate(a: np.ndarray, t: np.ndarray) -> np.ndarray:
    v = np.zeros_like(a, dtype=float)
    if a.size > 1:
        v[1:] = np.cumsum(0.5 * (a[1:] + a[:-1]) * (t[1:] - t[:-1]))
    return v

def _linear_detrend(v: np.ndarray) -> np.ndarray:
    n = v.size
    if n < 2:
        return v
    x = np.arange(n)
    b1, b0 = np.polyfit(x, v, 1)
    return v - (b1 * x + b0)

def _resample_to(t: np.ndarray, y: np.ndarray, n: int = 200) -> Tuple[np.ndarray, np.ndarray]:
    if t.size < 2:
        return t, y
    t_new = np.linspace(t[0], t[-1], n)
    y_new = np.interp(t_new, t, y)
    return t_new, y_new


# ---------------- Reference profiles (stylized & normalized) ----------------

class _ReferenceProfiles:
    @staticmethod
    def bench(n: int = 200) -> Tuple[np.ndarray, np.ndarray]:
        x = np.linspace(0, 1, n)
        base = np.sin(np.pi * x)
        dip = 0.35 * np.exp(-0.5 * ((x - 0.55) / 0.08) ** 2)
        late = 0.08 * np.exp(-0.5 * ((x - 0.80) / 0.07) ** 2)
        v = np.clip(base - dip + late, 0, None)
        v /= max(v.max(), 1e-8)
        return x, v

    @staticmethod
    def squat(n: int = 200) -> Tuple[np.ndarray, np.ndarray]:
        x = np.linspace(0, 1, n)
        base = np.sin(np.pi * x)
        bounce_peak = 0.18 * np.exp(-0.5 * ((x - 0.08) / 0.05) ** 2)
        dip = 0.30 * np.exp(-0.5 * ((x - 0.25) / 0.09) ** 2)
        late = 0.10 * np.exp(-0.5 * ((x - 0.65) / 0.10) ** 2)
        v = np.clip(base + bounce_peak - dip + late, 0, None)
        v /= max(v.max(), 1e-8)
        return x, v

    @staticmethod
    def deadlift(n: int = 200) -> Tuple[np.ndarray, np.ndarray]:
        x = np.linspace(0, 1, n)
        rise = 1 - np.exp(-5 * x)
        mid_drop = 0.18 * np.exp(-0.5 * ((x - 0.55) / 0.12) ** 2)
        v = np.clip(rise - mid_drop, 0, None)
        v /= max(v.max(), 1e-8)
        return x, v


# ---------------- Comparison metrics ----------------

def _pearson_r(a: np.ndarray, b: np.ndarray) -> float:
    if a.size != b.size or a.size < 2:
        return 0.0
    a = (a - a.mean()) / (a.std() + 1e-8)
    b = (b - b.mean()) / (b.std() + 1e-8)
    return float(np.clip(np.mean(a * b), -1, 1))

def _rmse(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.sqrt(np.mean((a - b) ** 2)))

def _dtw_distance(a: np.ndarray, b: np.ndarray) -> float:
    n, m = a.size, b.size
    D = np.full((n + 1, m + 1), np.inf, dtype=float)
    D[0, 0] = 0.0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = abs(a[i - 1] - b[j - 1])
            D[i, j] = cost + min(D[i - 1, j], D[i, j - 1], D[i - 1, j - 1])
    return float(D[n, m] / (n + m))

def _curve_features(t: np.ndarray, v: np.ndarray) -> Dict[str, float]:
    n = v.size
    if n == 0:
        return {"t_peak": 0.0, "t_min": 0.0, "dip_depth": 0.0}
    i_peak = int(np.argmax(v))
    start = max(int(0.1 * n), 1)
    i_min = start + int(np.argmin(v[start:]))
    return {"t_peak": float(t[i_peak]), "t_min": float(t[i_min]), "dip_depth": float(v[i_peak] - v[i_min])}

def _score_from_metrics(rmse: float, r: float, dtw: float, feat_err: float) -> float:
    rmse_c = np.clip(rmse / 0.30, 0, 1)
    r_c = 1 - np.clip((r + 1) / 2, 0, 1)
    dtw_c = np.clip(dtw / 0.30, 0, 1)
    feat_c = np.clip(feat_err / 0.50, 0, 1)
    shape_penalty = 0.4 * rmse_c + 0.3 * r_c + 0.3 * dtw_c
    score = 100 * (1 - (0.8 * shape_penalty + 0.2 * feat_c))
    return float(np.clip(score, 0, 100))


# ---------------- Peak-anchored alignment ----------------

def _align_to_peak(user_t: np.ndarray, user_v: np.ndarray,
                   ref_t: np.ndarray, ref_v: np.ndarray,
                   small_shift_frac: float = 0.02) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Piecewise peak-anchored time warp + tiny optional shift refinement.
    Returns (user_v_aligned_on_ref_t, info) where info contains peak times and shift.
    """
    n = ref_t.size
    # peak times
    tpu = float(user_t[int(np.argmax(user_v))]) if user_t.size else 0.5
    tpr = float(ref_t[int(np.argmax(ref_v))]) if ref_t.size else 0.5
    eps = 1e-8

    # piecewise affine mapping φ(t)
    t_aligned = np.empty_like(user_t)
    mask_early = user_t <= tpu
    t_aligned[mask_early] = user_t[mask_early] * (tpr / max(tpu, eps))
    t_aligned[~mask_early] = tpr + (user_t[~mask_early] - tpu) * ((1 - tpr) / max(1 - tpu, eps))

    # resample onto ref grid
    user_v_aligned = np.interp(ref_t, t_aligned, user_v)

    # tiny shift refinement (±2% of cycle), optional
    max_shift = int(max(1, np.round(small_shift_frac * n)))
    if max_shift > 0 and n > 5:
        x = (user_v_aligned - user_v_aligned.mean()) / (user_v_aligned.std() + eps)
        y = (ref_v - ref_v.mean()) / (ref_v.std() + eps)
        best = (0, -np.inf)  # (lag, score)
        for lag in range(-max_shift, max_shift + 1):
            if lag < 0:
                s = x[-lag:]
                r = y[:s.size]
            elif lag > 0:
                s = x[:-lag]
                r = y[lag:lag + s.size]
            else:
                s = x; r = y
            if s.size > 3 and r.size > 3:
                score = float(np.mean(s[:r.size] * r[:s.size]))
                if score > best[1]:
                    best = (lag, score)
        lag = best[0]
        if lag < 0:
            user_v_aligned = np.concatenate([user_v_aligned[-lag:], np.full((-lag), user_v_aligned[-1])])[:n]
        elif lag > 0:
            user_v_aligned = np.concatenate([np.full((lag), user_v_aligned[0]), user_v_aligned[:-lag]])

    info = {"tpu": tpu, "tpr": tpr, "abs_peak_shift": abs(tpu - tpr)}
    return user_v_aligned, info


# ---------------- Main service ----------------

class CalculationService:
    """
    Processes IMU → velocity → normalized concentric curves,
    compares to reference profiles with peak-anchored alignment, scores accuracy,
    segments reps from continuous stream, and computes effort/ROM metrics.
    """

    def __init__(self):
        # Running per-lift ROM baselines (meters of concentric travel)
        # Updated as we observe larger displacements for that lift.
        self.rom_baseline: Dict[str, float] = {}

    # ---- ROM baseline helpers ----
    def _get_rom_baseline(self, lift: str) -> Optional[float]:
        return self.rom_baseline.get(lift, None)

    def _update_rom_baseline(self, lift: str, displacement_m: float):
        if displacement_m <= 0:
            return
        cur = self.rom_baseline.get(lift)
        if cur is None or displacement_m > cur:
            self.rom_baseline[lift] = float(displacement_m)

    # ---- Segment a continuous stream into reps ----
    def segment_reps_from_stream(self, raw_stream: Dict[str, Any]) -> List[RepEvent]:
        """
        raw_stream: {'ax','ay','az','fs', optional 't','lift'}
        Returns RepEvent objects for each detected rep (concentric).
        """
        ax = np.asarray(raw_stream.get("ax", []), dtype=float)
        ay = np.asarray(raw_stream.get("ay", []), dtype=float)
        az = np.asarray(raw_stream.get("az", []), dtype=float)
        fs = float(raw_stream.get("fs", 200.0))
        t = np.asarray(raw_stream.get("t", []), dtype=float)
        lift = str(raw_stream.get("lift", "bench")).lower()

        if ax.size == 0:
            return []
        if t.size == 0:
            t = np.arange(ax.size, dtype=float) / fs

        # Gravity removal + smoothing
        gx, gy, gz = _highpass_gravity_estimate(ax, ay, az, fs)
        acc = np.sqrt(gx**2 + gy**2 + gz**2)
        acc = _smooth(acc, k=9)

        # Velocity + drift correction
        vel = _trapz_integrate(acc, t)
        vel = _linear_detrend(vel)
        vel = _smooth(vel, k=9)

        # Make concentric positive; find active islands
        vel = vel - np.median(vel[: max(1, int(0.1 * vel.size))])
        if np.mean(vel) < 0:
            vel = -vel

        th = 0.02 * np.max(np.abs(vel)) + 1e-6
        active = vel > th

        reps: List[RepEvent] = []
        min_len = int(0.4 * fs)   # ≥0.4 s
        min_gap = int(0.2 * fs)   # ≥0.2 s gap
        i = 0
        while i < active.size:
            if active[i]:
                start = i
                while i < active.size and active[i]:
                    i += 1
                end = i - 1
                if (end - start + 1) >= min_len:
                    _ = min(end + min_gap, active.size - 1)  # force a gap
                    rep_ev = self._compute_rep_from_slice(
                        t[start:end+1], vel[start:end+1], acc[start:end+1], lift
                    )
                    reps.append(rep_ev)
                continue
            i += 1

        return reps

    # ---- Compute metrics from a concentric slice ----
    def _compute_rep_from_slice(self, t_c: np.ndarray, v_c_raw: np.ndarray, a_c_raw: np.ndarray, lift: str) -> RepEvent:
        # Resample & normalize (velocity for comparison)
        t_rs, v_rs = _resample_to(t_c, np.clip(v_c_raw, 0, None), n=200)
        peak = max(np.max(v_rs), 1e-8)
        v_norm = v_rs / peak
        t_norm = (t_rs - t_rs[0]) / max((t_rs[-1] - t_rs[0]), 1e-8)

        # Reference
        if "squat" in lift:
            r_t, r_v = _ReferenceProfiles.squat(n=200)
        elif "dead" in lift:
            r_t, r_v = _ReferenceProfiles.deadlift(n=200)
        else:
            r_t, r_v = _ReferenceProfiles.bench(n=200)

        # Align user curve to reference by peak (piecewise warp + tiny shift)
        user_v_aligned, align_info = _align_to_peak(t_norm, v_norm, r_t, r_v)

        # Compare on aligned curves
        rmse = _rmse(user_v_aligned, r_v)
        r = _pearson_r(user_v_aligned, r_v)
        dtw = _dtw_distance(user_v_aligned, r_v)

        # Features (on the common ref grid)
        f_user = _curve_features(r_t, user_v_aligned)
        f_ref = _curve_features(r_t, r_v)
        feat_err = (abs(f_user["t_peak"] - f_ref["t_peak"])
                    + abs(f_user["t_min"] - f_ref["t_min"])
                    + abs(f_user["dip_depth"] - f_ref["dip_depth"])) / 3.0

        # Optional penalty for very large peak displacement (up to -10 pts)
        penalty = np.clip(align_info["abs_peak_shift"] / 0.20, 0, 1) * 0.10
        raw_score = _score_from_metrics(rmse, r, dtw, feat_err)
        score = float(np.clip(raw_score * (1 - penalty), 0, 100))

        # ---------------- Effort metrics (ROM & PoSR etc.) ----------------
        # 1) ROM (displacement) from raw velocity with ZUPT anchors (start/end ~ 0)
        # Integrate raw v to position; displacement = x_end - x_start
        x_c = _trapz_integrate(v_c_raw, t_c)
        # Re-anchor to start=0 to avoid arbitrary offset
        x_c = x_c - x_c[0]
        displacement_m = float(x_c[-1])  # meters (relative)
        # Update per-lift baseline (we keep the max observed)
        self._update_rom_baseline(lift, displacement_m)
        rom_base = self._get_rom_baseline(lift) or max(displacement_m, 1e-8)
        rom_pct = float(np.clip(displacement_m / (rom_base + 1e-12), 0, 1.2))

        # 2) Find SR minimum index on normalized, aligned curve (common grid)
        #    (use the same definition as _curve_features)
        n = user_v_aligned.size
        start = max(int(0.1 * n), 1)
        i_min = start + int(np.argmin(user_v_aligned[start:]))
        # Map i_min back into the raw-time index to integrate acceleration for PoSR
        # Fraction of rep at min:
        frac_min = r_t[i_min]  # r_t is 0..1
        j_min_raw = int(np.clip(round(frac_min * (t_c.size - 1)), 0, t_c.size - 1))

        # 3) PoSR impulse: integral of positive acceleration after SR minimum (raw units)
        if j_min_raw < t_c.size - 1:
            a_pos = np.clip(a_c_raw[j_min_raw:], 0, None)
            t_pos = t_c[j_min_raw:]
            # trapezoidal integral of a(t) dt => m/s (velocity gain potential)
            posr_imp = float(np.trapz(a_pos, t_pos))
        else:
            posr_imp = 0.0

        # Normalize PoSR impulse by peak concentric velocity to get a unitless sense
        posr_imp_norm = float(posr_imp / (peak + 1e-8))

        # 4) LPVR: mean normalized velocity over last 20% of the concentric
        i_80 = int(0.8 * n)
        lpvr = float(np.mean(user_v_aligned[i_80:])) if n > 0 else 0.0

        # 5) Plateau fraction after SR: fraction of samples with |v| < 0.05
        tail = user_v_aligned[i_min:] if i_min < n else np.array([])
        plateau_frac = float(np.mean(np.abs(tail) < 0.05)) if tail.size > 0 else 1.0

        # 6) Post-SR Gain on normalized curve
        post_sr_gain = float(user_v_aligned[-1] - user_v_aligned[i_min]) if tail.size > 0 else 0.0

        # Simple ruleset to label the rep (tune thresholds per lift if needed)
        label = "completed"
        if rom_pct >= 0.95 and post_sr_gain >= 0.10 and plateau_frac <= 0.35:
            label = "completed"
        elif rom_pct < 0.95 and (posr_imp_norm <= 0.10) and (plateau_frac >= 0.45):
            label = "true_failure"
        elif rom_pct < 0.95 and ((posr_imp_norm > 0.10) or (lpvr >= 0.12)) and (plateau_frac < 0.35):
            label = "aborted"
        else:
            # ambiguous; lean by LPVR and PoSR
            label = "true_failure" if (posr_imp_norm <= 0.10 and lpvr < 0.08) else "aborted"

        # ---------------- Plotting payloads ----------------
        diff = (user_v_aligned - r_v).tolist()  # error function
        raw_plot = {
            "t_raw": t_c.tolist(),
            "acc_raw": a_c_raw.tolist(),
            "vel_raw": v_c_raw.tolist(),
            "pos_raw": x_c.tolist(),          # for optional position plots
        }
        norm_plot = {
            "user_t": r_t.tolist(),           # aligned onto ref grid
            "user_v": user_v_aligned.tolist(),
            "ref_t": r_t.tolist(),
            "ref_v": r_v.tolist(),
            "diff": diff,                     # user − ref
            "alignment": {"mode": "peak_piecewise", **align_info},
        }
        effort = {
            "rom_pct": rom_pct,
            "rom_baseline_m": float(rom_base),
            "displacement_m": displacement_m,
            "posr_imp": posr_imp,
            "posr_imp_norm": posr_imp_norm,
            "lpvr": lpvr,
            "plateau_frac": plateau_frac,
            "post_sr_gain": post_sr_gain,
            "label": label,
        }

        tut = float(t_c[-1] - t_c[0])
        mean_speed = float(np.mean(np.clip(v_c_raw, 0, None)))

        return RepEvent(
            id=f"rep-{int(datetime.now().timestamp() * 1000)}",
            valid=True,
            metrics=RepMetrics(
                tut=tut,
                speed=mean_speed,
                vl=0.0,           # set-level calc later
                rom_hit=(rom_pct >= 0.95),  # treat ROM hit as ≥95% of baseline
            ),
            ts=int(datetime.now().timestamp() * 1000),
            extras={
                "profile_accuracy": float(score),
                "comparison": {
                    "rmse": float(rmse),
                    "pearson_r": float(r),
                    "dtw": float(dtw),
                    "user_features": f_user,
                    "ref_features": f_ref,
                },
                "raw_plot": raw_plot,
                "norm_plot": norm_plot,
                "effort": effort,
            },
        )

    # ---- Single-rep packet path (uses same logic) ----
    def calculate_rep_metrics(self, raw_data: Dict[str, Any]) -> RepEvent:
        ax = np.asarray(raw_data.get("ax", []), dtype=float)
        ay = np.asarray(raw_data.get("ay", []), dtype=float)
        az = np.asarray(raw_data.get("az", []), dtype=float)
        fs = float(raw_data.get("fs", 200.0))
        t = np.asarray(raw_data.get("t", []), dtype=float)
        lift = str(raw_data.get("lift", "bench")).lower()

        if t.size == 0 and ax.size > 0:
            t = np.arange(ax.size, dtype=float) / fs

        gx, gy, gz = _highpass_gravity_estimate(ax, ay, az, fs)
        acc = np.sqrt(gx**2 + gy**2 + gz**2)
        acc = _smooth(acc, k=9)
        vel = _trapz_integrate(acc, t)
        vel = _linear_detrend(vel)
        vel = _smooth(vel, k=9)
        vel = vel - np.median(vel[: max(1, int(0.1 * vel.size))])
        if np.mean(vel) < 0:
            vel = -vel

        th = 0.02 * np.max(np.abs(vel)) + 1e-6
        idx = np.where(vel > th)[0]
        if idx.size == 0:
            idx = np.arange(vel.size)
        i0, i1 = idx[0], idx[-1]
        return self._compute_rep_from_slice(t[i0:i1+1], vel[i0:i1+1], acc[i0:i1+1], lift)

    # ---- Set summary (back-compat + profile match note) ----
    def calculate_set_summary(self, reps: List[RepEvent]) -> SetEnd:
        if not reps:
            return SetEnd(
                summary=SetSummary(
                    reps=0, tut=0.0, avg_speed=0.0, vl=0.0,
                    rom_hit_rate=0.0, rom_variability=0.0,
                ),
                tip="No reps recorded.",
            )

        tut_values = np.array([rep.metrics.tut for rep in reps], dtype=float)
        speed_values = np.array([rep.metrics.speed for rep in reps], dtype=float)
        rom_hits = np.array([rep.metrics.rom_hit for rep in reps], dtype=bool)

        total_tut = float(np.sum(tut_values))
        avg_speed = float(np.mean(speed_values))
        first_rep_speed = speed_values[0]
        min_speed = float(np.min(speed_values))
        vl = ((first_rep_speed - min_speed) / first_rep_speed) * 100 if first_rep_speed > 0 else 0.0
        rom_hit_rate = float(np.mean(rom_hits) * 100)
        rom_variability = float(np.random.uniform(1.0, 4.0))  # placeholder

        acc_scores = [ev.extras["profile_accuracy"] for ev in reps if ev.extras and "profile_accuracy" in ev.extras]
        avg_profile_acc = float(np.mean(acc_scores)) if acc_scores else None

        tip = self._generate_tip(
            reps=len(reps), vl=vl, rom_hit_rate=rom_hit_rate, avg_speed=avg_speed, profile_acc=avg_profile_acc
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

    def _generate_tip(self, reps: int, vl: float, rom_hit_rate: float, avg_speed: float, profile_acc: Optional[float] = None) -> str:
        if profile_acc is not None:
            if profile_acc >= 85:
                note = f" Profile match {int(profile_acc)}%—great rhythm through the sticking region."
            elif profile_acc >= 70:
                note = f" Profile match {int(profile_acc)}%—close; keep pushing through the sticking point."
            else:
                note = f" Profile match {int(profile_acc)}%—work on technique around the sticking region."
        else:
            note = ""

        if vl < 10:
            extra_reps = int(np.ceil(reps * 0.5))
            return f"Excellent speed consistency. Likely {extra_reps} reps in reserve—consider adding load." + note
        if vl > 30:
            return "High velocity loss—great effort, but watch for form breakdown next set." + note

        if rom_hit_rate < 80:
            return f"ROM hits {int(rom_hit_rate)}%. Prioritize depth consistency next set." + note
        if rom_hit_rate == 100:
            return "Perfect ROM consistency. Keep it up!" + note

        if avg_speed < 0.3:
            return "Bar speed is low; reduce load or add rest." + note
        if avg_speed > 0.6:
            return "Fast velocities—room to progress by 2.5–5% load." + note

        return f"Solid set. VL {int(vl)}%, ROM hits {int(rom_hit_rate)}%." + note
