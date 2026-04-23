const fs = require('fs');
const desktopApp = require('ocore/desktop_app.js');
const db = require('ocore/db.js');

exports.init = async () => {
    const appDataDir = desktopApp.getAppDataDir();
    if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir, { recursive: true, mode: 0o700 });
        console.log(`[pending-markets] created app data dir ${appDataDir}`);
    }

    await db.query(`CREATE TABLE IF NOT EXISTS pending_markets (
        prediction_address CHAR(32) NOT NULL PRIMARY KEY,
        title              TEXT    NOT NULL,
        description        TEXT    NOT NULL,
        link               TEXT    NOT NULL,
        image_url          TEXT,
        created_at         INTEGER NOT NULL
    )`);

    console.log('[pending-markets] database initialized');
};
