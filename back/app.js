/**
 * app.js 파일은 Express 애플리케이션의 핵심 설정 파일입니다
 * 미들웨어 설정, 라우트 설정, CORS 설정 등 서버의 기본 구성을 정의합니다
 */

// 필요한 모듈들을 불러옵니다
const cors = require("cors"); // Cross-Origin Resource Sharing 설정
const express = require("express"); // Express 웹 프레임워크
const app = express(); // Express 애플리케이션 인스턴스 생성
const path = require("path"); // 파일 경로 처리를 위한 모듈
require("dotenv").config({ path: "mysql/.env" }); // 환경 변수 설정 파일 로드

// CORS 설정
// .env의 ALLOWED_ORIGINS(콤마로 구분)에 운영 도메인/IP를 추가하면 코드 수정 없이 반영됨
const extraOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: [
    "http://localhost:3100",
    "http://localhost:3001",
    "http://localhost:3000",
    ...extraOrigins,
  ],
  credentials: true,
}));

// 각 기능별 라우트 모듈을 불러옵니다
const userRoutes = require("./routes/userRoutes"); // 사용자 관련 라우트
const componentRoutes = require("./routes/componentRoutes"); // 컴포넌트 관련 라우트
const categoryRoutes = require("./routes/categoryRoutes"); // 카테고리 관련 라우트
const statsRoutes = require("./routes/statsRoutes"); // 통계 관련 라우트

const PORT = process.env.PORT || 8081;

// 요청 본문 파싱을 위한 미들웨어 설정
app.use(express.json({ limit: "5120mb" })); // JSON 요청 본문 파싱 (최대 5GB)
app.use(express.urlencoded({ extended: true, limit: "5120mb" })); // URL-encoded 요청 본문 파싱 (최대 5GB)

// 정적 파일 제공을 위한 미들웨어 설정
// uploads 디렉토리의 파일들을 웹에서 접근 가능하도록 설정
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API 라우트 설정
app.use("/api/users", userRoutes); // 사용자 관련 API 엔드포인트
app.use("/api/components", componentRoutes); // 컴포넌트 관련 API 엔드포인트
app.use("/api/categories", categoryRoutes); // 카테고리 관련 API 엔드포인트
app.use("/api/stats", statsRoutes); // 통계 관련 API 엔드포인트

// 루트 경로 핸들러
app.get("/", (req, res) => {
  res.json({ message: "API 서버 정상 동작 중 🚀" });
});

// 서버 시작 및 타임아웃 설정
// app.listen()의 반환값을 server 변수에 저장하여 타임아웃 설정 가능
const server = app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

// 서버 타임아웃 설정 (30분 = 1,800,000ms)
// 큰 파일 업로드를 위해 충분히 긴 타임아웃 설정
server.timeout = 30 * 60 * 1000; // 30분
server.keepAliveTimeout = 30 * 60 * 1000; // 30분
server.headersTimeout = 30 * 60 * 1000 + 1000; // headersTimeout은 keepAliveTimeout보다 약간 길게

// Express 애플리케이션 인스턴스를 외부에서 사용할 수 있도록 내보냅니다
module.exports = app;