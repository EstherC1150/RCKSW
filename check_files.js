const mysql = require('./back/mysql');
(async () => {
    try {
        await mysql.pool.connect();
        const result = await mysql.pool.request().query("SELECT id, file_name, type, thumbnail_image FROM files");
        const plugin = result.recordset.find(r => r.file_name && r.file_name.toLowerCase().includes('plugin'));
        if (plugin) {
            console.log(`FOUND PLUGIN: ID=${plugin.id}, Name=${plugin.file_name}, Thumbnail=${plugin.thumbnail_image}`);
        } else {
            console.log("NO PLUGIN FOUND IN DATABASE");
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();
