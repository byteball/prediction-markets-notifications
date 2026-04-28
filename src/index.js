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
const firstAddLiquidityFilter = require("./handlers/firstAddLiquidityFilter");
const subscribePendingMarkets = require("./utils/subscribePendingMarkets");
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
    .responseKeyMoreThan("next_reserve", 0)
    .customFilter(firstAddLiquidityFilter);

async function start() {
    console.error("[pending-markets] start: hub connected + witnesses ready");
    try {
        await subscribePendingMarkets();
    } catch (e) {
        console.error("[pending-markets] subscribePendingMarkets threw:", e);
    }

    startDailyJob();
}

eventBus.once('connected', function (ws) {
    console.error("[pending-markets] hub connected, initializing witnesses");
    network.initWitnessesIfNecessary(ws, start);
});

console.error("[pending-markets] service booting");
