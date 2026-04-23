const db = require('ocore/db.js');

exports.add = async ({ prediction_address, title, description, link, imageURL }) => {
    await db.query(
        `INSERT ${db.getIgnore()} INTO pending_markets
            (prediction_address, title, description, link, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [prediction_address, title, description, link, imageURL || null, Date.now()]
    );
};

exports.get = async (prediction_address) => {
    const rows = await db.query(
        `SELECT prediction_address, title, description, link, image_url
         FROM pending_markets WHERE prediction_address = ?`,
        [prediction_address]
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
        prediction_address: r.prediction_address,
        title: r.title,
        description: r.description,
        link: r.link,
        imageURL: r.image_url,
    };
};

exports.remove = async (prediction_address) => {
    await db.query('DELETE FROM pending_markets WHERE prediction_address = ?', [prediction_address]);
};

exports.listAddresses = async () => {
    const rows = await db.query('SELECT prediction_address FROM pending_markets');
    return rows.map((r) => r.prediction_address);
};
