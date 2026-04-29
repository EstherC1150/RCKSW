const mysql = require("./back/mysql");

async function fixComponentIds() {
  try {
    console.log("Starting to fix component_id values...");
    
    // Find files where component_id is NULL
    const result = await mysql.query("getAllFilesDebug", {});
    const filesToFix = result.recordset.filter(f => f.component_id === null);
    
    console.log(`Found ${filesToFix.length} files to fix.`);
    
    for (const file of filesToFix) {
      console.log(`Fixing file ID ${file.id}...`);
      await mysql.pool.request()
        .input('id', file.id)
        .query("UPDATE files SET component_id = id WHERE id = @id");
    }
    
    console.log("Fix completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error during fix:", error);
    process.exit(1);
  }
}

fixComponentIds();
