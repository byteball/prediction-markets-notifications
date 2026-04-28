const wallet_general = require('ocore/wallet_general.js');

module.exports = function unwatchMarket(aa_address) {
    wallet_general.removeWatchedAddress(aa_address);
};
