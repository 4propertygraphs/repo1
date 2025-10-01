require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const xml2js = require('xml2js');
const { sequelize, User, Property, Agency } = require('./models');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_ORIGINS.split(",") // e.g., "http://localhost:3000,https://example.com"
}));
app.use(bodyParser.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const externalRoutes = require('./routes/externalRoutes');

app.use('/api', userRoutes);
app.use('/api', agencyRoutes);
app.use('/api', externalRoutes);  // Now this exports a router, not an object

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await sequelize.authenticate();
    console.log('Database connected!');
});
