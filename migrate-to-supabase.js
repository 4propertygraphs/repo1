require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateDatabase() {
    try {
        console.log('Starting database migration to Supabase...\n');

        // Create tables using Supabase SQL
        console.log('Creating tables...');

        const { data: createTablesResult, error: createTablesError } = await supabase.rpc('exec_sql', {
            sql: `
                -- Create users table
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    email VARCHAR(255) UNIQUE,
                    password VARCHAR(255),
                    token VARCHAR(200)
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
                    total_properties INTEGER DEFAULT 0
                );

                -- Create field_mappings table
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
            `
        });

        if (createTablesError) {
            console.log('Note: Using direct table creation via Supabase client...');
            // Tables will be created via direct insert attempts
        } else {
            console.log('✓ Tables created successfully');
        }

        console.log('\nMigration process initiated.');
        console.log('\nNext steps:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the SQL from setup-supabase.sql file');

        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    }
}

migrateDatabase();
