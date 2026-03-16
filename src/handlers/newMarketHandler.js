const conf = require("ocore/conf.js");
const getDataByTriggerUnit = require("../utils/getDataByTriggerUnit");
const generateTextEvent = require("../utils/generateTextEvent");
const { sendNewMarketToAll } = require("../channels/sendAll");

module.exports = async (triggerUnit, responseObj) => {
    try {
        const payload = getDataByTriggerUnit(triggerUnit);
        const textEvent = await generateTextEvent({ ...payload, isUTC: true });
        const prediction_address = responseObj?.response?.responseVars?.prediction_address;

        if (!prediction_address) {
            console.error('newMarketHandler: prediction_address not found in response', JSON.stringify(responseObj?.response?.responseVars));
            return;
        }

        console.log('New market detected:', prediction_address, textEvent);

        await sendNewMarketToAll({
            title: textEvent,
            description: 'Sports betting, binary options, and other bets on future events',
            link: `${conf.frontendUrl}/market/${prediction_address}`,
            imageURL: conf.testnet ? null : `https://prophet.ooo/api/og_images/market/${prediction_address}`,
        });
    } catch (e) {
        console.error('newMarketHandler error:', e);
    }
};
