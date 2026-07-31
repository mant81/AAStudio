INSERT INTO project (id, name, description, status, created_at, updated_at)
SELECT 1, 'AAStudio', 'Dashboard workspace', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM project WHERE id = 1);

INSERT INTO code_group (id, group_code, group_name, description, enabled)
SELECT 1, 'SYSTEM', 'System Codes', 'Common system code group', 'Y'
WHERE NOT EXISTS (SELECT 1 FROM code_group WHERE id = 1);
