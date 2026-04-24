const db = require('ocore/db.js');
const conf = require('ocore/conf.js');
const dag = require('aabot/dag.js');
const watchMarket = require('./watchMarket');
const unwatchMarket = require('./unwatchMarket');

module.exports = async () => {
    console.error('[pending-markets] subscribePendingMarkets: fetching markets via getAAsByBaseAAs');

    let rows;
    try {
        rows = await dag.getAAsByBaseAAs(conf.base_aas);
    } catch (e) {
        console.error('[pending-markets] subscribePendingMarkets: getAAsByBaseAAs failed:', e);
        return;
    }

    const addresses = (rows || []).map((r) => r.address).filter(Boolean);
    console.error(`[pending-markets] subscribePendingMarkets: found ${addresses.length} total markets`);

    const pending = [];
    const active = new Set();
    await Promise.all(addresses.map(async (aa_address) => {
        try {
            const vars = await dag.readAAStateVars(aa_address);
            const supplyTotal = (vars?.supply_yes || 0) + (vars?.supply_no || 0) + (vars?.supply_draw || 0);
            if (supplyTotal === 0) pending.push(aa_address);
            else active.add(aa_address);
        } catch (e) {
            console.error(`[pending-markets] subscribePendingMarkets: readAAStateVars failed for ${aa_address}:`, e);
        }
    }));

    const watched = await new Promise((resolve) => {
        db.query('SELECT address FROM my_watched_addresses', (r) => resolve(r.map((row) => row.address)));
    });
    const staleWatched = watched.filter((addr) => active.has(addr));
    for (const addr of staleWatched) unwatchMarket(addr);
    if (staleWatched.length > 0) {
        console.error(`[pending-markets] subscribePendingMarkets: removed ${staleWatched.length} stale market(s) from my_watched_addresses`);
    }

    console.error(`[pending-markets] subscribePendingMarkets: ${pending.length} markets with zero supply, subscribing...`);
    let subscribed = 0;
    await Promise.all(pending.map(async (aa_address) => {
        try {
            await watchMarket(aa_address);
            subscribed += 1;
        } catch (e) {
            console.error(`[pending-markets] subscribePendingMarkets: watchMarket failed for ${aa_address}:`, e);
        }
    }));

    console.error(`[pending-markets] subscribePendingMarkets: done. pending=${pending.length} subscribed=${subscribed} stale_removed=${staleWatched.length}`);
};
