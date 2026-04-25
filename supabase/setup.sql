-- ============================================================
-- StatsHub — PRODUCTION-STABLE SETUP (Final Idempotent Version)
-- ============================================================

-- 1. FUNCTIONS & TRIGGERS (Safe to RE-REPLACE)
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Player'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_hub_admin() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.hub_members (hub_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (hub_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_hub_stat(p_member_id uuid, p_stat_column text, p_hub_id uuid) 
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM hub_members WHERE hub_id = p_hub_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  EXECUTE format('UPDATE hub_members SET %I = %I + 1 WHERE id = $1', p_stat_column, p_stat_column) USING p_member_id;
  
  INSERT INTO stat_logs (hub_id, member_id, actor_id, stat_type, delta)
  VALUES (p_hub_id, p_member_id, auth.uid(), p_stat_column, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_hub_created ON public.hubs;
CREATE TRIGGER on_hub_created 
  AFTER INSERT ON public.hubs
  FOR EACH ROW EXECUTE FUNCTION handle_new_hub_admin();

-- 2. TABLES (Safe to run, won't delete data)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL CHECK (invite_code ~ '^[a-z0-9-]+$'),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, created_by)
);

CREATE TABLE IF NOT EXISTS hub_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  clean_sheets int NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hub_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES hub_members(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stat_type text NOT NULL CHECK (stat_type IN ('goals', 'assists', 'clean_sheets')),
  delta int NOT NULL CHECK (delta IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS POLICIES (Guarded)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles" ON profiles;
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view hubs" ON hubs;
CREATE POLICY "Anyone can view hubs" ON hubs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth create hub" ON hubs;
CREATE POLICY "Auth create hub" ON hubs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Members viewable by all" ON hub_members;
CREATE POLICY "Members viewable by all" ON hub_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join hubs" ON hub_members;
CREATE POLICY "Users can join hubs" ON hub_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. REALTIME (The Guarded Logic)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'hub_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'stat_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stat_logs;
  END IF;
END $$;

-- 5. CATCH-UP SYNC
INSERT INTO public.profiles (id, name, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'New Player'), COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users ON CONFLICT (id) DO NOTHING;