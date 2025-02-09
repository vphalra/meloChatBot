/*
  # Chat System Database Schema

  1. New Tables
    - `conversations`
      - Stores chat session data
      - Links to tickets and users
    - `messages`
      - Stores individual chat messages
      - Links to conversations
    - `tickets`
      - Stores support tickets
      - Links conversations to CRM

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated access
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('active', 'waiting_for_agent', 'with_agent', 'closed')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  content text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'bot', 'agent')),
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  status text NOT NULL CHECK (status IN ('open', 'pending', 'resolved', 'closed')) DEFAULT 'open',
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = tickets.conversation_id
    AND conversations.user_id = auth.uid()
  ));