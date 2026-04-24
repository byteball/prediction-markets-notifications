module.exports = (res) => {
    const v = res?.response?.responseVars;
    const aa = res?.aa_address;

    if (!v) {
        console.error(`[pending-markets] firstAddLiquidityFilter: ${aa} no responseVars, reject`);
        return false;
    }

    const supplyYes = v.supply_yes;
    const supplyNo = v.supply_no;
    const supplyDraw = v.supply_draw || 0;
    const yesAmount = v.yes_amount;
    const noAmount = v.no_amount;
    const drawAmount = v.draw_amount || 0;

    const isFirst = supplyYes === yesAmount
        && supplyNo === noAmount
        && supplyDraw === drawAmount;

    console.error(
        `[pending-markets] firstAddLiquidityFilter: ${aa} decision=${isFirst}`,
        `supply_yes=${supplyYes} yes_amount=${yesAmount}`,
        `supply_no=${supplyNo} no_amount=${noAmount}`,
        `supply_draw=${supplyDraw} draw_amount=${drawAmount}`,
    );

    return isFirst;
};
