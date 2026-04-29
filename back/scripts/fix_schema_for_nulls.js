const mysql = require("../mysql");
const sql = require("mssql");

async function fixSchema() {
  console.log("=== DB 스키마 수정 시작 (NULL 허용) ===");
  try {
    await mysql.pool.connect();
    const request = mysql.pool.request();
    
    console.log("1. category_id 컬럼 NULL 허용 설정 중...");
    await request.query("ALTER TABLE files ALTER COLUMN category_id INT NULL");
    
    console.log("2. sub_category_id 컬럼 NULL 허용 설정 중...");
    await request.query("ALTER TABLE files ALTER COLUMN sub_category_id INT NULL");
    
    console.log("=== 스키마 수정 완료 ===");
    process.exit(0);
  } catch (error) {
    console.error("스키마 수정 실패:", error.message);
    process.exit(1);
  }
}

fixSchema();
