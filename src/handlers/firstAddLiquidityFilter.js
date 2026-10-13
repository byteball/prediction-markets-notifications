const getSuppliesFromResponse = require('../utils/getSuppliesFromResponse');

module.exports = (res) => {
    const v = res?.response?.responseVars;
    const aa = res?.aa_address;

    if (!v) {
        console.error(`[pending-markets] firstAddLiquidityFilter: ${aa} no responseVars, reject`);
        return false;
    }

    const supplies = getSuppliesFromResponse(v);
    if (!supplies) {
        console.error(`[pending-markets] firstAddLiquidityFilter: ${aa} no supplies in response`);
        return false;
    }

    const yesAmount = v.yes_amount || 0;
    const noAmount = v.no_amount || 0;
    const drawAmount = v.draw_amount || 0;

    const isFirst = supplies.yes === yesAmount
        && supplies.no === noAmount
        && supplies.draw === drawAmount;

    console.error(
        `[pending-markets] firstAddLiquidityFilter: ${aa} decision=${isFirst}`,
        `supply_yes=${supplies.yes} yes_amount=${yesAmount}`,
        `supply_no=${supplies.no} no_amount=${noAmount}`,
        `supply_draw=${supplies.draw} draw_amount=${drawAmount}`,
    );

    return isFirst;
};
