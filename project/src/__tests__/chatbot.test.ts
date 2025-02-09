import { describe, it, expect, vi } from 'vitest';
import { needsHumanSupport, generateResponse } from '../utils/chatbot';
import { createConversation, saveMessage, createTicket } from '../utils/database';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => ({
            data: { id: 'test-id' },
            error: null
          })
        })
      }),
      update: () => ({
        eq: () => ({
          data: null,
          error: null
        })
      })
    })
  }
}));

describe('Chatbot Integration Tests', () => {
  it('should detect when human support is needed', async () => {
    const result = await needsHumanSupport('I need to speak with a real person');
    expect(result).toBe(true);
  });

  it('should not require human support for simple queries', async () => {
    const result = await needsHumanSupport('What are your operating hours?');
    expect(result).toBe(false);
  });

  it('should generate appropriate responses', async () => {
    const response = await generateResponse('Tell me about your services');
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
  });
});

describe('Database Integration Tests', () => {
  it('should create a new conversation', async () => {
    const conversation = await createConversation('test-user-id');
    expect(conversation).toBeTruthy();
    expect(conversation.id).toBe('test-id');
  });

  it('should save a message', async () => {
    const message = await saveMessage('test-conversation-id', {
      id: '1',
      content: 'Test message',
      sender: 'user',
      timestamp: new Date()
    });
    expect(message).toBeTruthy();
  });

  it('should create a support ticket', async () => {
    const ticket = await createTicket(
      'test-conversation-id',
      'Test Ticket',
      'Test Description'
    );
    expect(ticket).toBeTruthy();
  });
});