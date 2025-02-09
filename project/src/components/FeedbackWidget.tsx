import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { FeedbackData } from '../types/chat';

interface FeedbackWidgetProps {
  onSubmit: (feedback: FeedbackData) => void;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackData['category']>('helpful');
  const [comment, setComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, category, comment });
    setIsExpanded(false);
    setRating(0);
    setCategory('helpful');
    setComment('');
  };

  return (
    <div className="mt-4 border-t pt-4">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-purple-600 text-sm flex items-center gap-2 hover:text-purple-700"
        >
          <MessageSquare size={16} />
          How was this conversation?
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate your experience
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`p-1 ${
                    rating >= value ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star size={20} fill={rating >= value ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What best describes your experience?
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackData['category'])}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            >
              <option value="helpful">Helpful</option>
              <option value="unclear">Unclear</option>
              <option value="incorrect">Incorrect Information</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              rows={3}
              placeholder="Tell us more about your experience..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-purple-700"
            >
              Submit Feedback
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};