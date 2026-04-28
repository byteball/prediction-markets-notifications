const discord = require('./discord');
const telegram = require('./telegram');

const channels = { discord, telegram };

exports.sendNewMarketToAll = async (data) => {
    const entries = Object.entries(channels);
    const results = await Promise.allSettled(entries.map(([, ch]) => ch.sendNewMarket(data)));

    let sent = 0;
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`sendNewMarket ${entries[i][0]} failed:`, r.reason);
        } else {
            sent++;
        }
    });
    return { sent, total: results.length };
};

exports.sendDailyDigestToAll = async (data) => {
    const entries = Object.entries(channels);
    const results = await Promise.allSettled(entries.map(([, ch]) => ch.sendDailyDigest(data)));

    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`sendDailyDigest ${entries[i][0]} failed:`, r.reason);
        }
    });
};
