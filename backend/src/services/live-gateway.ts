import { Server, Socket } from 'socket.io';
import { CalculationService } from './calculation-service';

export interface RepEvent {
  id: string;
  valid: boolean;
  metrics: {
    tut: number;
    speed: number;
    vl: number;
    romHit: boolean;
  };
  ts: number;
}

export interface SetUpdate {
  repsCompleted: number;
  avgSpeed: number;
  vl: number;
  romHitRate: number;
  rir: number;
  ts: number;
}

export interface SetEnd {
  summary: {
    reps: number;
    tut: number;
    avgSpeed: number;
    vl: number;
    romHitRate: number;
    romVariability: number;
  };
  tip: string;
}

export class LiveGateway {
  private io: Server;
  private calculationService: CalculationService;
  private connectedClients: Map<string, Socket>;
  private updateInterval: NodeJS.Timeout | null;

  constructor(io: Server, calculationService: CalculationService) {
    this.io = io;
    this.calculationService = calculationService;
    this.connectedClients = new Map();
    this.updateInterval = null;

    this.setupSocketHandlers();
    this.startMockEvents(); // For demo purposes
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      socket.on('startSet', (data: any) => {
        console.log(`Set started by ${socket.id}:`, data);
      });

      socket.on('endSet', (data: any) => {
        console.log(`Set ended by ${socket.id}:`, data);
        const summary = this.calculationService.calculateSetSummary(data.reps || []);
        this.broadcastSetEnd(summary);
      });
    });
  }

  // Broadcast rep event to all connected clients
  public broadcastRep(rep: RepEvent) {
    // Rate limit to 10-20 Hz if needed
    this.io.emit('rep', rep);
  }

  // Broadcast set update to all connected clients
  public broadcastSetUpdate(update: SetUpdate) {
    this.io.emit('setUpdate', update);
  }

  // Broadcast set end to all connected clients
  public broadcastSetEnd(summary: SetEnd) {
    this.io.emit('setEnd', summary);
  }

  // Broadcast music cue
  public broadcastMusicCue(action: 'duck' | 'restore') {
    this.io.emit('musicCue', { action });
  }

  // Broadcast shorts queue
  public broadcastShortsQueue(queue: string[]) {
    this.io.emit('shorts', { queue });
  }

  // Mock events for demo (remove in production)
  private startMockEvents() {
    let repCount = 0;
    let setActive = false;

    // Simulate starting a set after 3 seconds
    setTimeout(() => {
      setActive = true;
      console.log('Mock set started');
    }, 3000);

    this.updateInterval = setInterval(() => {
      if (!setActive) return;

      // Simulate a rep every 3-5 seconds
      if (Math.random() > 0.4) {
        repCount++;
        const mockRep: RepEvent = {
          id: `rep-${repCount}`,
          valid: Math.random() > 0.2, // 80% valid
          metrics: {
            tut: Math.random() * 2 + 2, // 2-4 seconds
            speed: Math.random() * 0.3 + 0.3, // 0.3-0.6 m/s
            vl: repCount * 3 + Math.random() * 5, // Increasing VL
            romHit: Math.random() > 0.1, // 90% ROM hit
          },
          ts: Date.now(),
        };

        this.broadcastRep(mockRep);

        // Broadcast set update
        const mockUpdate: SetUpdate = {
          repsCompleted: repCount,
          avgSpeed: 0.45 - repCount * 0.02,
          vl: repCount * 3,
          romHitRate: 95 - repCount,
          rir: Math.max(0, 5 - repCount),
          ts: Date.now(),
        };

        this.broadcastSetUpdate(mockUpdate);

        // End set after 8 reps
        if (repCount >= 8) {
          setActive = false;
          const mockSummary: SetEnd = {
            summary: {
              reps: repCount,
              tut: repCount * 3.5,
              avgSpeed: 0.42,
              vl: 18,
              romHitRate: 92,
              romVariability: 2.3,
            },
            tip: 'Great set! Your velocity stayed consistent. Consider +5lb next time.',
          };

          this.broadcastSetEnd(mockSummary);
          repCount = 0;

          // Start new set after 60 seconds
          setTimeout(() => {
            setActive = true;
            console.log('Mock set restarted');
          }, 60000);
        }
      }
    }, 3000);
  }

  public cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.io.close();
  }
}
