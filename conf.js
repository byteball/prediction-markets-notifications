exports.bServeAsHub = false;
exports.bLight = true;
exports.bNoPassphrase = true;

exports.testnet = process.env.testnet == "1";
exports.hub = process.env.testnet ? "obyte.org/bb-test" : "obyte.org/bb";

exports.factory_aas = ["S6WVQ6JQCNQ27OQJM2IQDS6DYTKBM24G", "ZV3JPT2RDDQSEFTO7IDOZF3OWVUZF7NC", "HUJCVN2ZTG6CWUEKG4LQDAMBWSVCSP5L"];
exports.base_aas = ["AXG7G57VBLAHF3WRN5WMQ53KQEQDRONC", "A4EH5ZF5L4KEAHQIUSDEQGILHPEFJFPW"];

exports.tokenRegistryAaAddress = "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ";

exports.frontendUrl = process.env.testnet == "1" ? 'https://testnet.prophet.ooo' : 'https://prophet.ooo';
exports.sport_oracle = "TKT4UESIKTTRALRRLWS4SENSTJX6ODCW";
exports.currency_oracle = "JPQKPRI5FMTQRJF4ZZMYZYDQVRD55OTC";
exports.precious_metal_oracle = "DXYWHSZ72ZDNDZ7WYZXKWBBH425C6WZN";
exports.exchangeRatesUrl = "https://v2-data.oswap.io/api/v1/exchangeRates";

console.log("finished notification service conf");
