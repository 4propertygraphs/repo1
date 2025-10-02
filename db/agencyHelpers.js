const { supabase } = require('./supabase');

async function createAgency(data) {
    const { data: agency, error } = await supabase
        .from('agencies')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return agency;
}

async function getAllAgencies() {
    const { data, error } = await supabase
        .from('agencies')
        .select('*');

    if (error) throw error;
    return data || [];
}

async function getAgencyByUniqueKey(uniqueKey) {
    const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('unique_key', uniqueKey)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function getAgencyById(id) {
    const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function updateAgency(id, data) {
    const { data: updated, error } = await supabase
        .from('agencies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

async function deleteAgency(id) {
    const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

module.exports = {
    createAgency,
    getAllAgencies,
    getAgencyByUniqueKey,
    getAgencyById,
    updateAgency,
    deleteAgency
};
