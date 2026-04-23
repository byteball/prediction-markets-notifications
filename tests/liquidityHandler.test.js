import { describe, it, expect, vi, beforeEach } from 'vitest';
import liquidityHandler from '../src/handlers/liquidityHandler.js';

const { pendingMarkets, sendAll } = globalThis.__fakes;

beforeEach(() => {
    pendingMarkets.get.mockReset();
    pendingMarkets.remove.mockReset();
    sendAll.sendNewMarketToAll.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

const record = {
    prediction_address: 'AA',
    title: 'T',
    description: 'D',
    link: 'L',
    imageURL: null,
};

describe('liquidityHandler', () => {
    it('logs and no-ops when responseObj has no aa_address', async () => {
        await liquidityHandler({}, {});

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('no aa_address in responseObj'),
        );
        expect(pendingMarkets.get).not.toHaveBeenCalled();
        expect(sendAll.sendNewMarketToAll).not.toHaveBeenCalled();
    });

    it('does nothing when market is not in pending', async () => {
        pendingMarkets.get.mockResolvedValueOnce(null);

        await liquidityHandler({}, { aa_address: 'AA' });

        expect(sendAll.sendNewMarketToAll).not.toHaveBeenCalled();
        expect(pendingMarkets.remove).not.toHaveBeenCalled();
    });

    it('sends notification and removes entry when both channels succeed', async () => {
        pendingMarkets.get.mockResolvedValueOnce(record);
        sendAll.sendNewMarketToAll.mockResolvedValueOnce({ sent: 2, total: 2 });

        await liquidityHandler({}, { aa_address: 'AA' });

        expect(sendAll.sendNewMarketToAll).toHaveBeenCalledWith({
            title: 'T',
            description: 'D',
            link: 'L',
            imageURL: null,
        });
        expect(pendingMarkets.remove).toHaveBeenCalledWith('AA');
    });

    it('sends and still removes when one channel succeeds (at-least-one policy)', async () => {
        pendingMarkets.get.mockResolvedValueOnce(record);
        sendAll.sendNewMarketToAll.mockResolvedValueOnce({ sent: 1, total: 2 });

        await liquidityHandler({}, { aa_address: 'AA' });

        expect(pendingMarkets.remove).toHaveBeenCalledWith('AA');
    });

    it('keeps entry for retry when all channels fail', async () => {
        pendingMarkets.get.mockResolvedValueOnce(record);
        sendAll.sendNewMarketToAll.mockResolvedValueOnce({ sent: 0, total: 2 });

        await liquidityHandler({}, { aa_address: 'AA' });

        expect(pendingMarkets.remove).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('keeping in pending for retry'),
        );
    });

    it('exits quietly when pendingMarkets.get throws', async () => {
        pendingMarkets.get.mockRejectedValueOnce(new Error('db down'));

        await liquidityHandler({}, { aa_address: 'AA' });

        expect(sendAll.sendNewMarketToAll).not.toHaveBeenCalled();
        expect(pendingMarkets.remove).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it('does not remove when sendNewMarketToAll throws', async () => {
        pendingMarkets.get.mockResolvedValueOnce(record);
        sendAll.sendNewMarketToAll.mockRejectedValueOnce(new Error('sendAll boom'));

        await liquidityHandler({}, { aa_address: 'AA' });

        expect(pendingMarkets.remove).not.toHaveBeenCalled();
    });

    it('does not crash when remove fails after successful send', async () => {
        pendingMarkets.get.mockResolvedValueOnce(record);
        sendAll.sendNewMarketToAll.mockResolvedValueOnce({ sent: 2, total: 2 });
        pendingMarkets.remove.mockRejectedValueOnce(new Error('delete failed'));

        await expect(liquidityHandler({}, { aa_address: 'AA' })).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });
});
