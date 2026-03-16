// discord.js must be loaded before ocore, which freezes String.prototype
const { initDiscord } = require("./channels/discord");

const { Hooks } = require("aa-hooks");
const conf = require("ocore/conf.js");
const eventBus = require("ocore/event_bus.js");

const newMarketHandler = require("./handlers/newMarketHandler");
const { startDailyJob } = require("./jobs/dailyPopularMarkets");

// Wait for both Discord and ocore to be ready before starting daily job
const discordReady = initDiscord().then(() => {
    console.log("Discord connected");
}).catch(e => {
    console.error("Discord init failed:", e);
});

const ocoreReady = new Promise(resolve => {
    eventBus.once('connected', () => {
        console.log("Connected to hub");
        resolve();
    });
});

Promise.all([discordReady, ocoreReady]).then(() => {
    console.log("Both Discord and ocore ready, starting daily job");
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
