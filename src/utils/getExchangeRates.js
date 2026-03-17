const conf = require('ocore/conf.js');

let cachedRates = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getExchangeRates() {
    if (cachedRates && Date.now() - cachedAt < CACHE_TTL) return cachedRates;

    try {
        const res = await fetch(conf.exchangeRatesUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        cachedRates = await res.json();
        cachedAt = Date.now();
        return cachedRates;
    } catch (e) {
        console.error('Failed to fetch exchange rates:', e);
        return cachedRates || {};
    }
}

function getUsdRate(rates, asset) {
    if (asset === 'base') return rates['GBYTE_USD'] || 0;
    return rates[`${asset}_USD`] || 0;
}

module.exports = { getExchangeRates, getUsdRate };
