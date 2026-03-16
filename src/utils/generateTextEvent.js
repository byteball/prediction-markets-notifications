const moment = require("moment");
const conf = require("ocore/conf.js");

module.exports = async ({ oracle, event_date, feed_name, datafeed_value, comparison, isUTC = false }) => {
    const expiry_date = isUTC ? moment(event_date).utc().format("LLL") : moment(event_date).format("LLL");
    const comparisonText = getComparisonText(comparison);

    if (oracle === conf.currency_oracle || oracle === conf.precious_metal_oracle) {
        const [from, to] = feed_name.split("_");
        return `Will ${from} be ${comparisonText} ${datafeed_value} ${to} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
    } else if (oracle === conf.sport_oracle) {
        const parts = feed_name.split("_");
        const yes_team = parts[1];
        const no_team = parts[2];

        if (!yes_team || !no_team) {
            return `${feed_name} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
        }

        const [yes_team_name, no_team_name] = await Promise.all([
            fetch(`https://prophet.ooo/api/team/soccer/${yes_team}`).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            }).then(res => res.name).catch((e) => { console.error(`Failed to fetch team ${yes_team}:`, e.message); return null; }),
            fetch(`https://prophet.ooo/api/team/soccer/${no_team}`).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            }).then(res => res.name).catch((e) => { console.error(`Failed to fetch team ${no_team}:`, e.message); return null; }),
        ]);

        return `${yes_team_name || yes_team} vs ${no_team_name || no_team} on ${expiry_date}${isUTC ? ' UTC' : ''}`;
    } else {
        return `Will ${feed_name} be ${comparisonText} ${datafeed_value} on ${expiry_date}${isUTC ? ' UTC' : ''}?`;
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
