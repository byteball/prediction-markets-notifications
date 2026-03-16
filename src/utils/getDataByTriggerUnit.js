module.exports = (triggerUnit) => {
    if (!triggerUnit?.messages) {
        console.error('getDataByTriggerUnit: triggerUnit has no messages', JSON.stringify(triggerUnit));
        return {};
    }
    return triggerUnit.messages.find((m => m.app === 'data'))?.payload || {};
}
