const moment = require("moment");
const conf = require("ocore/conf.js");

const TEAM_ID_RE = /^[^\s\x00-\x1f\x7f]{1,64}$/u;

const asString = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

module.exports = async ({ oracle, event_date, feed_name, datafeed_value, comparison, isUTC = false }) => {
    const expiry_date = isUTC ? moment(event_date).utc().format("LLL") : moment(event_date).format("LLL");
    const comparisonText = getComparisonText(comparison);
    const feedNameStr = asString(feed_name);
    const datafeedValueStr = asString(datafeed_value);

    if (oracle === conf.currency_oracle || oracle === conf.precious_metal_oracle) {
        const [from, to] = feedNameStr.split("_");
        return `Will ${from} be ${comparisonText} ${datafeedValueStr} ${to} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
    } else if (oracle === conf.sport_oracle) {
        const parts = feedNameStr.split("_");
        const yes_team = parts[1];
        const no_team = parts[2];

        if (!yes_team || !no_team) {
            return `${feedNameStr} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
        }

        const yesTeamValid = TEAM_ID_RE.test(yes_team);
        const noTeamValid = TEAM_ID_RE.test(no_team);

        if (!yesTeamValid || !noTeamValid) {
            console.error(`generateTextEvent: skipping team fetch, unexpected team id format: ${JSON.stringify({ yes_team, no_team })}`);
            return `${feedNameStr} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
        }

        const [yes_team_name, no_team_name] = await Promise.all([
            fetchTeamName(yes_team),
            fetchTeamName(no_team),
        ]);

        return `${yes_team_name || yes_team} vs ${no_team_name || no_team} on ${expiry_date}${isUTC ? ' UTC' : ''}`;
    } else {
        return `Will ${feedNameStr} be ${comparisonText} ${datafeedValueStr} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
    }
}

async function fetchTeamName(teamId) {
    try {
        const res = await fetch(`https://prophet.ooo/api/team/soccer/${encodeURIComponent(teamId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        return typeof body?.name === 'string' ? body.name : null;
    } catch (e) {
        console.error(`Failed to fetch team ${teamId}:`, e.message);
        return null;
    }
}

const getComparisonText = (comparison) => {
    if (comparison === '>') return "above";
    if (comparison === '<') return "below";
    if (comparison === '>=') return "above or equal";
    if (comparison === '<=') return "below or equal";
    if (comparison === '==') return "equal";
    if (comparison === '!=') return "not equal";
    return "above";
}
