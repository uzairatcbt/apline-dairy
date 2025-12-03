-- Seed frontend personas into multi-tenant tables with matching emails
-- Uses existing tenant NeoRosetta; adds missing sites and users with password 'password'

-- Ensure required sites exist
INSERT INTO sites (site_id, tenant_id, site_name, location)
VALUES
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Mildura', 'Mildura, AU'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Multi-Site', 'Multi-Site'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000001', 'All Sites', 'All Sites')
ON CONFLICT (site_id) DO NOTHING;

-- Reusable password hash for 'password'
DO $$
DECLARE
  pwd TEXT := '$2b$10$C/w0HzoYl8a9kaI0s5mom.K.C21HbFAJseb3CidRubc4QZAlPfMw2';
BEGIN
  -- Regional / multi-site leaders
  INSERT INTO mt_users (tenant_id, site_id, email, full_name, role, password_hash)
  VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a4', 'david.thompson@alpinedairy.com.au', 'David Thompson', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'pierre.petit@alpinedairy.com.au', 'Pierre Petit', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'jennifer.walsh@alpinedairy.com.au', 'Jennifer Walsh', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'robert.chen@alpinedairy.com.au', 'Robert Chen', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'thomas.wright@alpinedairy.com.au', 'Thomas Wright', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'adam.rodriguez@alpinedairy.com.au', 'Adam Rodriguez', 'manager', pwd)
  ON CONFLICT (email) DO NOTHING;

  -- Department managers (Gippsland)
  INSERT INTO mt_users (tenant_id, site_id, email, full_name, role, password_hash)
  VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'ahmed.samir@alpinedairy.com.au', 'Ahmed Samir', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'emma.williams@alpinedairy.com.au', 'Emma Williams', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'marcus.johnson@alpinedairy.com.au', 'Marcus Johnson', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'priya.sharma@alpinedairy.com.au', 'Priya Sharma', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'daniel.hayes@alpinedairy.com.au', 'Daniel Hayes', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'rachel.kim@alpinedairy.com.au', 'Rachel Kim', 'manager', pwd)
  ON CONFLICT (email) DO NOTHING;

  -- Team leaders (Gippsland)
  INSERT INTO mt_users (tenant_id, site_id, email, full_name, role, password_hash)
  VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'michael.chen@alpinedairy.com.au', 'Michael Chen', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'norman.foster@alpinedairy.com.au', 'Norman Foster', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'kevin.obrien@alpinedairy.com.au', 'Kevin OBrien', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'sophie.chen@alpinedairy.com.au', 'Sophie Chen', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'james.wilson@alpinedairy.com.au', 'James Wilson', 'manager', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'lisa.anderson@alpinedairy.com.au', 'Lisa Anderson', 'manager', pwd)
  ON CONFLICT (email) DO NOTHING;

  -- Frontline operators/technicians (Gippsland + guests)
  INSERT INTO mt_users (tenant_id, site_id, email, full_name, role, password_hash)
  VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'sara.mitchell@alpinedairy.com.au', 'Sara Mitchell', 'operator', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'jake.cooper@alpinedairy.com.au', 'Jake Cooper', 'operator', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'tom.bradley@alpinedairy.com.au', 'Tom Bradley', 'operator', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'aisha.patel@alpinedairy.com.au', 'Aisha Patel', 'operator', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'carlos.martinez@alpinedairy.com.au', 'Carlos Martinez', 'operator', pwd),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'alex.morgan@atmservices.com', 'Alex Morgan', 'operator', pwd)
  ON CONFLICT (email) DO NOTHING;
END $$;
