const conf = require("ocore/conf.js");
const getDataByTriggerUnit = require("../utils/getDataByTriggerUnit");
const generateTextEvent = require("../utils/generateTextEvent");
const pendingMarkets = require("../db/pendingMarkets");
const { marketsHook } = require("../hooks");

const OBYTE_ADDRESS_RE = /^[A-Z2-7]{32}$/;
const MAX_TITLE_LEN = 200;

module.exports = async (triggerUnit, responseObj) => {
    console.error('[pending-markets] newMarketHandler: factory fired, aa_address=' + responseObj?.aa_address + ' trigger_unit=' + responseObj?.trigger_unit);

    const prediction_address = responseObj?.response?.responseVars?.prediction_address;

    if (!prediction_address) {
        console.error('[pending-markets] newMarketHandler: prediction_address not found in response', JSON.stringify(responseObj?.response?.responseVars));
        return;
    }

    if (typeof prediction_address !== 'string' || !OBYTE_ADDRESS_RE.test(prediction_address)) {
        console.error(`[pending-markets] newMarketHandler: prediction_address has unexpected format, rejecting: ${JSON.stringify(prediction_address)}`);
        return;
    }

    let title;
    try {
        const payload = getDataByTriggerUnit(triggerUnit);
        console.error(`[pending-markets] newMarketHandler: generating title for ${prediction_address}, payload=` + JSON.stringify(payload));
        title = await generateTextEvent({ ...payload, isUTC: true });
        console.error(`[pending-markets] newMarketHandler: title=${title}`);
    } catch (e) {
        console.error(`[pending-markets] generateTextEvent failed for ${prediction_address}:`, e);
        return;
    }

    title = String(title ?? '');
    if (title.length > MAX_TITLE_LEN) {
        title = title.slice(0, MAX_TITLE_LEN - 1) + '…';
    }

    const record = {
        prediction_address,
        title,
        description: 'Sports betting, binary options, and other bets on future events',
        link: `${conf.frontendUrl}/market/${prediction_address}`,
        imageURL: conf.testnet ? null : `https://prophet.ooo/api/og_images/market/${prediction_address}`,
    };

    try {
        await pendingMarkets.add(record);
        console.error(`[pending-markets] newMarketHandler: inserted ${prediction_address} into pending_markets`);
    } catch (e) {
        console.error(`[pending-markets] pendingMarkets.add failed for ${prediction_address}:`, e);
        return;
    }

    try {
        await marketsHook.addWatchedAddress(prediction_address);
        console.error(`[pending-markets] newMarketHandler: marketsHook now watching ${prediction_address}`);
    } catch (e) {
        console.error(`[pending-markets] addWatchedAddress failed for ${prediction_address} (will be re-added on restart):`, e);
    }

    console.error(`[pending-markets] new market ${prediction_address} parked; waiting for first liquidity: ${title}`);
};
