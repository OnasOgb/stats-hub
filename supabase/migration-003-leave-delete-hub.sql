-- Migration 003: Allow members to leave hubs and admins to delete hubs

-- Members can delete their own membership (leave hub)
DROP POLICY IF EXISTS "Members can leave hubs" ON hub_members;
CREATE POLICY "Members can leave hubs" ON hub_members FOR DELETE
  USING (user_id = auth.uid());

-- Hub creators (admins) can delete their hubs
DROP POLICY IF EXISTS "Admins can delete hubs" ON hubs;
CREATE POLICY "Admins can delete hubs" ON hubs FOR DELETE
  USING (created_by = auth.uid());
