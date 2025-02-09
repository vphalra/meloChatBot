import React, { useState, useRef, useEffect } from 'react';
import { Message, FeedbackData } from './types/chat';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { FeedbackWidget } from './components/FeedbackWidget';
import { generateResponse, needsHumanSupport } from './utils/chatbot';
import { metricsTracker } from './utils/metrics';
import { MessageSquare } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm Melody, your virtual assistant. I'm here to help you explore our occupational therapy services and answer any questions you might have about ADHD support, appointments, or other concerns. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(false);
  const [askedForHuman, setAskedForHuman] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isAffirmativeResponse = (content: string): boolean => {
    const affirmativeWords = ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'please'];
    return affirmativeWords.some(word => content.toLowerCase().includes(word));
  };

  const handleFeedback = async (feedback: FeedbackData) => {
    await metricsTracker.recordFeedback(feedback);
    
    // Show acknowledgment message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: "Thank you for your feedback! We'll use this to improve our service.",
      sender: 'bot',
      timestamp: new Date(),
    }]);
  };

  const handleSendMessage = async (content: string) => {
    const startTime = performance.now();
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      if (askedForHuman) {
        if (isAffirmativeResponse(content)) {
          setNeedsHuman(true);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            content: "I'll connect you with one of our specialists right away. Please stay online, and someone will be with you shortly.",
            sender: 'bot',
            timestamp: new Date(),
          }]);

          // Track handoff metrics
          await metricsTracker.trackMetrics({
            handoffRate: 1,
            resolutionRate: 0
          });
        } else {
          setAskedForHuman(false);
          const response = await generateResponse(content);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            content: response,
            sender: 'bot',
            timestamp: new Date(),
          }]);

          // Track successful bot resolution
          await metricsTracker.trackMetrics({
            handoffRate: 0,
            resolutionRate: 1
          });
        }
      } else {
        const requiresHuman = await needsHumanSupport(content);
        
        if (requiresHuman) {
          setAskedForHuman(true);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            content: "It seems like this might need more detailed assistance. Would you like to speak with one of our human specialists? (Yes/No)",
            sender: 'bot',
            timestamp: new Date(),
          }]);
        } else {
          const response = await generateResponse(content);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            content: response,
            sender: 'bot',
            timestamp: new Date(),
          }]);
        }
      }

      // Track response time
      const endTime = performance.now();
      await metricsTracker.trackMetrics({
        responseTime: endTime - startTime
      });
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm experiencing technical difficulties. Would you like to speak with a human specialist? (Yes/No)",
        sender: 'bot',
        timestamp: new Date(),
      }]);
      setAskedForHuman(true);

      // Track error metrics
      await metricsTracker.trackMetrics({
        accuracyScore: 0,
        resolutionRate: 0
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-purple-600 text-white p-4 flex items-center gap-2">
          <MessageSquare size={24} />
          <h1 className="text-xl font-semibold">Melody - Virtual Assistant</h1>
        </div>

        <div className="h-[500px] overflow-y-auto p-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex gap-2 items-center text-gray-500 text-sm">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <MessageSquare size={18} className="text-purple-600" />
              </div>
              <div>Melody is typing...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          {needsHuman ? (
            <div className="text-center text-gray-600 p-2 bg-purple-50 rounded-lg mb-2">
              A human agent will be with you shortly. Please wait...
            </div>
          ) : (
            <>
              <ChatInput onSend={handleSendMessage} disabled={needsHuman} />
              <FeedbackWidget onSubmit={handleFeedback} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;