import React from 'react';
import { Message } from '../types/chat';
import { MessageSquare, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isBot ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
        {isBot ? <MessageSquare size={18} /> : <User size={18} />}
      </div>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        isBot ? 'bg-purple-50 text-gray-800' : 'bg-gray-100 text-gray-800'
      }`}>
        <div 
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
        <span className="text-xs text-gray-500 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}