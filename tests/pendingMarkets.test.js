import { describe, it, expect, beforeEach } from 'vitest';
import * as pendingMarkets from '../src/db/pendingMarkets.js';

const db = globalThis.__fakes.db;

beforeEach(() => {
    db.__reset();
});

describe('pendingMarkets.add', () => {
    it('runs INSERT OR IGNORE with all six columns', async () => {
        await pendingMarkets.add({
            prediction_address: 'AAAA',
            title: 'T',
            description: 'D',
            link: 'L',
            imageURL: 'IMG',
        });

        expect(db.__calls).toHaveLength(1);
        const [sql, params] = db.__calls[0];
        expect(sql).toMatch(/INSERT OR IGNORE INTO pending_markets/);
        expect(sql).toMatch(/\(\s*prediction_address, title, description, link, image_url, created_at\s*\)/);
        expect(params.slice(0, 5)).toEqual(['AAAA', 'T', 'D', 'L', 'IMG']);
        expect(typeof params[5]).toBe('number');
        expect(params[5]).toBeGreaterThan(0);
    });

    it('stores null image_url when imageURL is falsy', async () => {
        await pendingMarkets.add({
            prediction_address: 'BBBB',
            title: 'T',
            description: 'D',
            link: 'L',
            imageURL: null,
        });

        expect(db.__calls[0][1][4]).toBeNull();
    });

    it('stores null image_url when imageURL is undefined', async () => {
        await pendingMarkets.add({
            prediction_address: 'CCCC',
            title: 'T',
            description: 'D',
            link: 'L',
        });

        expect(db.__calls[0][1][4]).toBeNull();
    });
});

describe('pendingMarkets.get', () => {
    it('returns normalized object (image_url -> imageURL)', async () => {
        db.__setQueryImpl(async () => [{
            prediction_address: 'AAAA',
            title: 'T',
            description: 'D',
            link: 'L',
            image_url: 'IMG',
        }]);

        const result = await pendingMarkets.get('AAAA');
        expect(result).toEqual({
            prediction_address: 'AAAA',
            title: 'T',
            description: 'D',
            link: 'L',
            imageURL: 'IMG',
        });

        const [sql, params] = db.__calls[0];
        expect(sql).toMatch(/SELECT .* FROM pending_markets WHERE prediction_address = \?/s);
        expect(params).toEqual(['AAAA']);
    });

    it('returns null when no row', async () => {
        db.__setQueryImpl(async () => []);
        expect(await pendingMarkets.get('XXXX')).toBeNull();
    });
});

describe('pendingMarkets.remove', () => {
    it('issues DELETE with the address', async () => {
        await pendingMarkets.remove('AAAA');

        const [sql, params] = db.__calls[0];
        expect(sql).toMatch(/DELETE FROM pending_markets WHERE prediction_address = \?/);
        expect(params).toEqual(['AAAA']);
    });
});

describe('pendingMarkets.listAddresses', () => {
    it('returns array of addresses', async () => {
        db.__setQueryImpl(async () => [
            { prediction_address: 'A1' },
            { prediction_address: 'A2' },
        ]);

        expect(await pendingMarkets.listAddresses()).toEqual(['A1', 'A2']);
    });

    it('returns empty array when no rows', async () => {
        db.__setQueryImpl(async () => []);
        expect(await pendingMarkets.listAddresses()).toEqual([]);
    });
});
