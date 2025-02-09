import { supabase } from '../lib/supabase';

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
}

class LoadBalancer {
  private static instance: LoadBalancer;
  private healthStatus: Map<string, ServiceHealth> = new Map();
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  private constructor() {
    this.startHealthChecks();
  }

  public static getInstance(): LoadBalancer {
    if (!LoadBalancer.instance) {
      LoadBalancer.instance = new LoadBalancer();
    }
    return LoadBalancer.instance;
  }

  private async startHealthChecks() {
    setInterval(async () => {
      await this.checkHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async checkHealth() {
    try {
      // Check OpenAI API health
      const openAiStart = performance.now();
      const openAiHealth = await this.checkOpenAIHealth();
      const openAiResponseTime = performance.now() - openAiStart;

      // Check database health
      const dbStart = performance.now();
      const dbHealth = await this.checkDatabaseHealth();
      const dbResponseTime = performance.now() - dbStart;

      // Update health status
      this.healthStatus.set('openai', {
        status: openAiHealth ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: openAiResponseTime
      });

      this.healthStatus.set('database', {
        status: dbHealth ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: dbResponseTime
      });

      // Log health metrics
      await this.logHealthMetrics();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  private async checkOpenAIHealth(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('health_checks')
        .select('count')
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  private async logHealthMetrics() {
    const metrics = Array.from(this.healthStatus.entries()).map(([service, health]) => ({
      service,
      status: health.status,
      response_time: health.responseTime,
      timestamp: health.lastCheck
    }));

    try {
      await supabase
        .from('health_metrics')
        .insert(metrics);
    } catch (error) {
      console.error('Failed to log health metrics:', error);
    }
  }

  public getServiceHealth(service: string): ServiceHealth | undefined {
    return this.healthStatus.get(service);
  }

  public isHealthy(): boolean {
    return Array.from(this.healthStatus.values())
      .every(health => health.status === 'healthy');
  }
}