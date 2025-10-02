/*
  # Initial Schema Setup

  1. Tables
    - users: User accounts with authentication
    - agencies: Real estate agency information
    - field_mappings: API field mappings

  2. Security
    - Enable RLS on all tables
    - Add policies for public signup and operations
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    token VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    office_name VARCHAR(255),
    address1 VARCHAR(255),
    address2 VARCHAR(255),
    logo TEXT,
    site VARCHAR(255),
    site_name VARCHAR(255),
    acquaint_site_prefix VARCHAR(50),
    daft_api_key TEXT,
    fourpm_branch_id INTEGER,
    myhome_api_key TEXT,
    myhome_group_id INTEGER,
    unique_key TEXT,
    whmcs_id VARCHAR(255),
    ghl_id VARCHAR(255),
    primary_source VARCHAR(255),
    total_properties INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create field_mappings table
CREATE TABLE IF NOT EXISTS field_mappings (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(255),
    acquaint_crm VARCHAR(255),
    propertydrive VARCHAR(255),
    daft VARCHAR(255),
    myhome VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- Users policies (allow public operations for API)
CREATE POLICY IF NOT EXISTS "Allow public user signup"
    ON users
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public user read"
    ON users
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow public user updates"
    ON users
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Agencies policies (allow public operations)
CREATE POLICY IF NOT EXISTS "Allow public agency read"
    ON agencies
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow public agency insert"
    ON agencies
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public agency update"
    ON agencies
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public agency delete"
    ON agencies
    FOR DELETE
    TO anon
    USING (true);

-- Field mappings policies (allow public operations)
CREATE POLICY IF NOT EXISTS "Allow public field_mappings read"
    ON field_mappings
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow public field_mappings insert"
    ON field_mappings
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_office_name ON agencies(office_name);
CREATE INDEX IF NOT EXISTS idx_agencies_unique_key ON agencies(unique_key);
CREATE INDEX IF NOT EXISTS idx_agencies_primary_source ON agencies(primary_source);

-- Insert test user tech@4pm.ie with password 'password'
INSERT INTO users (username, email, password, created_at, updated_at)
VALUES (
    'tech',
    'tech@4pm.ie',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
