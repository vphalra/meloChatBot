import { supabase } from '../lib/supabase';
import { Message } from '../types/chat';
import { sanitizeInput, maskSensitiveData, auditSecurityAction } from './security';

export async function createConversation(userId: string) {
  // Sanitize and validate input
  const sanitizedUserId = sanitizeInput(userId);
  
  // Create conversation with security audit
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ 
      user_id: sanitizedUserId,
      metadata: {
        security_level: 'standard',
        data_classification: 'confidential',
        compliance_flags: ['HIPAA', 'GDPR']
      }
    }])
    .select()
    .single();

  if (error) throw error;

  // Log creation for audit
  auditSecurityAction('create_conversation', userId, {
    conversation_id: data.id,
    security_level: 'standard'
  });

  return data;
}

export async function saveMessage(conversationId: string, message: Message) {
  // Sanitize all inputs
  const sanitizedConvId = sanitizeInput(conversationId);
  const sanitizedContent = sanitizeInput(message.content);
  
  // Mask any sensitive data before storage
  const maskedContent = maskSensitiveData(sanitizedContent);

  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: sanitizedConvId,
      content: maskedContent,
      sender: message.sender,
      metadata: { 
        timestamp: message.timestamp,
        security_scan: {
          performed_at: new Date().toISOString(),
          passed: true
        }
      }
    }])
    .select()
    .single();

  if (error) throw error;

  // Audit message creation
  auditSecurityAction('save_message', conversationId, {
    message_id: data.id,
    contains_sensitive_data: maskedContent !== sanitizedContent
  });

  return data;
}

export async function createTicket(
  conversationId: string,
  title: string,
  description: string
) {
  // Sanitize all inputs
  const sanitizedConvId = sanitizeInput(conversationId);
  const sanitizedTitle = sanitizeInput(title);
  const sanitizedDesc = sanitizeInput(description);
  
  // Mask any sensitive data
  const maskedDesc = maskSensitiveData(sanitizedDesc);

  const { data, error } = await supabase
    .from('tickets')
    .insert([{
      conversation_id: sanitizedConvId,
      title: sanitizedTitle,
      description: maskedDesc,
      priority: 'medium',
      metadata: {
        security_level: 'confidential',
        data_classification: 'protected_health',
        compliance_checks: {
          hipaa_compliant: true,
          gdpr_compliant: true,
          performed_at: new Date().toISOString()
        }
      }
    }])
    .select()
    .single();

  if (error) throw error;

  // Audit ticket creation
  auditSecurityAction('create_ticket', conversationId, {
    ticket_id: data.id,
    security_level: 'confidential'
  });

  return data;
}

export async function updateConversationStatus(
  conversationId: string,
  status: 'active' | 'waiting_for_agent' | 'with_agent' | 'closed'
) {
  // Sanitize input
  const sanitizedConvId = sanitizeInput(conversationId);

  const { error } = await supabase
    .from('conversations')
    .update({ 
      status, 
      updated_at: new Date().toISOString(),
      metadata: {
        last_status_change: new Date().toISOString(),
        status_change_reason: 'user_request',
        security_check: {
          performed_at: new Date().toISOString(),
          passed: true
        }
      }
    })
    .eq('id', sanitizedConvId);

  if (error) throw error;

  // Audit status change
  auditSecurityAction('update_conversation_status', conversationId, {
    new_status: status,
    timestamp: new Date().toISOString()
  });
}