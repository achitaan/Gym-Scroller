import { RepEvent, SetEnd } from './live-gateway';

export class CalculationService {
  /**
   * Calculate set summary from raw rep events
   */
  public calculateSetSummary(reps: RepEvent[]): SetEnd {
    if (reps.length === 0) {
      return {
        summary: {
          reps: 0,
          tut: 0,
          avgSpeed: 0,
          vl: 0,
          romHitRate: 0,
          romVariability: 0,
        },
        tip: 'No reps recorded.',
      };
    }

    // Calculate total TUT
    const totalTut = reps.reduce((sum, rep) => sum + rep.metrics.tut, 0);

    // Calculate average speed
    const avgSpeed = reps.reduce((sum, rep) => sum + rep.metrics.speed, 0) / reps.length;

    // Calculate velocity loss
    const firstRepSpeed = reps[0]?.metrics.speed || 0;
    const minSpeed = Math.min(...reps.map((r) => r.metrics.speed));
    const vl = firstRepSpeed > 0 ? ((firstRepSpeed - minSpeed) / firstRepSpeed) * 100 : 0;

    // Calculate ROM hit rate
    const romHits = reps.filter((r) => r.metrics.romHit).length;
    const romHitRate = (romHits / reps.length) * 100;

    // Calculate ROM variability (simplified - would need actual ROM depth data)
    const romVariability = Math.random() * 3 + 1; // Mock: 1-4 cm

    // Generate tip based on metrics
    const tip = this.generateTip({
      reps: reps.length,
      vl,
      romHitRate,
      avgSpeed,
    });

    return {
      summary: {
        reps: reps.length,
        tut: totalTut,
        avgSpeed: parseFloat(avgSpeed.toFixed(2)),
        vl: parseFloat(vl.toFixed(1)),
        romHitRate: parseFloat(romHitRate.toFixed(1)),
        romVariability: parseFloat(romVariability.toFixed(1)),
      },
      tip,
    };
  }

  /**
   * Generate a concise coaching tip based on set metrics
   */
  private generateTip(metrics: {
    reps: number;
    vl: number;
    romHitRate: number;
    avgSpeed: number;
  }): string {
    const { reps, vl, romHitRate, avgSpeed } = metrics;

    // Velocity loss feedback
    if (vl < 10) {
      return `Excellent speed consistency. You likely had ${Math.ceil(
        reps * 0.5
      )} more reps in the tank. Consider adding load.`;
    } else if (vl > 30) {
      return `High velocity loss detected. Great work pushing hard, but watch for form breakdown on future sets.`;
    }

    // ROM feedback
    if (romHitRate < 80) {
      return `ROM hit rate was ${romHitRate.toFixed(
        0
      )}%. Focus on depth consistency next set. Quality over quantity.`;
    } else if (romHitRate === 100) {
      return `Perfect ROM consistency! Your movement quality is excellent. Keep this up.`;
    }

    // Speed feedback
    if (avgSpeed < 0.3) {
      return `Bar speed is slowing down. Consider reducing load or increasing rest between sets.`;
    } else if (avgSpeed > 0.6) {
      return `Fast bar speed indicates room for load progression. Add 2.5-5% next session.`;
    }

    // Default positive feedback
    return `Solid set! VL at ${vl.toFixed(0)}% with ${romHitRate.toFixed(0)}% ROM hits. Stay consistent.`;
  }

  /**
   * Calculate per-rep metrics from raw IMU data (mock implementation)
   */
  public calculateRepMetrics(rawData: any): RepEvent {
    // In production, this would process IMU data to calculate:
    // - TUT from acceleration profile
    // - Speed from velocity curve
    // - VL from speed comparison to first rep
    // - ROM hit from depth detection

    return {
      id: `rep-${Date.now()}`,
      valid: true,
      metrics: {
        tut: 3.2,
        speed: 0.45,
        vl: 12,
        romHit: true,
      },
      ts: Date.now(),
    };
  }
}
