
  # Create AI Agents Platform Schema

  1. New Tables
    - `agents`
      - `id` (uuid, primary key) - Unique identifier for each agent
      - `user_id` (uuid, foreign key) - References auth.users
      - `name` (text) - Agent name
      - `description` (text) - Agent description
      - `status` (text) - Agent status: 'active', 'inactive', 'training'
      - `type` (text) - Agent type: 'chatbot', 'assistant', 'automation', 'custom'
      - `config` (jsonb) - Agent configuration settings
      - `api_calls` (integer) - Number of API calls made
      - `last_active` (timestamptz) - Last time agent was active
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

    - `agent_connections`
      - `id` (uuid, primary key) - Unique identifier
      - `agent_id` (uuid, foreign key) - References agents
      - `connection_type` (text) - Type of connection: 'api', 'webhook', 'integration'
      - `connection_name` (text) - Name of the connection
      - `connection_config` (jsonb) - Connection configuration
      - `is_active` (boolean) - Whether connection is active
      - `created_at` (timestamptz) - Timestamp of creation

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own agents
    - Users can only access their own agents and connections
*/

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'training')),
  type text DEFAULT 'chatbot' CHECK (type IN ('chatbot', 'assistant', 'automation', 'custom')),
  config jsonb DEFAULT '{}'::jsonb,
  api_calls integer DEFAULT 0,
  last_active timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_connections table
CREATE TABLE IF NOT EXISTS agent_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  connection_type text NOT NULL CHECK (connection_type IN ('api', 'webhook', 'integration')),
  connection_name text NOT NULL,
  connection_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_connections ENABLE ROW LEVEL SECURITY;

-- Policies for agents table
CREATE POLICY "Users can view own agents"
  ON agents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for agent_connections table
CREATE POLICY "Users can view own agent connections"
  ON agent_connections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_connections.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own agent connections"
  ON agent_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_connections.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own agent connections"
  ON agent_connections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_connections.agent_id
      AND agents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_connections.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own agent connections"
  ON agent_connections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_connections.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_connections_agent_id ON agent_connections(agent_id);