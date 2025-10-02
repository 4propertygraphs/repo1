const jwt = require('jsonwebtoken');
const { supabase } = require('../db/supabase');

const authenticateToken = async (req, res, next) => {
    const token = req.headers['token'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!process.env.SECRET_KEY) {
        return res.status(500).json({ message: 'Server misconfiguration: SECRET_KEY is not set' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .maybeSingle();

        if (error || !user || user.token !== token) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({
            message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token'
        });
    }
};

module.exports = { authenticateToken };
