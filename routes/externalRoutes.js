const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const { supabase } = require('../db/supabase');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Service function to fetch properties from 4pm API - updated to support header
async function fetchExternalProperties(key) {
    if (!key) throw new Error('API key is required');
    const response = await axios.get(
        `https://api2.4pm.ie/api/property/json?Key=${key}`,
    );
    return response.data;
}

// Function to fetch external agencies
async function fetchExternalAgencies() {
    try {
        const url = "https://api2.4pm.ie/api/Agency/GetAgency?Key=RDlaeFVPN004a0hvJTJmWUJIQTN3TVdnJTNkJTNk0";
        const response = await axios.get(url);

        // Remove duplicate items based on Name
        const seen = new Set();
        const uniqueData = response.data.filter(agency => {
            if (seen.has(agency.OfficeName)) {
                return false;
            }
            seen.add(agency.OfficeName);
            return true;
        });

        return uniqueData;
    } catch (error) {
        console.error('Error fetching external agencies:', error);
        throw error;
    }
}

// Updated to use header
router.get('/properties', async (req, res) => {
    // Check header first, then fall back to query parameter
    const key = req.headers['key'];

    if (!key) return res.status(400).json({ message: 'API key is required' });

    try {
        const data = await fetchExternalProperties(key);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch data', error: err.message });
    }
});

router.get('/acquaint', async (req, res) => {
    const { key, id } = req.query;
    if (!key || !id) {
        return res.status(400).json({ message: 'API key and property ID are required' });
    }

    const propertyId = id.startsWith(key) ? id.slice(key.length) : id;
    const properties = [];
    let fileIndex = 0;

    while (true) {
        try {
            const url = `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${key}-${fileIndex}.xml`;
            const response = await axios.get(url);

            if (response.status === 404) break;

            const parsed = await xml2js.parseStringPromise(response.data, {
                explicitArray: false,
                mergeAttrs: true
            });

            const fileProperties = parsed?.data?.properties?.property;
            if (fileProperties) {
                if (Array.isArray(fileProperties)) {
                    properties.push(...fileProperties);
                } else {
                    properties.push(fileProperties); // in case it's just one object
                }
            }
        } catch (err) {
            if (err.response && err.response.status === 404) break;
            return res.status(500).json({
                message: 'Failed to fetch data',
                error: err.message,
                fileIndex
            });
        }

        fileIndex++;
    }

    const property = properties.find((p) => p.id === propertyId);
    if (!property) {
        return res.status(404).json({ message: 'Property not found', propertyId });
    }

    res.json(property);
});

router.get('/acquaint/all', async (req, res) => {
    const { key } = req.query;
    if (!key) {
        return res.status(400).json({ message: 'API key is required' });
    }

    const properties = [];
    let fileIndex = 0;

    while (true) {
        try {
            const url = `https://www.acquaintcrm.co.uk/datafeeds/standardxml/${key}-${fileIndex}.xml`;
            const response = await axios.get(url);

            if (response.status === 404) break;

            const parsed = await xml2js.parseStringPromise(response.data, {
                explicitArray: false,
                mergeAttrs: true
            });

            const fileProperties = parsed?.data?.properties?.property;
            if (fileProperties) {
                if (Array.isArray(fileProperties)) {
                    properties.push(...fileProperties);
                } else {
                    properties.push(fileProperties);
                }
            }
        } catch (err) {
            if (err.response && err.response.status === 404) break;
            return res.status(500).json({
                message: 'Failed to fetch data',
                error: err.message,
                fileIndex
            });
        }
        fileIndex++;
    }

    res.json(properties);
});

// Protected route for field mappings
router.get('/field_mappings', authenticateToken, async (req, res) => {
    try {
        const fieldMappings = await sequelize.query(
            "SELECT * FROM field_mappings",
            { type: QueryTypes.SELECT }
        );
        const result = fieldMappings.map(row => ({
            id: row.id,
            field_name: row.field_name,
            acquaint_crm: row.acquaint_crm,
            propertydrive: row.propertydrive,
            daft: row.daft,
            myhome: row.myhome
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch field mappings', error: error.message });
    }
});

// Add a new field mapping - protected
router.post('/field_mappings', authenticateToken, async (req, res) => {
    const { field_name, acquaint_crm, propertydrive, daft, myhome } = req.body;
    if (!field_name) {
        return res.status(400).json({ message: 'field_name is required' });
    }
    try {
        const [result] = await sequelize.query(
            `INSERT INTO field_mappings (field_name, acquaint_crm, propertydrive, daft, myhome)
             VALUES (:field_name, :acquaint_crm, :propertydrive, :daft, :myhome);`,
            {
                replacements: { field_name, acquaint_crm, propertydrive, daft, myhome },
                type: QueryTypes.INSERT
            }
        );
        // Get the inserted row (MySQL: result is insertId)
        const insertedRows = await sequelize.query(
            `SELECT * FROM field_mappings WHERE id = LAST_INSERT_ID();`,
            { type: QueryTypes.SELECT }
        );
        res.status(201).json(insertedRows[0] || {});
    } catch (error) {
        res.status(500).json({ message: 'Failed to add field mapping', error: error.message });
    }
});

// Edit an existing field mapping - protected
router.put('/field_mappings/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { field_name, acquaint_crm, propertydrive, daft, myhome } = req.body;
    try {
        const [result] = await sequelize.query(
            `UPDATE field_mappings
             SET field_name = :field_name,
                 acquaint_crm = :acquaint_crm,
                 propertydrive = :propertydrive,
                 daft = :daft,
                 myhome = :myhome
             WHERE id = :id;`,
            {
                replacements: { id, field_name, acquaint_crm, propertydrive, daft, myhome },
                type: QueryTypes.UPDATE
            }
        );
        // Check if any row was updated
        const updatedRows = await sequelize.query(
            `SELECT * FROM field_mappings WHERE id = :id;`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        if (!updatedRows[0]) {
            return res.status(404).json({ message: 'Field mapping not found' });
        }
        res.json(updatedRows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update field mapping', error: error.message });
    }
});

// Delete a field mapping - protected
router.delete('/field_mappings/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Get the row before deleting
        const toDeleteRows = await sequelize.query(
            `SELECT * FROM field_mappings WHERE id = :id;`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        if (!toDeleteRows[0]) {
            return res.status(404).json({ message: 'Field mapping not found' });
        }
        await sequelize.query(
            `DELETE FROM field_mappings WHERE id = :id;`,
            { replacements: { id }, type: QueryTypes.DELETE }
        );
        res.json({ message: 'Field mapping deleted', deleted: toDeleteRows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete field mapping', error: error.message });
    }
});

router.get('/myhome', async (req, res) => {
    const { key, id } = req.query;
    if (!key || !id) {
        return res.status(400).json({ message: 'API key and ID are required' });
    }

    const url = `https://agentapi.myhome.ie/property/${key}/${id}?format=json`;
    try {
        const response = await axios.get(url);
        res.json(response.data); // Return the parsed JSON response
    } catch (err) {
        if (err.response) {
            res.status(500).json({
                message: 'Failed to fetch data from the external API',
                error: err.message,
                status: err.response.status,
                response: err.response.data
            });
        } else {
            res.status(500).json({
                message: 'Failed to fetch data from the external API',
                error: err.message
            });
        }
    }
});

// Helper for Daft API base URL
function getDaftApiBaseUrl() {
    return process.env.NODE_ENV === 'production'
        ? 'https://daftapi.4pm.ie'
        : 'http://localhost:5050';
}

router.get('/daft', async (req, res) => {
    const { key, id } = req.query;
    if (!key) {
        return res.status(400).json({ message: 'apiKey is required' });
    }
    let url;

    url = `${getDaftApiBaseUrl()}/property/${encodeURIComponent(id)}?key=${encodeURIComponent(key)}`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (err) {
        if (err.response) {
            res.status(500).json({
                message: 'Failed to fetch data from the Daft API',
                error: err.message,
                status: err.response.status,
                response: err.response.data
            });
        } else {
            res.status(500).json({
                message: 'Failed to fetch data from the Daft API',
                error: err.message
            });
        }
    }
});

router.get('/daft/all', async (req, res) => {
    const { apiKey } = req.query;
    if (!apiKey) {
        return res.status(400).json({ message: 'apiKey is required' });
    }
    const url = `${getDaftApiBaseUrl()}/property?key=${encodeURIComponent(apiKey)}`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (err) {
        if (err.response) {
            res.status(500).json({
                message: 'Failed to fetch data from the Daft API',
                error: err.message,
                status: err.response.status,
                response: err.response.data
            });
        } else {
            res.status(500).json({
                message: 'Failed to fetch data from the Daft API',
                error: err.message
            });
        }
    }
});

// Export both the router and the utility functions
module.exports = router;

// Also attach the utility functions to the router for import elsewhere
router.fetchExternalProperties = fetchExternalProperties;
router.fetchExternalAgencies = fetchExternalAgencies;
