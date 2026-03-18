const cron = require('node-cron');
const moment = require('moment');
const conf = require('ocore/conf.js');
const { fetchActiveMarkets } = require('../utils/fetchActiveMarkets');
const { sendDailyDigestToAll } = require('../channels/sendAll');
const generateTextEvent = require('../utils/generateTextEvent');
const getAssetInfo = require('../utils/getAssetInfo');
const { getExchangeRates, getUsdRate } = require('../utils/getExchangeRates');
const toLocalString = require('../utils/toLocalString');

const SECONDS_IN_YEAR = 60 * 60 * 24 * 365;
const BASE_AA_WITH_ISSUE_FEE_FOR_ADD_LIQUIDITY = "AXG7G57VBLAHF3WRN5WMQ53KQEQDRONC";

function getEstimatedAPY({ base_aa, committed_at, first_trade_ts, created_at, coef, issue_fee }) {
    const elapsed_seconds = (committed_at || moment.utc().unix()) - (first_trade_ts || created_at);
    if (elapsed_seconds <= 0 || coef === 1) return 0;
    let apy;
    if (base_aa === BASE_AA_WITH_ISSUE_FEE_FOR_ADD_LIQUIDITY) {
        apy = ((coef * (1 - issue_fee)) ** (SECONDS_IN_YEAR / elapsed_seconds) - 1) * 100;
    } else {
        apy = (coef ** (SECONDS_IN_YEAR / elapsed_seconds) - 1) * 100;
    }
    if (!isFinite(apy) || isNaN(apy)) return 0;
    return Math.min(apy, 999999);
}

exports.startDailyJob = () => {
    const schedule = process.env.DAILY_CRON_SCHEDULE || '0 9 * * *';
    const count = parseInt(process.env.TOP_MARKETS_COUNT) || 5;

    async function runJob() {
        console.log('Running daily popular markets job...');

        try {
            const markets = await fetchActiveMarkets();

            if (!markets.length) {
                console.log('No active markets found for daily digest');
                return;
            }

            const rates = await getExchangeRates();

            const enriched = await Promise.all(markets.map(async (m) => {
                const textEvent = await generateTextEvent({
                    oracle: m.oracle,
                    event_date: m.event_date * 1000,
                    feed_name: m.feed_name,
                    datafeed_value: m.datafeed_value,
                    comparison: m.comparison || '>',
                    isUTC: true,
                });

                const assetInfo = await getAssetInfo(m.reserve_asset);
                const reserveInUnits = (m.reserve || 0) / (10 ** assetInfo.decimals);
                const usdRate = getUsdRate(rates, m.reserve_asset) || 1;
                const reserveUsd = reserveInUnits * usdRate;
                const apy = getEstimatedAPY({
                    base_aa: m.base_aa,
                    committed_at: m.committed_at,
                    first_trade_ts: m.first_trade_ts,
                    created_at: m.created_at,
                    coef: m.coef || 1,
                    issue_fee: m.issue_fee || 0,
                });

                const hasDraw = m.supply_draw > 0;
                const probabilities = {};
                const sumSquares = m.supply_yes ** 2 + m.supply_no ** 2 + (m.supply_draw || 0) ** 2;
                if (sumSquares > 0) {
                    probabilities.yes = (m.supply_yes ** 2 / sumSquares) * 100;
                    probabilities.no = (m.supply_no ** 2 / sumSquares) * 100;
                    if (hasDraw) probabilities.draw = (m.supply_draw ** 2 / sumSquares) * 100;
                }

                return {
                    question: textEvent,
                    reserve: toLocalString(reserveInUnits),
                    reserveUsd,
                    reserveSymbol: assetInfo.symbol,
                    apyRaw: apy,
                    apy: !apy ? 'n/a' : apy >= 1000 ? 'not shown' : apy.toFixed(2) + '%',
                    probabilities,
                    link: `${conf.frontendUrl}/market/${m.aa_address}`,
                };
            }));

            enriched.sort((a, b) => {
                const apyA = Math.min(a.apyRaw, 100);
                const apyB = Math.min(b.apyRaw, 100);
                if (apyB !== apyA) return apyB - apyA;
                return b.reserveUsd - a.reserveUsd;
            });

            const top = enriched.slice(0, count).map((m, i) => ({ ...m, rank: i + 1 }));

            await sendDailyDigestToAll({ markets: top });
            console.log('Daily digest sent successfully');
        } catch (e) {
            console.error('Daily popular markets job failed:', e);
        }
    }

    cron.schedule(schedule, () => {
        runJob().catch(e => console.error('Cron job error:', e));
    }, { timezone: "UTC" });

    console.log(`Daily popular markets cron scheduled: ${schedule} UTC`);

    // run immediately on start
    runJob().catch(e => console.error('Initial daily job error:', e));
};
