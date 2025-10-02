-- Create tables in Supabase PostgreSQL
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    token VARCHAR(200)
);

-- Agencies table
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
    total_properties INTEGER DEFAULT 0
);

-- Field mappings table
CREATE TABLE IF NOT EXISTS field_mappings (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(255),
    acquaint_crm VARCHAR(255),
    propertydrive VARCHAR(255),
    daft VARCHAR(255),
    myhome VARCHAR(255)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_primary_source ON agencies(primary_source);
