import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Agent = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'training';
  type: 'chatbot' | 'assistant' | 'automation' | 'custom';
  config: Record<string, any>;
  api_calls: number;
  last_active: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentConnection = {
  id: string;
  agent_id: string;
  connection_type: 'api' | 'webhook' | 'integration';
  connection_name: string;
  connection_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
};
