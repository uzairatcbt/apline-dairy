-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites
CREATE TABLE IF NOT EXISTS sites (
    site_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (multi-tenant)
CREATE TABLE IF NOT EXISTS mt_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- operator | manager
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actions (multi-tenant)
CREATE TABLE IF NOT EXISTS actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, completed
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES mt_users(user_id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES mt_users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actions_updated_at
BEFORE UPDATE ON actions
FOR EACH ROW EXECUTE FUNCTION set_actions_updated_at();

-- Seed tenants and sites
INSERT INTO tenants (tenant_id, tenant_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'NeoRosetta')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO sites (site_id, tenant_id, site_name, location)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Gippsland', 'Gippsland, AU'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 'Adelaide', 'Adelaide, AU')
ON CONFLICT (site_id) DO NOTHING;

-- bcrypt hash for password "password" (cost 10)
-- Generated once; replace with real secrets in production
INSERT INTO mt_users (user_id, tenant_id, site_id, email, full_name, role, password_hash)
VALUES
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'john@gippsland.com', 'John (Operator)', 'operator', '$2b$10$C/w0HzoYl8a9kaI0s5mom.K.C21HbFAJseb3CidRubc4QZAlPfMw2'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'sarah@gippsland.com', 'Sarah (Manager)', 'manager', '$2b$10$C/w0HzoYl8a9kaI0s5mom.K.C21HbFAJseb3CidRubc4QZAlPfMw2'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'ahmed@adelaide.com', 'Ahmed (Manager)', 'manager', '$2b$10$C/w0HzoYl8a9kaI0s5mom.K.C21HbFAJseb3CidRubc4QZAlPfMw2')
ON CONFLICT (user_id) DO NOTHING;

-- Seed an action at Gippsland assigned to Sarah
INSERT INTO actions (action_id, tenant_id, site_id, title, description, status, priority, due_date, created_by, assigned_to)
VALUES (
  '00000000-0000-0000-0000-0000000000d1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000a1',
  'Inspect blending valve on Line 3',
  'Noticed unusual pressure readings',
  'open',
  'high',
  NOW() + interval '2 days',
  '00000000-0000-0000-0000-0000000000c1', -- John
  '00000000-0000-0000-0000-0000000000c2'  -- Sarah
)
ON CONFLICT (action_id) DO NOTHING;
