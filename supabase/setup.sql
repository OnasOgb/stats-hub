-- ============================================================
-- Strider FC — Supabase Database Setup
-- Run this SQL in the Supabase Dashboard SQL Editor
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text DEFAULT '',
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  clean_sheets int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON players;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment RPC
CREATE OR REPLACE FUNCTION increment_stat(player_id uuid, stat_column text) RETURNS void AS $$
BEGIN
  IF stat_column NOT IN ('goals', 'assists', 'clean_sheets') THEN
    RAISE EXCEPTION 'Invalid stat column: %', stat_column;
  END IF;
  EXECUTE format('UPDATE players SET %I = %I + 1 WHERE id = $1', stat_column, stat_column) USING player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement RPC
CREATE OR REPLACE FUNCTION decrement_stat(player_id uuid, stat_column text) RETURNS void AS $$
BEGIN
  IF stat_column NOT IN ('goals', 'assists', 'clean_sheets') THEN
    RAISE EXCEPTION 'Invalid stat column: %', stat_column;
  END IF;
  EXECUTE format('UPDATE players SET %I = GREATEST(%I - 1, 0) WHERE id = $1', stat_column, stat_column) USING player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS (honor system - public access)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Public read') THEN
    CREATE POLICY "Public read" ON players FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Public insert') THEN
    CREATE POLICY "Public insert" ON players FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Public update') THEN
    CREATE POLICY "Public update" ON players FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

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
ALTER PUBLICATION supabase_realtime ADD TABLE players;
