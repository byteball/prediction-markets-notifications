const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let isReady = false;
let cachedChannel = null;

async function initDiscord() {
    if (!process.env.DISCORD_BOT_TOKEN) {
        console.error("DISCORD_BOT_TOKEN is not provided, Discord notifications disabled");
        return;
    }

    const readyPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Discord ready timeout (30s)')), 30000);
        client.once('ready', () => {
            clearTimeout(timeout);
            isReady = true;
            console.log(`Discord bot logged in as ${client.user.tag}`);
            resolve();
        });
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);

    return readyPromise;
}

async function sendDailyDigest({ markets }) {
    if (!isReady) {
        console.error("Discord sendDailyDigest skipped: bot not ready");
        return;
    }
    if (!process.env.DISCORD_CHANNEL_ID) {
        console.error("Discord sendDailyDigest skipped: DISCORD_CHANNEL_ID not set");
        return;
    }

    try {
        if (!cachedChannel) cachedChannel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
        const channel = cachedChannel;

        const embed = new EmbedBuilder()
            .setTitle('Top active markets')
            .setColor('#2D72F6');

        markets.forEach((m) => {
            const probParts = [];
            if (m.probabilities.yes !== undefined) probParts.push(`🟢 YES ${m.probabilities.yes.toFixed(1)}%`);
            if (m.probabilities.draw !== undefined) probParts.push(`🟡 DRAW ${m.probabilities.draw.toFixed(1)}%`);
            if (m.probabilities.no !== undefined) probParts.push(`🔴 NO ${m.probabilities.no.toFixed(1)}%`);

            embed.addFields(
                { name: '\u200b', value: `**${m.rank}. [${m.question}](${m.link})**` },
                { name: 'TVL', value: `${m.reserve} ${m.reserveSymbol}`, inline: true },
                { name: 'Liquidity provider APY', value: m.apy, inline: true },
                { name: 'Probabilities', value: probParts.join('  ·  ') || 'n/a', inline: false },
            );
        });

        await channel.send({ embeds: [embed] });
    } catch (e) {
        console.error("Discord sendDailyDigest error:", e);
    }
}

async function sendNewMarket({ title, description, link, imageURL }) {
    if (!isReady) {
        console.error("Discord sendNewMarket skipped: bot not ready");
        return;
    }
    if (!process.env.DISCORD_CHANNEL_ID) {
        console.error("Discord sendNewMarket skipped: DISCORD_CHANNEL_ID not set");
        return;
    }

    try {
        if (!cachedChannel) cachedChannel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
        const channel = cachedChannel;

        const embed = new EmbedBuilder()
            .setTitle('New Market')
            .setColor('#2D72F6')
            .setDescription(`**${title}**\n${description}\n[Open on Prophet](${link})`)
            .setTimestamp();

        if (imageURL) {
            embed.setImage(imageURL);
        }

        await channel.send({ embeds: [embed] });
    } catch (e) {
        console.error("Discord sendNewMarket error:", e);
    }
}

exports.initDiscord = initDiscord;
exports.sendNewMarket = sendNewMarket;
exports.sendDailyDigest = sendDailyDigest;
