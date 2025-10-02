require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
    try {
        const hashedPassword = await bcrypt.hash('password', 10);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                username: 'tech',
                email: 'tech@4pm.ie',
                password: hashedPassword
            }])
            .select();

        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log('✅ User created successfully!');
        console.log('Email: tech@4pm.ie');
        console.log('Password: password');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

createUser();
