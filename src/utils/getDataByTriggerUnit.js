module.exports = (triggerUnit) => {
    return triggerUnit.messages.find((m => m.app === 'data'))?.payload || {};
}
