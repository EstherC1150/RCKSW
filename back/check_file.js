const mysql = require("./mysql");

async function checkFile() {
  try {
    const result = await mysql.query("getFileById", { id: 1 });
    console.log("File ID 1 result:", JSON.stringify(result.recordset[0], null, 2));
    
    if (result.recordset[0]) {
      const file = result.recordset[0];
      console.log("Source file link:", file.source_file_link);
      console.log("FBX file link:", file.fbx_file_link);
      console.log("Icon file link:", file.icon_file_link);
    } else {
      console.log("File ID 1 not found or not active.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkFile();
