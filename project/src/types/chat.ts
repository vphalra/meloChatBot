export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
}

export interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  needsHumanSupport: boolean;
}

export interface FeedbackData {
  rating: number;
  category: 'helpful' | 'unclear' | 'incorrect' | 'other';
  comment?: string;
}

export interface KPIMetrics {
  responseTime: number;
  userSatisfaction: number;
  resolutionRate: number;
  handoffRate: number;
  accuracyScore: number;
}