const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "mysql/.env") });

const config = {
  server: process.env.MSSQL_HOST,
  port: 1433,
  database: process.env.MSSQL_DB,
  user: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function migrate() {
  try {
    console.log("Starting DB Migration...");
    const pool = await sql.connect(config);
    
    // Update library to vc_plugin
    const res1 = await pool.request().query(
      "UPDATE files SET type = 'vc_plugin' WHERE type = 'library'"
    );
    console.log(`Updated 'library' to 'vc_plugin': ${res1.rowsAffected} rows`);

    // Update object to ns_plugin
    const res2 = await pool.request().query(
      "UPDATE files SET type = 'ns_plugin' WHERE type = 'object'"
    );
    console.log(`Updated 'object' to 'ns_plugin': ${res2.rowsAffected} rows`);

    await pool.close();
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
