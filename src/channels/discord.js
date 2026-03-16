const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let isReady = false;

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
    if (!isReady || !process.env.DISCORD_CHANNEL_ID) {
        console.error("Discord not ready or DISCORD_CHANNEL_ID not set");
        return;
    }

    try {
        const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle('Top Markets by Liquidity')
            .setColor('#2D72F6')
            .setTimestamp();

        markets.forEach((m) => {
            embed.addFields(
                { name: '\u200b', value: `**${m.rank}. [${m.question}](${m.link})**` },
                { name: 'TVL', value: `${m.reserve} ${m.reserveSymbol}`, inline: true },
                { name: 'APY', value: `${m.apy}%`, inline: true },
            );
        });

        await channel.send({ embeds: [embed] });
    } catch (e) {
        console.error("Discord sendDailyDigest error:", e.message);
    }
}

async function sendNewMarket({ title, description, link, imageURL }) {
    if (!isReady || !process.env.DISCORD_CHANNEL_ID) {
        console.error("Discord not ready or DISCORD_CHANNEL_ID not set");
        return;
    }

    try {
        const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);

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
        console.error("Discord sendNewMarket error:", e.message);
    }
}

exports.initDiscord = initDiscord;
exports.sendNewMarket = sendNewMarket;
exports.sendDailyDigest = sendDailyDigest;
