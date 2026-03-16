# Prediction Markets Notifications

Notification service for [Prophet](https://prophet.ooo) prediction markets. Sends alerts to Discord and Telegram when new markets are created and publishes a daily digest of top active markets.

## Features

- **New market alerts** — real-time notifications when a new prediction market is created on-chain
- **Daily digest** — scheduled summary of top active markets sorted by APY and TVL
- **Multi-channel** — Discord (embeds) and Telegram (HTML) with independent message queues
- **Rate limit handling** — automatic retry with backoff for Telegram API limits

## Prerequisites

- Node.js 16+
- Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- Telegram bot token ([@BotFather](https://t.me/BotFather))

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd prediction-markets-notifications
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Discord
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_channel_id

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Schedule (cron syntax, UTC)
DAILY_CRON_SCHEDULE=0 9 * * *

# Number of markets in daily digest
TOP_MARKETS_COUNT=5

# Set to 1 for testnet
# testnet=1
```

### 3. Discord bot setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) and create a new application
2. Go to **Bot** tab, click **Reset Token**, copy the token to `DISCORD_BOT_TOKEN`
3. Under **Privileged Gateway Intents**, no special intents are needed
4. Go to **OAuth2 → URL Generator**, select scope `bot`, permissions: `Send Messages`, `Embed Links`
5. Open the generated URL to invite the bot to your server
6. Right-click the target channel → **Copy Channel ID** (enable Developer Mode in Discord settings if needed), paste to `DISCORD_CHANNEL_ID`

### 4. Telegram bot setup

1. Message [@BotFather](https://t.me/BotFather) with `/newbot`, follow the prompts
2. Copy the token to `TELEGRAM_BOT_TOKEN`
3. Add the bot to your channel/group as admin
4. Get the chat ID:
   - For groups: add [@RawDataBot](https://t.me/RawDataBot) to the group, it will print the chat ID, then remove it
   - For channels: forward a message from the channel to [@RawDataBot](https://t.me/RawDataBot)
5. Set `TELEGRAM_CHAT_ID` (negative number for groups/channels)

## Running

```bash
npm start
```

The service will:
1. Connect to the Obyte network via light vendor
2. Initialize Discord and Telegram bots
3. Send the first daily digest immediately
4. Schedule daily digests according to `DAILY_CRON_SCHEDULE`
5. Listen for new market creation events on-chain

Logs are written to stdout initially, then redirected to:
```
~/Library/Application Support/prediction-markets-notifications/log.txt
```

### Run as daemon

```bash
node src/index.js &
```

## Daily digest sorting

Markets are sorted by:
1. `min(APY, 100)` descending — markets with APY >= 100% are treated equally
2. TVL descending — as tiebreaker

APY display follows the same rules as the Prophet frontend:
- APY = 0 → `n/a`
- APY >= 1000 → `not shown`
- Otherwise → value with `%`

## Configuration

`conf.js` contains:
- **factory_aas** — prediction market factory AA addresses to monitor
- **base_aas** — base AA addresses (first one uses issue fee in APY calculation)
- **tokenRegistryAaAddress** — Obyte Token Registry for resolving asset symbols
- **Oracle addresses** — for generating human-readable event descriptions (sport, currency, precious metals)
- **frontendUrl** — base URL for market links

## Adding a new notification channel

1. Create `src/channels/yourchannel.js` exporting `sendNewMarket(data)` and `sendDailyDigest(data)`
2. Import and add it to the `channels` object in `src/channels/sendAll.js`
