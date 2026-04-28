const watchMarket = require("../utils/watchMarket");

const OBYTE_ADDRESS_RE = /^[A-Z2-7]{32}$/;

module.exports = async (triggerUnit, responseObj) => {
    const prediction_address = responseObj?.response?.responseVars?.prediction_address;

    if (!prediction_address) {
        console.error('[pending-markets] newMarketHandler: prediction_address not found in response');
        return;
    }

    if (typeof prediction_address !== 'string' || !OBYTE_ADDRESS_RE.test(prediction_address)) {
        console.error(`[pending-markets] newMarketHandler: prediction_address has unexpected format, rejecting: ${JSON.stringify(prediction_address)}`);
        return;
    }

    try {
        await watchMarket(prediction_address);
        console.error(`[pending-markets] newMarketHandler: SUBSCRIBED ${prediction_address}`);
    } catch (e) {
        console.error(`[pending-markets] newMarketHandler: watchMarket failed for ${prediction_address}:`, e);
    }
};
