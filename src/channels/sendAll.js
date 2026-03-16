const discord = require('./discord');
const telegram = require('./telegram');

exports.sendNewMarketToAll = async (data) => {
    const results = await Promise.allSettled([
        discord.sendNewMarket(data),
        telegram.sendNewMarket(data),
    ]);

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`sendNewMarket channel ${i} failed:`, r.reason);
        }
    });
};

exports.sendDailyDigestToAll = async (data) => {
    const results = await Promise.allSettled([
        discord.sendDailyDigest(data),
        telegram.sendDailyDigest(data),
    ]);

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`sendDailyDigest channel ${i} failed:`, r.reason);
        }
    });
};
