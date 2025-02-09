import { supabase } from '../lib/supabase';

interface ConversationFeedback {
  conversationId: string;
  helpful: boolean;
  accuracy: number;
  comments?: string;
}

interface LearningMetrics {
  totalInteractions: number;
  successfulInteractions: number;
  averageAccuracy: number;
  commonIssues: string[];
}

class LearningSystem {
  private static instance: LearningSystem;
  private feedbackBuffer: ConversationFeedback[] = [];
  private readonly ANALYSIS_INTERVAL = 3600000; // 1 hour

  private constructor() {
    this.startPeriodicAnalysis();
  }

  public static getInstance(): LearningSystem {
    if (!LearningSystem.instance) {
      LearningSystem.instance = new LearningSystem();
    }
    return LearningSystem.instance;
  }

  async recordFeedback(feedback: ConversationFeedback) {
    this.feedbackBuffer.push(feedback);

    try {
      await supabase
        .from('conversation_feedback')
        .insert([{
          conversation_id: feedback.conversationId,
          helpful: feedback.helpful,
          accuracy: feedback.accuracy,
          comments: feedback.comments,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  private async startPeriodicAnalysis() {
    setInterval(async () => {
      await this.analyzeFeedback();
    }, this.ANALYSIS_INTERVAL);
  }

  private async analyzeFeedback(): Promise<LearningMetrics> {
    try {
      const { data: feedback, error } = await supabase
        .from('conversation_feedback')
        .select('*')
        .gte('timestamp', new Date(Date.now() - this.ANALYSIS_INTERVAL).toISOString());

      if (error) throw error;

      const metrics: LearningMetrics = {
        totalInteractions: feedback.length,
        successfulInteractions: feedback.filter(f => f.helpful).length,
        averageAccuracy: this.calculateAverageAccuracy(feedback),
        commonIssues: await this.identifyCommonIssues(feedback)
      };

      await this.updateLearningModel(metrics);
      return metrics;
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      throw error;
    }
  }

  private calculateAverageAccuracy(feedback: any[]): number {
    return feedback.reduce((acc, f) => acc + f.accuracy, 0) / feedback.length;
  }

  private async identifyCommonIssues(feedback: any[]): Promise<string[]> {
    // Analyze feedback comments for common patterns
    const comments = feedback
      .filter(f => !f.helpful && f.comments)
      .map(f => f.comments);

    // In a real system, this would use NLP to identify common themes
    return ['Response time', 'Accuracy', 'Clarity'];
  }

  private async updateLearningModel(metrics: LearningMetrics) {
    // In a production system, this would:
    // 1. Update the model's training data
    // 2. Adjust response patterns based on successful interactions
    // 3. Implement automated improvements based on metrics
    console.log('Learning model updated with metrics:', metrics);
  }

  public async getLearningMetrics(): Promise<LearningMetrics> {
    return this.analyzeFeedback();
  }
}