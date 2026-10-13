module.exports = function getSupplies(vars) {
    const s = vars?.supplies;
    if (s && typeof s === 'object') {
        return { yes: s.yes || 0, no: s.no || 0, draw: s.draw || 0 };
    }
    return {
        yes: vars?.supply_yes || 0,
        no: vars?.supply_no || 0,
        draw: vars?.supply_draw || 0,
    };
};
