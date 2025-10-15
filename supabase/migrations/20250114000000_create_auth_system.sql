/*
  # Create Authentication System Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - References auth.users(id)
      - `email` (text) - User email (denormalized for easier queries)
      - `full_name` (text) - User's full name
      - `avatar_url` (text) - User's avatar URL
      - `subscription_tier` (text) - Subscription level: 'free', 'pro', 'enterprise'
      - `agent_limit` (integer) - Maximum number of agents allowed
      - `api_calls_used` (integer) - Number of API calls used this month
      - `api_calls_limit` (integer) - Monthly API calls limit
      - `last_login` (timestamptz) - Last login timestamp
      - `created_at` (timestamptz) - Profile creation timestamp
      - `updated_at` (timestamptz) - Last profile update timestamp

    - `user_sessions`
      - `id` (uuid, primary key) - Session identifier
      - `user_id` (uuid, foreign key) - References auth.users(id)
      - `device_info` (jsonb) - Device and browser information
      - `ip_address` (inet) - User's IP address
      - `is_active` (boolean) - Whether session is active
      - `expires_at` (timestamptz) - Session expiration
      - `created_at` (timestamptz) - Session creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create triggers for automatic profile creation
    - Add session management functions
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  agent_limit integer DEFAULT 1,
  api_calls_used integer DEFAULT 0,
  api_calls_limit integer DEFAULT 1000,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_info jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  is_active boolean DEFAULT true,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles table
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for user_sessions table
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON user_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.user_profiles
  SET last_login = now(), updated_at = now()
  WHERE id = new.user_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create session
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_device_info jsonb DEFAULT '{}'::jsonb,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Deactivate old sessions for this user
  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = auth.uid() AND is_active = true;
  
  -- Create new session
  INSERT INTO user_sessions (user_id, device_info, ip_address)
  VALUES (auth.uid(), p_device_info, p_ip_address)
  RETURNING id INTO session_id;
  
  -- Update last login
  PERFORM public.update_last_login();
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user subscription limits
CREATE OR REPLACE FUNCTION public.check_user_limits()
RETURNS TABLE (
  can_create_agent boolean,
  can_make_api_call boolean,
  agents_count integer,
  api_calls_used integer,
  api_calls_limit integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM agents WHERE user_id = auth.uid()) < up.agent_limit as can_create_agent,
    up.api_calls_used < up.api_calls_limit as can_make_api_call,
    (SELECT COUNT(*) FROM agents WHERE user_id = auth.uid()) as agents_count,
    up.api_calls_used,
    up.api_calls_limit
  FROM user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment API calls
CREATE OR REPLACE FUNCTION public.increment_api_calls()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET api_calls_used = api_calls_used + 1, updated_at = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert default subscription tiers data (optional)
INSERT INTO user_profiles (id, email, full_name, subscription_tier, agent_limit, api_calls_limit)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'free',
  1,
  1000
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
