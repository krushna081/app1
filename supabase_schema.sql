-- ============================================
-- SecureGate Database Schema for Supabase
-- ============================================

-- 1. TABLES
-- ---------

CREATE TABLE societies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE flats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flat_number TEXT NOT NULL,
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guard', 'resident')),
  society_id UUID REFERENCES societies(id) ON DELETE SET NULL,
  flat_id UUID REFERENCES flats(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  visitor_type TEXT NOT NULL,
  photo_url TEXT,
  flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  created_by_guard_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'entered', 'exited')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visitor_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  previous_status TEXT CHECK (previous_status IN ('pending', 'approved', 'rejected', 'entered', 'exited')),
  new_status TEXT NOT NULL CHECK (new_status IN ('pending', 'approved', 'rejected', 'entered', 'exited')),
  changed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- 2. INDEXES
-- ----------

CREATE INDEX idx_flats_society_id ON flats(society_id);
CREATE INDEX idx_flats_resident_id ON flats(resident_id);
CREATE INDEX idx_profiles_society_id ON profiles(society_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_visitors_flat_id ON visitors(flat_id);
CREATE INDEX idx_visitors_society_id ON visitors(society_id);
CREATE INDEX idx_visitors_status ON visitors(status);
CREATE INDEX idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX idx_visitor_status_history_visitor_id ON visitor_status_history(visitor_id);


-- 3. AUTO-CREATE PROFILE ON USER SIGNUP
-- ---------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'resident')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- 4. ROW LEVEL SECURITY
-- -----------------------

ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_status_history ENABLE ROW LEVEL SECURITY;

-- Societies: authenticated users can read; only admins can insert/update/delete
CREATE POLICY "Societies are readable by all authenticated users"
  ON societies FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Societies are insertable by admins only"
  ON societies FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Societies are updatable by admins only"
  ON societies FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Societies are deletable by admins only"
  ON societies FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Flats: users can read flats in their own society; admins can manage all
CREATE POLICY "Flats are readable by members of the same society"
  ON flats FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND society_id = flats.society_id
    )
  );

CREATE POLICY "Flats are insertable by admins"
  ON flats FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Flats are updatable by admins"
  ON flats FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Flats are deletable by admins"
  ON flats FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Profiles: users can read own profile; admins in same society can read;
--           only the trigger or admins can insert
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can read profiles in their society"
  ON profiles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.society_id = profiles.society_id
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Visitors: guards can insert visitors; residents can view visitors for their flat
CREATE POLICY "Guards can insert visitors"
  ON visitors FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'guard'
    )
  );

CREATE POLICY "Users can view visitors for their flat"
  ON visitors FOR SELECT USING (
    flat_id IN (
      SELECT id FROM flats WHERE resident_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'guard')
        AND society_id = visitors.society_id
    )
  );

CREATE POLICY "Residents can update visitor status (approve/reject)"
  ON visitors FOR UPDATE USING (
    flat_id IN (
      SELECT id FROM flats WHERE resident_id = auth.uid()
    )
  );

CREATE POLICY "Guards can update visitor entry/exit status"
  ON visitors FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'guard'
        AND society_id = visitors.society_id
    )
  );

-- Visitor Status History: insertable by authenticated; readable by linked users
CREATE POLICY "Authenticated users can insert status history"
  ON visitor_status_history FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view status history for their visitors"
  ON visitor_status_history FOR SELECT USING (
    visitor_id IN (
      SELECT id FROM visitors
      WHERE flat_id IN (
        SELECT id FROM flats WHERE resident_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'guard')
    )
  );


-- 5. STORAGE BUCKET & POLICIES
-- ------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('visitor-photos', 'visitor-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload visitor photos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'visitor-photos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view visitor photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'visitor-photos');


-- 6. ENABLE REALTIME FOR VISITORS TABLE
-- ---------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE visitor_status_history;


-- 7. SAMPLE DATA (optional)
-- --------------------------

-- Create an admin user first via Supabase Auth / Sign Up,
-- then run this manually after getting the user UUID:
--
-- INSERT INTO societies (id, name, address) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Green Valley Apartments', '123 Main Street, Springfield');
--
-- UPDATE profiles SET role = 'admin', society_id = '00000000-0000-0000-0000-000000000001'
-- WHERE id = '<admin-user-uuid>';
--
-- INSERT INTO flats (flat_number, society_id) VALUES
--   ('A-101', '00000000-0000-0000-0000-000000000001'),
--   ('A-102', '00000000-0000-0000-0000-000000000001');
