-- ============================================================
-- StatsHub — Complete Database Setup
-- Run this SQL in the Supabase Dashboard SQL Editor
-- For existing deployments, use migration-001-multi-tenant.sql instead
-- ============================================================

-- ======================
-- Shared Utilities
-- ======================

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ======================
-- Multi-Tenant Schema
-- ======================

-- Profiles (auto-created from auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Hubs
CREATE TABLE IF NOT EXISTS hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL CHECK (invite_code ~ '^[a-z0-9-]+$'),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, created_by)
);

ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hubs" ON hubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create hubs" ON hubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Hub Members
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

DROP TRIGGER IF EXISTS set_hub_members_updated_at ON hub_members;
CREATE TRIGGER set_hub_members_updated_at BEFORE UPDATE ON hub_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE hub_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read co-members" ON hub_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hub_members AS my
      WHERE my.hub_id = hub_members.hub_id AND my.user_id = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can join hubs" ON hub_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Members can update stats" ON hub_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hub_members AS my
      WHERE my.hub_id = hub_members.hub_id AND my.user_id = auth.uid()
    )
  );

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read hub messages" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hub_members WHERE hub_id = messages.hub_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Members can send messages" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM hub_members WHERE hub_id = messages.hub_id AND user_id = auth.uid()
    )
  );

-- Stat Logs
CREATE TABLE IF NOT EXISTS stat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id uuid NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES hub_members(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stat_type text NOT NULL CHECK (stat_type IN ('goals', 'assists', 'clean_sheets')),
  delta int NOT NULL CHECK (delta IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read stat logs" ON stat_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hub_members WHERE hub_id = stat_logs.hub_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Members can insert stat logs" ON stat_logs FOR INSERT
  WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM hub_members WHERE hub_id = stat_logs.hub_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can delete stat logs" ON stat_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hub_members
      WHERE hub_id = stat_logs.hub_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Hub-scoped RPC functions
CREATE OR REPLACE FUNCTION increment_hub_stat(
  p_member_id uuid,
  p_stat_column text,
  p_hub_id uuid
) RETURNS void AS $$
BEGIN
  IF p_stat_column NOT IN ('goals', 'assists', 'clean_sheets') THEN
    RAISE EXCEPTION 'Invalid stat column: %', p_stat_column;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM hub_members WHERE id = p_member_id AND hub_id = p_hub_id
  ) THEN
    RAISE EXCEPTION 'Member not found in hub';
  END IF;
  EXECUTE format(
    'UPDATE hub_members SET %I = %I + 1 WHERE id = $1',
    p_stat_column, p_stat_column
  ) USING p_member_id;
  INSERT INTO stat_logs (hub_id, member_id, actor_id, stat_type, delta)
  VALUES (p_hub_id, p_member_id, auth.uid(), p_stat_column, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_hub_stat(
  p_member_id uuid,
  p_stat_column text,
  p_hub_id uuid
) RETURNS void AS $$
BEGIN
  IF p_stat_column NOT IN ('goals', 'assists', 'clean_sheets') THEN
    RAISE EXCEPTION 'Invalid stat column: %', p_stat_column;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM hub_members WHERE id = p_member_id AND hub_id = p_hub_id
  ) THEN
    RAISE EXCEPTION 'Member not found in hub';
  END IF;
  EXECUTE format(
    'UPDATE hub_members SET %I = GREATEST(%I - 1, 0) WHERE id = $1',
    p_stat_column, p_stat_column
  ) USING p_member_id;
  INSERT INTO stat_logs (hub_id, member_id, actor_id, stat_type, delta)
  VALUES (p_hub_id, p_member_id, auth.uid(), p_stat_column, -1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public upload') THEN
    CREATE POLICY "Public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'player-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read photos') THEN
    CREATE POLICY "Public read photos" ON storage.objects FOR SELECT USING (bucket_id = 'player-photos');
  END IF;
END $$;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE hub_members;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE stat_logs;
