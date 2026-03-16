// discord.js must be loaded before ocore, which freezes String.prototype
const { initDiscord } = require("./channels/discord");

const { Hooks } = require("aa-hooks");
const conf = require("ocore/conf.js");
const eventBus = require("ocore/event_bus.js");

const newMarketHandler = require("./handlers/newMarketHandler");
const { startDailyJob } = require("./jobs/dailyPopularMarkets");

// Initialize Discord (don't block on it)
initDiscord().then(() => {
    console.log("Discord connected");
}).catch(e => {
    console.error("Discord init failed:", e);
});

// Start cron jobs only after ocore is connected to the hub
eventBus.once('connected', () => {
    console.log("Connected to hub, starting daily job");
    startDailyJob();
});

// Register aa-hooks for new market detection
const factoriesHook = new Hooks(conf.factory_aas, {
    newEventsOnly: true,
    parallelProcessing: false,
});

factoriesHook.register(newMarketHandler)
    .isSuccess()
    .triggerDataContainsKey("oracle")
    .triggerDataContainsKey("feed_name")
    .triggerDataContainsKey("datafeed_value")
    .responseKeyContains("prediction_address");

console.log("Prediction markets notifications service started");
