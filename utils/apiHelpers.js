const axios = require('axios');

// Service function to fetch properties from 4pm API
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

module.exports = {
    fetchExternalProperties,
    fetchExternalAgencies
};
