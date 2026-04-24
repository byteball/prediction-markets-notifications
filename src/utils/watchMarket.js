const wallet_general = require('ocore/wallet_general.js');
const light_wallet = require('ocore/light_wallet.js');
const dag = require('aabot/dag.js');

module.exports = async function watchMarket(aa_address) {
    try {
        await dag.loadAA(aa_address);
    } catch (e) {
        console.error(`[pending-markets] watchMarket: loadAA failed for ${aa_address}:`, e);
    }

    await new Promise((resolve) => wallet_general.addWatchedAddress(aa_address, resolve));

    await new Promise((resolve) => {
        light_wallet.refreshLightClientHistory([aa_address], (err) => {
            if (err) console.error(`[pending-markets] watchMarket: refresh failed for ${aa_address}:`, err);
            resolve();
        });
    });
};
