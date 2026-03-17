module.exports = (numberOrString) => {
    return Number(+Number(numberOrString).toFixed(9)).toLocaleString(undefined, {
        maximumFractionDigits: 18,
        maximumSignificantDigits: 9,
    });
};
