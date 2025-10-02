require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
    console.log('Creating tables in Supabase...\n');

    try {
        // Create users table
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (usersError && usersError.code === 'PGRST116') {
            console.log('⚠️  Tables need to be created via Supabase Dashboard SQL Editor');
            console.log('\nPlease run this SQL in your Supabase Dashboard > SQL Editor:\n');
            console.log(`
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_agencies_name ON agencies(name);
CREATE INDEX IF NOT EXISTS idx_agencies_primary_source ON agencies(primary_source);
            `);
            return;
        }

        console.log('✓ Tables already exist or were created successfully!');

        // Test connection
        console.log('\nTesting connection to tables...');
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        console.log(`✓ Users table: ${usersCount || 0} records`);

        const { count: agenciesCount } = await supabase
            .from('agencies')
            .select('*', { count: 'exact', head: true });
        console.log(`✓ Agencies table: ${agenciesCount || 0} records`);

        const { count: fieldMappingsCount } = await supabase
            .from('field_mappings')
            .select('*', { count: 'exact', head: true });
        console.log(`✓ Field mappings table: ${fieldMappingsCount || 0} records`);

        console.log('\n✅ Database is ready!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTables();
