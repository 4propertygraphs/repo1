require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { supabase } = require('./db/supabase');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_ORIGINS ? process.env.FRONTEND_ORIGINS.split(",") : '*'
}));
app.use(bodyParser.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const externalRoutes = require('./routes/externalRoutes');

app.use('/api', userRoutes);
app.use('/api', agencyRoutes);
app.use('/api', externalRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Test Supabase connection
    try {
        const { data, error } = await supabase.from('users').select('count');
        if (error) throw error;
        console.log('✓ Supabase database connected!');
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
    }
});
