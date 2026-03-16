const { Telegraf } = require('telegraf');

let bot;
const chatId = process.env.TELEGRAM_CHAT_ID;
const MAX_RETRIES = 3;

function getBot() {
    if (!bot) {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.error("TELEGRAM_BOT_TOKEN is not provided, Telegram notifications disabled");
            return null;
        }
        bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    }
    return bot;
}

const queue = [];
let processing = false;

function enqueue(fn) {
    return new Promise((resolve, reject) => {
        queue.push({ fn, resolve, reject });
        processQueue();
    });
}

async function processQueue() {
    if (processing) return;
    processing = true;

    while (queue.length > 0) {
        const { fn, resolve, reject } = queue.shift();
        try {
            const result = await executeWithRetry(fn);
            resolve(result);
        } catch (e) {
            reject(e);
        }
    }

    processing = false;
}

async function executeWithRetry(fn, attempt = 0) {
    try {
        return await fn();
    } catch (e) {
        const retryAfter = e?.response?.parameters?.retry_after;
        if (retryAfter && attempt < MAX_RETRIES) {
            console.log(`Telegram rate limited, retrying after ${retryAfter}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            return executeWithRetry(fn, attempt + 1);
        }
        throw e;
    }
}

async function sendNewMarket({ title, description, link, imageURL }) {
    const bot = getBot();
    if (!bot || !chatId) {
        console.error("Telegram bot not initialized or TELEGRAM_CHAT_ID not set");
        return;
    }

    try {
        const caption = `<b>New Market</b>\n\n${escapeHtml(title)}\n${escapeHtml(description)}`;

        await enqueue(() => {
            if (imageURL) {
                return bot.telegram.sendPhoto(chatId, imageURL, {
                    caption,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: 'Open on Prophet', url: link }
                        ]]
                    }
                });
            } else {
                return bot.telegram.sendMessage(chatId, caption, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: 'Open on Prophet', url: link }
                        ]]
                    }
                });
            }
        });
    } catch (e) {
        console.error("Telegram sendNewMarket error:", e.message);
    }
}

async function sendDailyDigest({ markets }) {
    const bot = getBot();
    if (!bot || !chatId) {
        console.error("Telegram bot not initialized or TELEGRAM_CHAT_ID not set");
        return;
    }

    try {
        let text = '<b>Top Markets by Liquidity</b>\n\n';

        markets.forEach((m) => {
            text += `<b>${m.rank}.</b> <a href="${m.link}">${escapeHtml(m.question)}</a>\n`;
            text += `    TVL: <b>${m.reserve} ${m.reserveSymbol}</b>  ·  APY: <b>${m.apy}%</b>\n\n`;
        });

        await enqueue(() => bot.telegram.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        }));
    } catch (e) {
        console.error("Telegram sendDailyDigest error:", e.message);
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

exports.sendNewMarket = sendNewMarket;
exports.sendDailyDigest = sendDailyDigest;
