const network = require('ocore/network.js');
const conf = require('ocore/conf.js');

exports.fetchTopMarkets = async (count = 5) => {
    const allMarkets = [];

    for (const factoryAA of conf.factory_aas) {
        try {
            const stateVars = await network.requestFromLightVendor('light/get_aa_state_vars', {
                address: factoryAA,
                var_prefix: 'prediction_',
            });
            for (const [key, value] of Object.entries(stateVars)) {
                if (typeof value !== 'object') continue;
                const aa_address = key.replace('prediction_', '');
                allMarkets.push({ aa_address, ...value });
            }
        } catch (e) {
            console.error(`Failed to get state vars from ${factoryAA}:`, e);
        }
    }

    console.log(`fetchTopMarkets: found ${allMarkets.length} total markets from ${conf.factory_aas.length} factories`);

    const now = Math.floor(Date.now() / 1000);
    const activeMarkets = allMarkets.filter(m => m.event_date > now);
    console.log(`fetchTopMarkets: ${activeMarkets.length} active markets (event_date > ${now})`);

    // fetch state vars (reserve, coef, supplies) and definition (base_aa) from each prediction AA
    await Promise.all(activeMarkets.map(async (market) => {
        try {
            const [vars, definition] = await Promise.all([
                network.requestFromLightVendor('light/get_aa_state_vars', { address: market.aa_address }),
                network.requestFromLightVendor('light/get_definition', market.aa_address),
            ]);
            market.reserve = vars.reserve || 0;
            market.coef = vars.coef || 1;
            market.supply_yes = vars.supply_yes || 0;
            market.supply_no = vars.supply_no || 0;
            market.supply_draw = vars.supply_draw || 0;
            market.base_aa = definition?.[1]?.base_aa || null;
        } catch (e) {
            console.error(`Failed to get data for ${market.aa_address}:`, e);
            market.reserve = 0;
            market.coef = 1;
        }
    }));

    return activeMarkets
        .sort((a, b) => b.reserve - a.reserve)
        .slice(0, count);
};
