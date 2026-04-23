process.on('unhandledRejection', (reason) => {
    console.error('[pending-markets] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[pending-markets] uncaughtException:', err);
});

// discord.js must be loaded before ocore, which freezes String.prototype
const { initDiscord } = require("./channels/discord");

const eventBus = require("ocore/event_bus.js");
const network = require("ocore/network.js");

const { factoriesHook, marketsHook } = require("./hooks");
const newMarketHandler = require("./handlers/newMarketHandler");
const liquidityHandler = require("./handlers/liquidityHandler");
const pendingMarkets = require("./db/pendingMarkets");
const initDB = require("./db/initDB");
const { startDailyJob } = require("./jobs/dailyPopularMarkets");

initDiscord()
    .then(() => console.log("Discord connected"))
    .catch(e => console.error("Discord init failed:", e));

factoriesHook.register(newMarketHandler)
    .isSuccess()
    .triggerDataContainsKey("oracle")
    .triggerDataContainsKey("feed_name")
    .triggerDataContainsKey("datafeed_value")
    .responseContainsKey("prediction_address");

marketsHook.register(liquidityHandler)
    .isSuccess()
    .triggerDataContainsKey("add_liquidity")
    .responseKeyMoreThan("next_reserve", 0);

// Diagnostic catch-all: log every aa_response the service receives.
eventBus.on('aa_response', (res) => {
    const triggerKeys = Object.keys(res?.trigger?.data || {});
    const responseKeys = Object.keys(res?.response?.responseVars || {});
    console.error(
        '[pending-markets] aa_response seen:',
        'aa=' + res?.aa_address,
        'trigger_unit=' + res?.trigger_unit,
        'bounced=' + !!res?.bounced,
        'trigger_data_keys=' + JSON.stringify(triggerKeys),
        'response_keys=' + JSON.stringify(responseKeys),
    );
});

async function start() {
    console.error("[pending-markets] start: hub connected + witnesses ready");

    try {
        await initDB.init();
        console.error("[pending-markets] start: initDB.init done");
    } catch (e) {
        console.error("[pending-markets] initDB failed:", e);
        process.exit(1);
    }

    let addresses;
    try {
        addresses = await pendingMarkets.listAddresses();
    } catch (e) {
        console.error("[pending-markets] listAddresses failed:", e);
        process.exit(1);
    }

    console.error(`[pending-markets] restoring ${addresses.length} pending market(s): ${JSON.stringify(addresses)}`);
    for (const addr of addresses) {
        try {
            await marketsHook.addWatchedAddress(addr);
            console.error(`[pending-markets] restored watch for ${addr}`);
        } catch (e) {
            console.error(`[pending-markets] addWatchedAddress failed for ${addr}:`, e);
        }
    }

    console.error("[pending-markets] startup complete, starting daily job");
    startDailyJob();
}

eventBus.once('connected', function (ws) {
    console.error("[pending-markets] hub connected, initializing witnesses");
    network.initWitnessesIfNecessary(ws, start);
});

console.error("[pending-markets] service booting");
