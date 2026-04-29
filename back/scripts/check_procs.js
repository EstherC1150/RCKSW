const mysql = require("../mysql");
async function checkProcs() {
  try {
    await mysql.pool.connect();
    const result = await mysql.pool.request().query("SELECT name FROM sys.procedures");
    process.stdout.write(JSON.stringify(result.recordset));
    process.exit(0);
  } catch (err) {
    process.stderr.write(err.message);
    process.exit(1);
  }
}
checkProcs();
