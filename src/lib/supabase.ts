import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  agent_limit: number;
  api_calls_used: number;
  api_calls_limit: number;
  last_login?: string;
  created_at: string;
  updated_at: string;
};

export type UserSession = {
  id: string;
  user_id: string;
  device_info: Record<string, any>;
  ip_address?: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
};

export type AgentInstructions = {
  id: string;
  agent_id: string;
  instructions: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  agent_id: string;
  user_id: string;
  message: string;
  is_from_user: boolean;
  created_at: string;
};

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Create session and update last login
      await this.createSession();
    }
    
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get user profile
  async getUserProfile(userId?: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId || (await this.getCurrentUser()).user?.id)
      .single();
    return { data, error };
  },

  // Create user session
  async createSession(deviceInfo?: Record<string, any>, ipAddress?: string) {
    const { data, error } = await supabase.rpc('create_user_session', {
      p_device_info: deviceInfo || {},
      p_ip_address: ipAddress || null,
    });
    return { data, error };
  },

  // Check user limits
  async checkUserLimits() {
    const { data, error } = await supabase.rpc('check_user_limits');
    return { data, error };
  },

  // Increment API calls
  async incrementApiCalls() {
    const { error } = await supabase.rpc('increment_api_calls');
    return { error };
  },

  // Update user profile
  async updateProfile(updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', (await this.getCurrentUser()).user?.id)
      .select()
      .single();
    return { data, error };
  },

  // Get user sessions
  async getUserSessions() {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', (await this.getCurrentUser()).user?.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Deactivate session
  async deactivateSession(sessionId: string) {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
    return { error };
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  },
};
