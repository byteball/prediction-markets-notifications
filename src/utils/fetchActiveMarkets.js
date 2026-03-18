const network = require('ocore/network.js');
const conf = require('ocore/conf.js');

exports.fetchActiveMarkets = async () => {
    const results = await Promise.all(conf.factory_aas.map(async (factoryAA) => {
        try {
            const stateVars = await network.requestFromLightVendor('light/get_aa_state_vars', {
                address: factoryAA,
                var_prefix: 'prediction_',
            });
            const markets = [];
            for (const [key, value] of Object.entries(stateVars)) {
                if (typeof value !== 'object') continue;
                const aa_address = key.replace('prediction_', '');
                markets.push({ aa_address, ...value });
            }
            return markets;
        } catch (e) {
            console.error(`Failed to get state vars from ${factoryAA}:`, e);
            return [];
        }
    }));

    const allMarkets = results.flat();

    console.log(`fetchActiveMarkets: found ${allMarkets.length} total markets from ${conf.factory_aas.length} factories`);

    const now = Math.floor(Date.now() / 1000);
    const activeMarkets = allMarkets.filter(m => m.event_date > now);
    console.log(`fetchActiveMarkets: ${activeMarkets.length} active markets (event_date > ${now})`);

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
            market.first_trade_ts = vars.first_trade_ts || null;
            market.base_aa = definition?.[1]?.base_aa || null;
        } catch (e) {
            console.error(`Failed to get data for ${market.aa_address}:`, e);
            market.reserve = 0;
            market.coef = 1;
            market.first_trade_ts = null;
            market.base_aa = null;
        }
    }));

    return activeMarkets;
};
