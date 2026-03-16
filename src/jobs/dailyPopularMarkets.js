const cron = require('node-cron');
const moment = require('moment');
const conf = require('ocore/conf.js');
const { fetchTopMarkets } = require('../utils/fetchMarkets');
const { sendDailyDigestToAll } = require('../channels/sendAll');
const generateTextEvent = require('../utils/generateTextEvent');
const getAssetInfo = require('../utils/getAssetInfo');

const SECONDS_IN_YEAR = 60 * 60 * 24 * 365;
const BASE_AA_WITH_ISSUE_FEE_FOR_ADD_LIQUIDITY = "AXG7G57VBLAHF3WRN5WMQ53KQEQDRONC";

function getEstimatedAPY({ base_aa, committed_at, created_at, coef, issue_fee }) {
    const elapsed_seconds = (committed_at || moment.utc().unix()) - created_at;
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
            const markets = await fetchTopMarkets(count);

            if (!markets.length) {
                console.log('No active markets found for daily digest');
                return;
            }

            const enriched = await Promise.all(markets.map(async (m, i) => {
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
                const apy = getEstimatedAPY({
                    base_aa: m.base_aa,
                    committed_at: m.committed_at,
                    created_at: m.created_at,
                    coef: m.coef || 1,
                    issue_fee: m.issue_fee || 0,
                });

                return {
                    rank: i + 1,
                    question: textEvent,
                    reserve: reserveInUnits.toFixed(assetInfo.decimals > 4 ? 4 : 2),
                    reserveSymbol: assetInfo.symbol,
                    apy: apy.toFixed(2),
                    link: `${conf.frontendUrl}/market/${m.aa_address}`,
                };
            }));

            await sendDailyDigestToAll({ markets: enriched });
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
