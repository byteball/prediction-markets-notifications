import { describe, it, expect, vi, beforeEach } from 'vitest';
import getDataByTriggerUnit from './getDataByTriggerUnit.js';

describe('getDataByTriggerUnit', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('returns payload from the data message', () => {
        const triggerUnit = {
            messages: [
                { app: 'payment', payload: { ignored: true } },
                { app: 'data', payload: { oracle: 'X', feed_name: 'Y' } },
            ],
        };
        expect(getDataByTriggerUnit(triggerUnit)).toEqual({ oracle: 'X', feed_name: 'Y' });
    });

    it('returns {} when there is no data message', () => {
        const triggerUnit = { messages: [{ app: 'payment', payload: {} }] };
        expect(getDataByTriggerUnit(triggerUnit)).toEqual({});
    });

    it('returns {} and logs when messages is missing', () => {
        expect(getDataByTriggerUnit({})).toEqual({});
        expect(console.error).toHaveBeenCalled();
    });

    it('returns {} and logs when triggerUnit is null/undefined', () => {
        expect(getDataByTriggerUnit(undefined)).toEqual({});
        expect(getDataByTriggerUnit(null)).toEqual({});
    });

    it('returns {} when the data message has no payload', () => {
        const triggerUnit = { messages: [{ app: 'data' }] };
        expect(getDataByTriggerUnit(triggerUnit)).toEqual({});
    });
});
