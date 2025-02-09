import { supabase } from '../lib/supabase';

interface PerformanceMetrics {
  responseTime: number;
  tokenCount: number;
  intentAccuracy?: number;
  userSatisfaction?: number;
}

interface UsageMetrics {
  totalRequests: number;
  uniqueUsers: number;
  peakConcurrentUsers: number;
  averageSessionDuration: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsBuffer: PerformanceMetrics[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute

  private constructor() {
    setInterval(() => this.flushMetrics(), this.FLUSH_INTERVAL);
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  async recordMetrics(metrics: PerformanceMetrics) {
    this.metricsBuffer.push(metrics);
    
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      await this.flushMetrics();
    }
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metrics.map(metric => ({
          ...metric,
          timestamp: new Date().toISOString()
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Error flushing metrics:', error);
      // Retry logic could be implemented here
    }
  }

  async getAggregatedMetrics(timeframe: 'hour' | 'day' | 'week'): Promise<{
    averageResponseTime: number;
    p95ResponseTime: number;
    averageTokenCount: number;
    intentAccuracy: number;
  }> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('timestamp', this.getTimeframeStart(timeframe));

    if (error) throw error;

    return this.calculateAggregates(data || []);
  }

  private getTimeframeStart(timeframe: 'hour' | 'day' | 'week'): string {
    const date = new Date();
    switch (timeframe) {
      case 'hour':
        date.setHours(date.getHours() - 1);
        break;
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
    }
    return date.toISOString();
  }

  private calculateAggregates(metrics: any[]): any {
    // Implementation of statistical calculations
    return {
      averageResponseTime: this.calculateAverage(metrics.map(m => m.responseTime)),
      p95ResponseTime: this.calculateP95(metrics.map(m => m.responseTime)),
      averageTokenCount: this.calculateAverage(metrics.map(m => m.tokenCount)),
      intentAccuracy: this.calculateAverage(metrics.map(m => m.intentAccuracy).filter(Boolean))
    };
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateP95(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[index];
  }
}

export default PerformanceMonitor