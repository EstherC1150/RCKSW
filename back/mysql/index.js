/**
 * mysql/index.js 파일은 데이터베이스 연결 및 쿼리 처리를 담당하는 핵심 모듈입니다
 * MSSQL 데이터베이스 연결 설정, 연결 풀 관리, 쿼리 실행 기능을 제공합니다
 */

// 필요한 모듈 불러오기
const sql = require("mssql"); // MSSQL 데이터베이스 연결을 위한 모듈
const sqlQueries = require("./sql"); // SQL 쿼리문이 정의된 모듈
const path = require("path"); // 경로 처리를 위한 모듈

// 환경변수 파일 로드 (절대 경로 사용)
require("dotenv").config({ path: path.join(__dirname, ".env") });

// 환경변수 디버깅
console.log("=== 환경변수 디버깅 ===");
console.log("MSSQL_HOST:", process.env.MSSQL_HOST);
console.log("MSSQL_DATABASE:", process.env.MSSQL_DB);
console.log("MSSQL_USER:", process.env.MSSQL_USERNAME);
console.log(
  "MSSQL_PASSWORD:",
  process.env.MSSQL_PASSWORD ? "***설정됨***" : "***설정되지 않음***"
);
console.log("=========================");

// 데이터베이스 연결 설정
const config = {
  server: process.env.MSSQL_HOST, // 데이터베이스 서버 주소
  port: 1433, // MSSQL 기본 포트
  database: process.env.MSSQL_DB, // 데이터베이스 이름
  user: process.env.MSSQL_USERNAME, // 데이터베이스 사용자 계정
  password: process.env.MSSQL_PASSWORD, // 데이터베이스 비밀번호
  options: {
    encrypt: false, // 암호화 설정 (Azure SQL이 아닌 경우 false)
    trustServerCertificate: true, // 개발 환경에서의 인증서 검증 설정
    charset: "utf8", // 문자 인코딩 설정
    requestTimeout: 30000, // 쿼리 실행 타임아웃 (30초)
  },
  pool: {
    max: 10, // 최대 연결 수
    min: 0, // 최소 연결 수
    idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
  },
};

// 데이터베이스 연결 풀 생성
// 연결 풀을 사용하여 데이터베이스 연결을 효율적으로 관리
const pool = new sql.ConnectionPool(config);

/**
 * 데이터베이스 연결 테스트 함수
 * 서버 시작 시 데이터베이스 연결이 정상적으로 이루어지는지 확인
 */
const testConnection = async () => {
  try {
    const pool = await sql.connect(config);
    console.log("MSSQL 연결 성공!");

    // 간단한 테스트 쿼리 실행
    const result = await pool.request().query("SELECT 1 as test");
    console.log("테스트 쿼리 결과:", result.recordset);

    await pool.close();
    console.log("연결 종료");
  } catch (err) {
    console.error("MSSQL 연결 실패:", err);
  }
};

// 서버 시작 시 연결 테스트 실행
testConnection();

/**
 * SQL 쿼리 실행 함수
 * @param {string} alias - 실행할 쿼리의 별칭 (sqlQueries 객체의 키)
 * @param {object} params - 쿼리에 바인딩할 파라미터
 * @returns {Promise} 쿼리 실행 결과
 */
const query = async (alias, params) => {
  try {
    await pool.connect(); // 연결 풀에서 연결 획득
    const request = pool.request();

    // 파라미터가 있는 경우 쿼리에 바인딩
    if (params) {
      console.log("SQL 쿼리 파라미터 바인딩:", params);
      Object.entries(params).forEach(([key, value]) => {
        console.log(`바인딩 파라미터: ${key} = ${value}`);
        request.input(key, value);
      });
    }

    // 쿼리 실행 및 결과 반환
    console.log("실행할 SQL 쿼리:", sqlQueries[alias]);
    const result = await request.query(sqlQueries[alias]);
    console.log("SQL 쿼리 실행 결과:", result);
    return result;
  } catch (err) {
    // 에러 발생 시 상세 정보 로깅
    console.error("SQL 실행 에러:", {
      alias,
      error: err.message,
      sql: sqlQueries[alias],
      params: params,
      stack: err.stack,
    });
    throw err;
  }
};

// 모듈 내보내기
module.exports = {
  query, // 쿼리 실행 함수
  pool, // 연결 풀 객체
};
