const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (await User.findOne({ where: { email } })) {
        return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!process.env.SECRET_KEY) {
        return res.status(500).json({ message: 'Server misconfiguration: SECRET_KEY is not set' });
    }
    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '24h' });
    user.token = token;
    await user.save();
    res.json({ token });
});

router.post('/verify_token', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is missing' });
    if (!process.env.SECRET_KEY) {
        return res.status(500).json({ message: 'Server misconfiguration: SECRET_KEY is not set' });
    }
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findByPk(decoded.id);
        if (user && user.token === token) {
            return res.json({ message: 'Token is valid' });
        }
        res.status(401).json({ message: 'Invalid token' });
    } catch (err) {
        res.status(401).json({ message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token' });
    }
});

module.exports = router;
