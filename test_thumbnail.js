const mysql = require('./back/mysql');
const path = require('path');

async function testDetail() {
    try {
        console.log("=== Testing getFileDetail Response ===");
        // Existing file ID 1 is a plugin ('object' type from my previous check)
        const fileId = 1;
        
        // Mocking the behavior of getFileDetail controller logic
        const fileResult = await mysql.pool.connect().then(p => p.request().query(`SELECT * FROM files WHERE id = ${fileId}`));
        const file = fileResult.recordset[0];
        
        if (!file) {
            console.log("File not found");
            return;
        }

        const types = ['library', 'object', 'vc_model', 'etc'];
        
        types.forEach(type => {
            let mockFile = { type, thumbnail_image: null };
            let thumb = mockFile.thumbnail_image ? `/uploads/thumbnails/${path.basename(mockFile.thumbnail_image)}` : null;
            if (!thumb) {
                if (type === "library") thumb = "/images/ic-vc.png";
                else if (type === "object") thumb = "/images/ic-ns.png";
                else thumb = "/images/ic-etc.png";
            }
            console.log(`Type [${type}] fallback: ${thumb}`);
        });
        console.log("File Links (mocked):", {
            source: file.source_file_link,
            icon: file.icon_file_link,
            fbx: file.fbx_file_link ? `/uploads/fbx/${path.basename(file.fbx_file_link)}` : null,
            vcmx: file.vcmx_file_link
        });

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testDetail();
