-- Seed minimal data for local development
INSERT INTO teams (name, description)
VALUES
    ('Ops', 'Operations team'),
    ('Engineering', 'Engineering team')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (email, full_name, role, password_hash)
VALUES
    ('admin@example.com', 'Admin User', 'admin', 'replace-with-real-hash'),
    ('user@example.com', 'Demo User', 'user', 'replace-with-real-hash')
ON CONFLICT (email) DO NOTHING;

-- Map users to teams
INSERT INTO user_teams (user_id, team_id)
SELECT u.id, t.id
FROM users u
JOIN teams t ON t.name = 'Ops'
WHERE u.email = 'admin@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_teams (user_id, team_id)
SELECT u.id, t.id
FROM users u
JOIN teams t ON t.name = 'Engineering'
WHERE u.email = 'user@example.com'
ON CONFLICT DO NOTHING;

-- Sample tasks
INSERT INTO tasks (title, description, status, assigned_to, team_id, due_date)
SELECT 'Create baseline SOP', 'Document SOP for daily ops', 'in_progress', u.id, t.id, NOW() + interval '2 days'
FROM users u
JOIN teams t ON t.name = 'Ops'
WHERE u.email = 'admin@example.com'
ON CONFLICT DO NOTHING;
