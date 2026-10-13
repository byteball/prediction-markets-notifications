const getSupplies = require('./getSupplies');

// v1 agents return supply_yes/supply_no/supply_draw in responseVars,
// v2 agents (token + tokenless) only have the supplies inside the JSON `event` response var
module.exports = function getSuppliesFromResponse(responseVars) {
    if (!responseVars) return null;
    if ('supply_yes' in responseVars) return getSupplies(responseVars);
    if (typeof responseVars.event !== 'string') return null;
    try {
        const event = JSON.parse(responseVars.event);
        if (!event?.supplies || typeof event.supplies !== 'object') return null;
        return getSupplies({ supplies: event.supplies });
    } catch (e) {
        return null;
    }
};
