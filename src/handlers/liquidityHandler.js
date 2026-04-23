const pendingMarkets = require('../db/pendingMarkets');
const { sendNewMarketToAll } = require('../channels/sendAll');

module.exports = async (triggerUnit, responseObj) => {
    const aa_address = responseObj?.aa_address;
    const responseVars = responseObj?.response?.responseVars;

    console.error('[pending-markets] liquidityHandler: fired, aa_address=' + aa_address + ' responseVars=' + JSON.stringify(responseVars));

    if (!aa_address) {
        console.error('[pending-markets] liquidityHandler: no aa_address in responseObj');
        return;
    }

    let pending;
    try {
        pending = await pendingMarkets.get(aa_address);
    } catch (e) {
        console.error(`[pending-markets] pendingMarkets.get failed for ${aa_address}:`, e);
        return;
    }

    if (!pending) {
        console.error(`[pending-markets] liquidityHandler: ${aa_address} not in pending_markets, skipping`);
        return;
    }

    console.error(`[pending-markets] first liquidity for ${aa_address}, publishing notification: ${pending.title}`);

    let result;
    try {
        result = await sendNewMarketToAll({
            title: pending.title,
            description: pending.description,
            link: pending.link,
            imageURL: pending.imageURL,
        });
        console.error(`[pending-markets] sendNewMarketToAll for ${aa_address} returned ${JSON.stringify(result)}`);
    } catch (e) {
        console.error(`[pending-markets] sendNewMarketToAll threw for ${aa_address}:`, e);
        return;
    }

    if (!result || result.sent === 0) {
        console.error(`[pending-markets] all channels failed for ${aa_address}; keeping in pending for retry`);
        return;
    }

    try {
        await pendingMarkets.remove(aa_address);
        console.error(`[pending-markets] removed ${aa_address} from pending_markets`);
    } catch (e) {
        console.error(`[pending-markets] pendingMarkets.remove failed for ${aa_address} (notification may duplicate next time):`, e);
    }
};
