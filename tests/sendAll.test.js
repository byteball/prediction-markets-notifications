import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendNewMarketToAll, sendDailyDigestToAll } from '../src/channels/sendAll.js';

const { discord, telegram } = globalThis.__fakes;

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    discord.sendNewMarket.mockReset();
    discord.sendDailyDigest.mockReset();
    telegram.sendNewMarket.mockReset();
    telegram.sendDailyDigest.mockReset();
});

describe('sendNewMarketToAll', () => {
    const data = { title: 'T', description: 'D', link: 'L', imageURL: null };

    it('returns { sent: 2, total: 2 } when both channels succeed', async () => {
        discord.sendNewMarket.mockResolvedValueOnce();
        telegram.sendNewMarket.mockResolvedValueOnce();

        const result = await sendNewMarketToAll(data);

        expect(result).toEqual({ sent: 2, total: 2 });
        expect(discord.sendNewMarket).toHaveBeenCalledWith(data);
        expect(telegram.sendNewMarket).toHaveBeenCalledWith(data);
        expect(console.error).not.toHaveBeenCalled();
    });

    it('returns { sent: 1, total: 2 } and logs when one channel fails', async () => {
        discord.sendNewMarket.mockRejectedValueOnce(new Error('discord boom'));
        telegram.sendNewMarket.mockResolvedValueOnce();

        const result = await sendNewMarketToAll(data);

        expect(result).toEqual({ sent: 1, total: 2 });
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('sendNewMarket discord failed'),
            expect.any(Error),
        );
    });

    it('returns { sent: 0, total: 2 } when both channels fail', async () => {
        discord.sendNewMarket.mockRejectedValueOnce(new Error('discord down'));
        telegram.sendNewMarket.mockRejectedValueOnce(new Error('telegram down'));

        const result = await sendNewMarketToAll(data);

        expect(result).toEqual({ sent: 0, total: 2 });
        expect(console.error).toHaveBeenCalledTimes(2);
    });
});

describe('sendDailyDigestToAll', () => {
    it('does not throw when a channel rejects', async () => {
        discord.sendDailyDigest.mockRejectedValueOnce(new Error('boom'));
        telegram.sendDailyDigest.mockResolvedValueOnce();

        await expect(sendDailyDigestToAll({ payload: 1 })).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });
});
