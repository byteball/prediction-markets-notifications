import { vi } from 'vitest';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);

function preload(modulePath, exportsObj) {
    const realPath = nodeRequire.resolve(modulePath);
    nodeRequire.cache[realPath] = {
        id: realPath,
        filename: realPath,
        loaded: true,
        exports: exportsObj,
    };
    return exportsObj;
}

const dbFake = {
    __calls: [],
    __queryImpl: async () => undefined,
    query: vi.fn((...args) => {
        dbFake.__calls.push(args);
        return dbFake.__queryImpl(...args);
    }),
    getIgnore: () => 'OR IGNORE',
    __reset() {
        dbFake.__calls.length = 0;
        dbFake.__queryImpl = async () => undefined;
        dbFake.query.mockClear();
    },
    __setQueryImpl(fn) { dbFake.__queryImpl = fn; },
};
preload('ocore/db.js', dbFake);

const discordFake = {
    sendNewMarket: vi.fn(),
    sendDailyDigest: vi.fn(),
    initDiscord: vi.fn(),
};
preload('../src/channels/discord.js', discordFake);

const telegramFake = {
    sendNewMarket: vi.fn(),
    sendDailyDigest: vi.fn(),
};
preload('../src/channels/telegram.js', telegramFake);

const pendingMarketsFake = {
    add: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    listAddresses: vi.fn(),
};
preload('../src/db/pendingMarkets.js', pendingMarketsFake);

const sendAllFake = {
    sendNewMarketToAll: vi.fn(),
    sendDailyDigestToAll: vi.fn(),
};
preload('../src/channels/sendAll.js', sendAllFake);

const generateTextEventFake = vi.fn();
preload('../src/utils/generateTextEvent.js', generateTextEventFake);

const desktopAppFake = {
    getAppDataDir: vi.fn(() => '/tmp/fake-app-data-dir'),
};
preload('ocore/desktop_app.js', desktopAppFake);

const confFake = {
    testnet: true,
    frontendUrl: 'https://testnet.prophet.ooo',
    factory_aas: ['FACTORY1', 'FACTORY2'],
    base_aas: [],
    tokenRegistryAaAddress: 'TOKEN_REG',
    sport_oracle: 'SPORT',
    currency_oracle: 'CURR',
    precious_metal_oracle: 'METAL',
    exchangeRatesUrl: 'https://example.invalid/rates',
    hub: 'obyte.org/bb-test',
    bServeAsHub: false,
    bLight: true,
    bNoPassphrase: true,
};
preload('ocore/conf.js', confFake);

const fs = nodeRequire('fs');
const fsFake = {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
};
fs.existsSync = fsFake.existsSync;
fs.mkdirSync = fsFake.mkdirSync;

const marketsHookFake = { addWatchedAddress: vi.fn() };
const factoriesHookFake = { register: vi.fn(() => ({ isSuccess: () => ({ triggerDataContainsKey: () => ({}) }) })) };
preload('../src/hooks.js', {
    marketsHook: marketsHookFake,
    factoriesHook: factoriesHookFake,
});

globalThis.__fakes = {
    db: dbFake,
    discord: discordFake,
    telegram: telegramFake,
    pendingMarkets: pendingMarketsFake,
    sendAll: sendAllFake,
    generateTextEvent: generateTextEventFake,
    marketsHook: marketsHookFake,
    desktopApp: desktopAppFake,
    fs: fsFake,
    conf: confFake,
};
