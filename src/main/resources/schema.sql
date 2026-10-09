CREATE TABLE IF NOT EXISTS metric_card (
    id BIGINT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    metric_value VARCHAR(50) NOT NULL,
    trend_text VARCHAR(100) NOT NULL,
    trend_tone VARCHAR(20) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    accent_tone VARCHAR(20) NOT NULL,
    inverse BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT PRIMARY KEY,
    resource_name VARCHAR(150) NOT NULL,
    resource_type VARCHAR(30) NOT NULL,
    action_name VARCHAR(50) NOT NULL,
    action_tone VARCHAR(20) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    relative_time VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS quick_action (
    id BIGINT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    accent_tone VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS status_item (
    id BIGINT PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    value_text VARCHAR(100) NOT NULL,
    tone VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS profile (
    id BIGINT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(120) NOT NULL,
    bio VARCHAR(500) NOT NULL
);

CREATE TABLE IF NOT EXISTS team_member (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS diagram_document (
    diagram_id VARCHAR(100) PRIMARY KEY,
    diagram_name VARCHAR(200) NOT NULL,
    state_json TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
