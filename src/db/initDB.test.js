import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as initDB from './initDB.js';

const { db, fs, desktopApp } = globalThis.__fakes;

beforeEach(() => {
    db.__reset();
    fs.existsSync.mockReset();
    fs.mkdirSync.mockReset();
    desktopApp.getAppDataDir.mockReset().mockReturnValue('/tmp/fake-app-data-dir');
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('initDB.init', () => {
    it('creates the app data dir when it does not exist', async () => {
        fs.existsSync.mockReturnValueOnce(false);

        await initDB.init();

        expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/fake-app-data-dir', {
            recursive: true,
            mode: 0o700,
        });
    });

    it('does not mkdir when dir already exists', async () => {
        fs.existsSync.mockReturnValueOnce(true);

        await initDB.init();

        expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('creates the pending_markets table', async () => {
        fs.existsSync.mockReturnValueOnce(true);

        await initDB.init();

        expect(db.__calls).toHaveLength(1);
        const sql = db.__calls[0][0];
        expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS pending_markets/);
        expect(sql).toMatch(/prediction_address\s+CHAR\(32\)\s+NOT NULL PRIMARY KEY/);
    });
});
