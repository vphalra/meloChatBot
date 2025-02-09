import { supabase } from '../lib/supabase';
import { KPIMetrics, FeedbackData } from '../types/chat';

class MetricsTracker {
  private static instance: MetricsTracker;
  private metricsBuffer: KPIMetrics[] = [];
  private readonly FLUSH_INTERVAL = 60000; // 1 minute

  private constructor() {
    setInterval(() => this.flushMetrics(), this.FLUSH_INTERVAL);
  }

  public static getInstance(): MetricsTracker {
    if (!MetricsTracker.instance) {
      MetricsTracker.instance = new MetricsTracker();
    }
    return MetricsTracker.instance;
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const { error } = await supabase
        .from('chatbot_metrics')
        .insert(this.metricsBuffer.map(metric => ({
          ...metric,
          timestamp: new Date().toISOString()
        })));

      if (error) throw error;
      
      // Clear the buffer after successful flush
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  async trackMetrics(metrics: Partial<KPIMetrics>) {
    // Add to buffer
    this.metricsBuffer.push(metrics as KPIMetrics);

    // If buffer gets too large, flush immediately
    if (this.metricsBuffer.length >= 100) {
      await this.flushMetrics();
    }

    return metrics;
  }

  async recordFeedback(feedback: FeedbackData) {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .insert([{
          ...feedback,
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;

      // Notify support team of negative feedback
      if (feedback.rating <= 2 || feedback.category === 'incorrect') {
        await this.notifySupport(feedback);
      }

      return data;
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  private async notifySupport(feedback: FeedbackData) {
    try {
      const { error } = await supabase
        .from('support_notifications')
        .insert([{
          type: 'negative_feedback',
          content: {
            rating: feedback.rating,
            category: feedback.category,
            comment: feedback.comment
          },
          status: 'pending',
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error notifying support:', error);
    }
  }

  async getAggregatedMetrics(timeframe: 'hour' | 'day' | 'week'): Promise<{
    averageResponseTime: number;
    averageSatisfaction: number;
    resolutionRate: number;
    handoffRate: number;
  }> {
    const { data, error } = await supabase
      .from('chatbot_metrics')
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
    return {
      averageResponseTime: this.average(metrics.map(m => m.responseTime)),
      averageSatisfaction: this.average(metrics.map(m => m.userSatisfaction)),
      resolutionRate: this.average(metrics.map(m => m.resolutionRate)),
      handoffRate: this.average(metrics.map(m => m.handoffRate))
    };
  }

  private average(values: number[]): number {
    return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
  }
}

export const metricsTracker = MetricsTracker.getInstance();