INSERT INTO metric_card (id, title, metric_value, trend_text, trend_tone, icon_name, accent_tone, inverse) VALUES
(1, 'Active APIs', '24', '+3 this week', 'positive', 'api', 'api', FALSE),
(2, 'DB Entities', '156', 'Unchanged', 'neutral', 'database', 'db', FALSE),
(3, 'Team Members', '08', '+1 this week', 'positive', 'group', 'logic', FALSE),
(4, 'System Health', '99.9%', 'Stable', 'positive', 'health_and_safety', 'db', TRUE);

INSERT INTO activity_log (id, resource_name, resource_type, action_name, action_tone, user_name, relative_time) VALUES
(1, '/api/v1/users', 'api', 'Updated', 'positive', 'Sarah J.', '10m ago'),
(2, 'users_table', 'database', 'Modified', 'warning', 'Mike R.', '1h ago'),
(3, 'Auth Flow Diagram', 'diagram', 'Created', 'neutral', 'Alex A.', '3h ago');

INSERT INTO quick_action (id, title, icon_name, accent_tone) VALUES
(1, 'New API Endpoint', 'add_box', 'api'),
(2, 'Create DB Model', 'table_chart', 'db'),
(3, 'New Diagram', 'account_tree', 'neutral');

INSERT INTO status_item (id, label, value_text, tone) VALUES
(1, 'Build Pipeline', 'Healthy', 'positive'),
(2, 'Database Sync', '2 pending migrations', 'warning'),
(3, 'UAT Schedule', 'Tomorrow 14:00', 'neutral');

INSERT INTO profile (id, first_name, last_name, email, bio) VALUES
(1, 'Alex', 'Architect', 'alex@aastudio.com', 'Lead Systems Architect focusing on scalable microservices and database modeling.');

INSERT INTO team_member (id, name, email, role) VALUES
(1, 'Sarah Chen', 'sarah@aastudio.com', 'Owner'),
(2, 'Marcus Johnson', 'marcus@aastudio.com', 'Editor'),
(3, 'Nina Park', 'nina@aastudio.com', 'Viewer');
