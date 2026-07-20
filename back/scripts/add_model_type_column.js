const mysql = require("../mysql");

async function addModelTypeColumn() {
  console.log("=== DB 스키마 수정 시작 (model_type 컬럼 추가) ===");
  try {
    await mysql.pool.connect();
    const request = mysql.pool.request();

    console.log("1. files.model_type 컬럼 추가 중...");
    await request.query(
      "ALTER TABLE files ADD model_type NVARCHAR(20) NULL"
    );

    console.log("=== 스키마 수정 완료 ===");
    process.exit(0);
  } catch (error) {
    console.error("스키마 수정 실패:", error.message);
    process.exit(1);
  }
}

addModelTypeColumn();
