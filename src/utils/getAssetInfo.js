const network = require('ocore/network.js');
const conf = require('ocore/conf.js');

const cache = {};

async function getAssetInfo(asset) {
    if (asset === 'base') return { symbol: 'GBYTE', decimals: 9 };
    if (cache[asset]) return cache[asset];

    try {
        const vars = await network.requestFromLightVendor('light/get_aa_state_vars', {
            address: conf.tokenRegistryAaAddress,
            var_prefix_from: `a2s_${asset}`,
            var_prefix_to: `a2s_${asset}`,
        });

        const symbol = vars[`a2s_${asset}`] || asset;

        let decimals = 0;
        if (symbol !== asset) {
            const descVars = await network.requestFromLightVendor('light/get_aa_state_vars', {
                address: conf.tokenRegistryAaAddress,
                var_prefix_from: `current_desc_${asset}`,
                var_prefix_to: `current_desc_${asset}`,
            });

            const descHash = descVars[`current_desc_${asset}`];
            if (descHash) {
                const decVars = await network.requestFromLightVendor('light/get_aa_state_vars', {
                    address: conf.tokenRegistryAaAddress,
                    var_prefix_from: `decimals_${descHash}`,
                    var_prefix_to: `decimals_${descHash}`,
                });
                decimals = decVars[`decimals_${descHash}`] || 0;
            }
        }

        const info = { symbol, decimals };
        cache[asset] = info;
        return info;
    } catch (e) {
        console.error(`Failed to get asset info for ${asset}:`, e.message);
        return { symbol: asset, decimals: 0 };
    }
}

module.exports = getAssetInfo;
