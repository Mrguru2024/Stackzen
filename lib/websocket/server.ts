import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { PerformanceMonitor } from '../monitoring/performance.ts';
// const _redis = new Redis(process.env.REDIS_URL!); // Unused

export class WebSocketServer {
  private static instance: WebSocketServer;
  private io: Server;
  private performanceMonitor: PerformanceMonitor;

  private constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
    });
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.setupEventHandlers();
  }

  public static getInstance(httpServer: HTTPServer): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer(httpServer);
    }
    return WebSocketServer.instance;
  }

  private setupEventHandlers() {
    this.io.on('connection', socket => {
      console.log('Client connected:', socket.id);

      // Join admin room if user is admin
      socket.on('join-admin', () => {
        socket.join('admin');
      });

      // Join developer room if user is developer
      socket.on('join-developer', () => {
        socket.join('developer');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  private async startPerformanceMonitoring() {
    setInterval(async () => {
      const metrics = await this.performanceMonitor.collectMetrics();

      // Emit to admin room
      this.io.to('admin').emit('performance-metrics', metrics);

      // Emit to developer room
      this.io.to('developer').emit('performance-metrics', metrics);
    }, 5000); // Update every 5 seconds
  }

  // Method to emit security events
  public emitSecurityEvent(event: any) {
    this.io.to('admin').emit('security-event', event);
  }

  // Method to emit system health updates
  public emitSystemHealth(health: any) {
    this.io.to('admin').emit('system-health', health);
    this.io.to('developer').emit('system-health', health);
  }

  // Method to emit error events
  public emitErrorEvent(error: any) {
    this.io.to('developer').emit('error-event', error);
  }

  // Method to emit deployment events
  public emitDeploymentEvent(deployment: any) {
    this.io.to('developer').emit('deployment-event', deployment);
  }

  // Method to emit user activity
  public emitUserActivity(activity: any) {
    this.io.to('admin').emit('user-activity', activity);
  }

  // Method to emit audit log entries
  public emitAuditLog(log: any) {
    this.io.to('admin').emit('audit-log', log);
  }
}
