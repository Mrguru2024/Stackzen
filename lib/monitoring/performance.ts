import os from 'os';
import { createRedisClient, withRedisFallback } from '@/lib/redis-client';

const redis = createRedisClient(process.env.REDIS_URL);

interface PerformanceMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  network: {
    connections: number;
    bytesIn: number;
    bytesOut: number;
  };
  database: {
    connections: number;
    queryTime: number;
    queriesPerSecond: number;
  };
  redis: {
    memory: number;
    connectedClients: number;
    commandsProcessed: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private lastUpdate: number;

  private constructor() {
    this.metrics = {
      cpu: { usage: 0, cores: os.cpus().length, loadAverage: os.loadavg() },
      memory: { total: 0, free: 0, used: 0, usagePercentage: 0 },
      network: { connections: 0, bytesIn: 0, bytesOut: 0 },
      database: { connections: 0, queryTime: 0, queriesPerSecond: 0 },
      redis: { memory: 0, connectedClients: 0, commandsProcessed: 0 },
    };
    this.lastUpdate = Date.now();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public async collectMetrics(): Promise<PerformanceMetrics> {
    // CPU Metrics
    const cpuUsage = await this.getCPUUsage();
    this.metrics.cpu = {
      usage: cpuUsage,
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
    };

    // Memory Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    this.metrics.memory = {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      usagePercentage: ((totalMem - freeMem) / totalMem) * 100,
    };

    // Network Metrics
    const networkStats = await this.getNetworkStats();
    this.metrics.network = networkStats;

    // Database Metrics
    const dbStats = await this.getDatabaseStats();
    this.metrics.database = dbStats;

    // Redis Metrics
    const redisStats = await this.getRedisStats();
    this.metrics.redis = redisStats;

    this.lastUpdate = Date.now();
    return this.metrics;
  }

  private async getCPUUsage(): Promise<number> {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    return 100 - (totalIdle / totalTick) * 100;
  }

  private async getNetworkStats() {
    // This is a simplified version. In production, you'd want to use a more robust solution
    const connections = await this.getActiveConnections();
    return {
      connections,
      bytesIn: 0, // Implement actual network monitoring
      bytesOut: 0, // Implement actual network monitoring
    };
  }

  private async getDatabaseStats() {
    // This is a simplified version. In production, you'd want to use actual database metrics
    return {
      connections: 0, // Implement actual database connection monitoring
      queryTime: 0, // Implement actual query time monitoring
      queriesPerSecond: 0, // Implement actual QPS monitoring
    };
  }

  private async getRedisStats() {
    const info = await withRedisFallback(() => redis.info(), '');
    if (!info) {
      return {
        memory: 0,
        connectedClients: 0,
        commandsProcessed: 0,
      };
    }
    const memory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0');
    const clients = parseInt(info.match(/connected_clients:(\d+)/)?.[1] || '0');
    const commands = parseInt(info.match(/total_commands_processed:(\d+)/)?.[1] || '0');

    return {
      memory,
      connectedClients: clients,
      commandsProcessed: commands,
    };
  }

  private async getActiveConnections(): Promise<number> {
    // This is a simplified version. In production, you'd want to use actual connection monitoring
    return 0;
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }
}
