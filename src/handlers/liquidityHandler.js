const conf = require('ocore/conf.js');
const dag = require('aabot/dag.js');
const generateTextEvent = require('../utils/generateTextEvent');
const unwatchMarket = require('../utils/unwatchMarket');
const { sendNewMarketToAll } = require('../channels/sendAll');

const MAX_TITLE_LEN = 200;

module.exports = async (triggerUnit, responseObj) => {
    const aa_address = responseObj?.aa_address;
    const trigger_unit = responseObj?.trigger_unit;
    const responseVars = responseObj?.response?.responseVars;

    console.error(
        `[pending-markets] liquidityHandler: FIRED aa=${aa_address} trigger_unit=${trigger_unit} responseVars=${JSON.stringify(responseVars)}`,
    );

    if (!aa_address) {
        console.error('[pending-markets] liquidityHandler: no aa_address in responseObj, abort');
        return;
    }

    let params;
    try {
        params = await dag.readAAParams(aa_address);
    } catch (e) {
        console.error(`[pending-markets] liquidityHandler: readAAParams failed for ${aa_address}:`, e);
        return;
    }

    let title;
    try {
        title = await generateTextEvent({ ...params, event_date: params.event_date * 1000, isUTC: true });
    } catch (e) {
        console.error(`[pending-markets] liquidityHandler: generateTextEvent failed for ${aa_address}:`, e);
        return;
    }

    title = String(title ?? '');
    if (title.length > MAX_TITLE_LEN) {
        title = title.slice(0, MAX_TITLE_LEN - 1) + '…';
    }

    const payload = {
        title,
        description: 'Sports betting, binary options, and other bets on future events',
        link: `${conf.frontendUrl}/market/${aa_address}`,
        imageURL: conf.testnet ? null : `https://prophet.ooo/api/og_images/market/${aa_address}`,
    };

    let result;
    try {
        result = await sendNewMarketToAll(payload);
        console.error(`[pending-markets] liquidityHandler: sendNewMarketToAll for ${aa_address} returned ${JSON.stringify(result)}`);
    } catch (e) {
        console.error(`[pending-markets] liquidityHandler: sendNewMarketToAll threw for ${aa_address}:`, e);
        return;
    }

    if (!result || result.sent === 0) {
        console.error(`[pending-markets] liquidityHandler: all channels failed for ${aa_address}, keeping subscription for retry on next add_liquidity`);
        return;
    }

    unwatchMarket(aa_address);
    console.error(`[pending-markets] liquidityHandler: UNSUBSCRIBED ${aa_address}`);
};
