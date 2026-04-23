const { Hooks } = require('aa-hooks');
const conf = require('ocore/conf.js');

const factoriesHook = new Hooks(conf.factory_aas, {
    newEventsOnly: true,
    parallelProcessing: false,
});

const marketsHook = new Hooks([], {
    newEventsOnly: false,
    parallelProcessing: false,
});

module.exports = { factoriesHook, marketsHook };
