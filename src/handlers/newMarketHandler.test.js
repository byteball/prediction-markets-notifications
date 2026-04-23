import { describe, it, expect, vi, beforeEach } from 'vitest';
import newMarketHandler from './newMarketHandler.js';

const { pendingMarkets, generateTextEvent, marketsHook, conf } = globalThis.__fakes;

beforeEach(() => {
    pendingMarkets.add.mockReset();
    generateTextEvent.mockReset();
    marketsHook.addWatchedAddress.mockReset();
    conf.testnet = true;
    conf.frontendUrl = 'https://testnet.prophet.ooo';
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

const buildResponse = (prediction_address) => ({
    response: { responseVars: prediction_address ? { prediction_address } : {} },
});

const buildTrigger = () => ({
    messages: [
        { app: 'data', payload: { oracle: 'X', feed_name: 'F', datafeed_value: 1, event_date: 1234, comparison: '==' } },
    ],
});

describe('newMarketHandler', () => {
    it('logs and exits when prediction_address is missing', async () => {
        await newMarketHandler(buildTrigger(), buildResponse(null));

        expect(pendingMarkets.add).not.toHaveBeenCalled();
        expect(marketsHook.addWatchedAddress).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it('happy path testnet: adds record with null imageURL and watches address', async () => {
        generateTextEvent.mockResolvedValueOnce('QUESTION TEXT?');

        await newMarketHandler(buildTrigger(), buildResponse('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'));

        expect(pendingMarkets.add).toHaveBeenCalledWith({
            prediction_address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            title: 'QUESTION TEXT?',
            description: 'Sports betting, binary options, and other bets on future events',
            link: 'https://testnet.prophet.ooo/market/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            imageURL: null,
        });
        expect(marketsHook.addWatchedAddress).toHaveBeenCalledWith('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    });

    it('happy path livenet: builds og_images URL', async () => {
        conf.testnet = false;
        conf.frontendUrl = 'https://prophet.ooo';
        generateTextEvent.mockResolvedValueOnce('Q?');

        await newMarketHandler(buildTrigger(), buildResponse('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'));

        const call = pendingMarkets.add.mock.calls[0][0];
        expect(call.imageURL).toBe('https://prophet.ooo/api/og_images/market/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
        expect(call.link).toBe('https://prophet.ooo/market/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
    });

    it('does not add record when generateTextEvent throws', async () => {
        generateTextEvent.mockRejectedValueOnce(new Error('feed down'));

        await newMarketHandler(buildTrigger(), buildResponse('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'));

        expect(pendingMarkets.add).not.toHaveBeenCalled();
        expect(marketsHook.addWatchedAddress).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('generateTextEvent failed for CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'),
            expect.any(Error),
        );
    });

    it('does not call addWatchedAddress when pendingMarkets.add throws', async () => {
        generateTextEvent.mockResolvedValueOnce('Q?');
        pendingMarkets.add.mockRejectedValueOnce(new Error('db write failed'));

        await newMarketHandler(buildTrigger(), buildResponse('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'));

        expect(marketsHook.addWatchedAddress).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it.each([
        ['bad address with spaces'],
        ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'], // lowercase
        ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],  // 31 chars
        ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0'], // contains 0 (not base32)
        ['AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA)/'],
        [{ injected: true }],
    ])('rejects malformed prediction_address: %p', async (addr) => {
        await newMarketHandler(buildTrigger(), buildResponse(addr));

        expect(pendingMarkets.add).not.toHaveBeenCalled();
        expect(marketsHook.addWatchedAddress).not.toHaveBeenCalled();
    });

    it('truncates title to 200 chars with ellipsis', async () => {
        const longTitle = 'A'.repeat(500);
        generateTextEvent.mockResolvedValueOnce(longTitle);

        await newMarketHandler(buildTrigger(), buildResponse('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'));

        const savedTitle = pendingMarkets.add.mock.calls[0][0].title;
        expect(savedTitle.length).toBe(200);
        expect(savedTitle.endsWith('…')).toBe(true);
    });

    it('does not crash when addWatchedAddress throws', async () => {
        generateTextEvent.mockResolvedValueOnce('Q?');
        pendingMarkets.add.mockResolvedValueOnce();
        marketsHook.addWatchedAddress.mockRejectedValueOnce(new Error('hook boom'));

        await expect(
            newMarketHandler(buildTrigger(), buildResponse('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE')),
        ).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });
});
