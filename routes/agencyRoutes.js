const express = require('express');
const { Agency } = require('../models');
const externalRoutes = require('./externalRoutes');
const { authenticateToken } = require('../middleware/authMiddleware');
const { fetchExternalProperties, fetchExternalAgencies } = require('../utils/apiHelpers');

const router = express.Router();

// Create a new agency - protected
router.post('/agencies', authenticateToken, async (req, res) => {
    try {
        const agency = await Agency.create(req.body);
        res.status(201).json({
            message: 'Agency created successfully',
            agency
        });
    } catch (err) {
        console.error('Error creating agency:', err);
        res.status(500).json({
            message: 'Error creating agency',
            error: err.message
        });
    }
});

// Get all agencies - protected
router.get('/agencies', authenticateToken, async (req, res) => {
    const agencies = await Agency.findAll();
    res.json(agencies);
});

// Get agency by unique_key from header instead of URL parameter
router.get('/agency', async (req, res) => {
    const uniqueKey = req.headers['key'];

    if (!uniqueKey) {
        return res.status(400).json({ message: 'Missing key header' });
    }

    const agency = await Agency.findOne({
        where: { unique_key: uniqueKey }
    });

    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json(agency);
});

// Keeping the old route for backward compatibility, but marking as deprecated
router.get('/agencies/:unique_key', async (req, res) => {
    const agency = await Agency.findOne({
        where: { unique_key: req.params.unique_key }
    });

    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json(agency);
});

router.put('/agencies/:id', authenticateToken, async (req, res) => {
    const agency = await Agency.findByPk(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    await agency.update(req.body);
    res.json({ message: 'Agency updated successfully' });
});

let isRecountingAll = false;
let isRefreshingAgencies = false; // Flag to prevent multiple concurrent refreshes

// Recount properties for all agencies - protected
router.post('/agencies/recount-properties', authenticateToken, async (req, res) => {
    if (isRecountingAll) {
        return res.status(429).json({ message: 'Recount already in progress. Please wait until it finishes.' });
    }
    isRecountingAll = true;
    try {
        const agencies = await Agency.findAll();
        const errors = [];
        const results = [];
        for (const agency of agencies) {
            if (!agency.unique_key) continue;
            console.log(`Starting recount for agency: ${agency.name} (${agency.unique_key})`);
            let count = 0;
            try {
                const data = await fetchExternalProperties(agency.unique_key);
                if (Array.isArray(data)) {
                    count = data.length;
                }
                console.log(`Fetched ${count} properties for agency: ${agency.name}`);
            } catch (err) {
                console.error(`Error fetching properties for agency: ${agency.name} (${agency.unique_key})`);
                console.error('Error:', err.message);
                if (err.response) {
                    console.error('Status:', err.response.status);
                    console.error('Data:', err.response.data);
                }
                errors.push({
                    agency: agency.name,
                    unique_key: agency.unique_key,
                    error: err.message,
                    stack: err.stack,
                    status: err.response ? err.response.status : undefined,
                    data: err.response ? err.response.data : undefined
                });
            }
            await agency.update({ total_properties: count });
            const updatedAgency = await Agency.findByPk(agency.id);
            console.log(`Updated agency: ${agency.name} (${agency.unique_key}) - total_properties: ${updatedAgency ? updatedAgency.total_properties : null}`);
            results.push({
                agency: agency.name,
                unique_key: agency.unique_key,
                total_properties: updatedAgency ? updatedAgency.total_properties : null
            });
        }
        console.log('Finished recounting all agencies.');
        res.json({ message: 'Property counts updated for all agencies', results, errors });
    } catch (err) {
        console.error('Fatal error in recount-properties:', err);
        res.status(500).json({ message: 'Error recounting properties', error: err.message, stack: err.stack });
    } finally {
        isRecountingAll = false;
    }
});

// Recount properties for a single agency using header
router.post('/agencies/recount-properties/single', authenticateToken, async (req, res) => {
    try {
        const uniqueKey = req.headers['unique-key'];

        if (!uniqueKey) {
            return res.status(400).json({ message: 'Missing unique-key header' });
        }

        const agency = await Agency.findOne({
            where: { unique_key: uniqueKey }
        });

        if (!agency) return res.status(404).json({ message: 'Agency not found' });
        if (!agency.unique_key) return res.status(400).json({ message: 'Agency does not have a unique_key' });

        console.log(`Starting recount for agency: ${agency.name} (${agency.unique_key})`);
        let count = 0;
        try {
            const data = await fetchExternalProperties(agency.unique_key);
            if (Array.isArray(data)) {
                count = data.length;
            }
            console.log(`Fetched ${count} properties for agency: ${agency.name}`);
        } catch (err) {
            console.error(`Error fetching properties for agency: ${agency.name} (${agency.unique_key})`);
            console.error('Error:', err.message);
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', err.response.data);
            }
            return res.status(500).json({
                message: `Failed to fetch properties from external route: ${err.message}`,
                agency: agency.name,
                unique_key: agency.unique_key,
                stack: err.stack,
                status: err.response ? err.response.status : undefined,
                data: err.response ? err.response.data : undefined
            });
        }
        await agency.update({ total_properties: count });
        const updatedAgency = await Agency.findOne({ where: { unique_key: agency.unique_key } });
        console.log(`Updated agency: ${agency.name} (${agency.unique_key}) - total_properties: ${updatedAgency ? updatedAgency.total_properties : null}`);
        res.json({ message: 'Property count updated', total_properties: updatedAgency ? updatedAgency.total_properties : null });
    } catch (err) {
        console.error('Fatal error in recount-properties:', err);
        res.status(500).json({ message: 'Error recounting properties', error: err.message, stack: err.stack });
    }
});

// Keeping old route for backward compatibility
router.post('/agencies/:id/recount-properties', authenticateToken, async (req, res) => {
    console.warn('Deprecated: Using URL parameter for agency recount is deprecated. Use header instead.');
    try {
        const agency = await Agency.findOne({
            where: { id: req.params.id }
        });

        if (!agency) return res.status(404).json({ message: 'Agency not found' });


        console.log(`Starting recount for agency: ${agency.name} (${agency.id})`);
        let count = 0;
        try {
            const data = await fetchExternalProperties(agency.unique_key);
            if (Array.isArray(data)) {
                count = data.length;
            }
            console.log(`Fetched ${count} properties for agency: ${agency.name}`);
        } catch (err) {
            console.error(`Error fetching properties for agency: ${agency.name} (${agency.unique_key})`);
            console.error('Error:', err.message);
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Data:', err.response.data);
            }
            return res.status(500).json({
                message: `Failed to fetch properties from external route: ${err.message}`,
                agency: agency.name,
                unique_key: agency.unique_key,
                stack: err.stack,
                status: err.response ? err.response.status : undefined,
                data: err.response ? err.response.data : undefined
            });
        }
        await agency.update({ total_properties: count });
        const updatedAgency = await Agency.findOne({ where: { unique_key: agency.unique_key } });
        console.log(`Updated agency: ${agency.name} (${agency.unique_key}) - total_properties: ${updatedAgency ? updatedAgency.total_properties : null}`);
        res.json({ message: 'Property count updated', total_properties: updatedAgency ? updatedAgency.total_properties : null });
    } catch (err) {
        console.error('Fatal error in recount-properties:', err);
        res.status(500).json({ message: 'Error recounting properties', error: err.message, stack: err.stack });
    }
});

// Refresh agencies from external API - protected
router.post('/agencies/refresh', authenticateToken, async (req, res) => {
    if (isRefreshingAgencies) {
        return res.status(429).json({
            message: 'Agency refresh already in progress. Please wait until it finishes.'
        });
    }

    isRefreshingAgencies = true;

    try {
        // Get all agencies from external API
        console.log('Fetching agencies from external API...');
        const externalAgencies = await fetchExternalAgencies();
        console.log(`Fetched ${externalAgencies.length} agencies from external API`);

        // Add progress logging
        console.log('Starting to process agencies...');

        // Get all agencies from our database
        const existingAgencies = await Agency.findAll();
        console.log(`Found ${existingAgencies.length} existing agencies in database`);

        // Create a map of existing agencies by OfficeName for faster lookups
        const existingAgenciesByOfficeName = {};
        existingAgencies.forEach(agency => {
            if (agency.office_name) {
                existingAgenciesByOfficeName[agency.office_name.toLowerCase()] = agency;
            }
        });
        console.log(`Created lookup map of ${Object.keys(existingAgenciesByOfficeName).length} agencies by OfficeName`);

        // Track results
        const results = {
            added: [],
            updated: [],
            unchanged: [],
            removed: []
        };

        // Process each external agency
        let processedCount = 0;
        const totalAgencies = externalAgencies.length;
        console.log(`Beginning to process ${totalAgencies} agencies...`);

        for (const externalAgency of externalAgencies) {
            // Log progress every 10 agencies
            processedCount++;
            if (processedCount % 10 === 0 || processedCount === 1 || processedCount === totalAgencies) {
                console.log(`Progress: ${processedCount}/${totalAgencies} agencies processed (${Math.round(processedCount / totalAgencies * 100)}%)`);
            }

            const acquiant = externalAgency.AcquiantCustomer || {};
            const myhome = externalAgency.MyhomeApi || {};
            const officeName = externalAgency.OfficeName || '';

            const agencyData = {
                name: externalAgency.Name,
                office_name: officeName,
                address1: externalAgency.Address1,
                address2: externalAgency.Address2,
                logo: externalAgency.Logo,
                site: externalAgency.Site,
                site_name: acquiant.SiteName,
                acquaint_site_prefix: acquiant.SitePrefix,
                daft_api_key: externalAgency.DaftApiKey,
                fourpm_branch_id: acquiant.FourPMBranchID,
                myhome_api_key: myhome.ApiKey,
                myhome_group_id: myhome.GroupID,
                unique_key: externalAgency.Key
                // Fields not in the API (ghl_id, whmcs_id, primary_source, total_properties)
                // will remain unchanged for existing agencies or null for new ones
            };

            // Check if agency with this OfficeName exists
            const existingAgency = officeName && existingAgenciesByOfficeName[officeName.toLowerCase()];

            if (existingAgency) {
                // Update existing agency
                await existingAgency.update(agencyData);
                console.log(`Updated agency: ${existingAgency.name} (${officeName})`);
                results.updated.push({
                    name: agencyData.name,
                    office_name: officeName,
                    unique_key: agencyData.unique_key
                });
            } else {
                // Create new agency with all available data
                console.log(`Creating new agency: ${agencyData.name} (${officeName})`);
                try {
                    const newAgency = await Agency.create({
                        name: externalAgency.Name,
                        office_name: officeName,
                        address1: externalAgency.Address1,
                        address2: externalAgency.Address2,
                        logo: externalAgency.Logo,
                        site: externalAgency.Site,
                        site_name: acquiant.SiteName,
                        acquaint_site_prefix: acquiant.SitePrefix,
                        daft_api_key: externalAgency.DaftApiKey,
                        fourpm_branch_id: acquiant.FourPMBranchID,
                        myhome_api_key: myhome.ApiKey,
                        myhome_group_id: myhome.GroupID,
                        unique_key: externalAgency.Key,
                        // Initialize default values for fields not in the external API
                        ghl_id: null,
                        whmcs_id: null,
                        primary_source: null,
                        total_properties: 0
                    });

                    console.log(`Added new agency: ${newAgency.name} (${officeName})`);
                    results.added.push({
                        name: newAgency.name,
                        office_name: newAgency.office_name,
                        unique_key: newAgency.unique_key
                    });
                } catch (createErr) {
                    console.error(`Error creating agency "${agencyData.name}":`, createErr.message);
                    // Continue with the next agency instead of failing the entire process
                }
            }
        }

        // Optionally: Remove agencies that are no longer in the external API
        if (req.query.removeDeleted === 'true') {
            console.log('Checking for agencies to remove...');

            // Create a set of office names from external agencies
            const externalOfficeNames = new Set();
            externalAgencies.forEach(agency => {
                if (agency.OfficeName) {
                    externalOfficeNames.add(agency.OfficeName.toLowerCase());
                }
            });

            let removedCount = 0;
            for (const existingAgency of existingAgencies) {
                // Skip agencies without an office_name
                if (!existingAgency.office_name) continue;

                if (!externalOfficeNames.has(existingAgency.office_name.toLowerCase())) {
                    await existingAgency.destroy();
                    removedCount++;
                    results.removed.push({
                        name: existingAgency.name,
                        office_name: existingAgency.office_name,
                        unique_key: existingAgency.unique_key
                    });
                }
            }
            console.log(`Removed ${removedCount} agencies that no longer exist in external source`);
        }

        res.json({
            message: 'Agencies refreshed successfully',
            summary: {
                added: results.added.length,
                updated: results.updated.length,
                unchanged: results.unchanged.length,
                removed: results.removed.length
            },
            results
        });
    } catch (err) {
        console.error('Error refreshing agencies:', err);
        res.status(500).json({
            message: 'Error refreshing agencies',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } finally {
        isRefreshingAgencies = false; // Reset the flag when done, even if there was an error
    }
});

module.exports = router;
