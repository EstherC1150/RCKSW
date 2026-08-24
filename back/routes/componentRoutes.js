const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../middleware/upload");
const componentController = require("../controllers/componentController");
const { verifyToken, isAdmin, isDeveloperOrAdmin } = require("../middleware/auth");
const { verifyTokenOrApiKey } = require("../middleware/apiKeyAuth");

// 파일 목록 조회
router.get("/", componentController.getFiles);

// 모든 파일 정보 조회 (외부 API용 - 인증 없음)
router.get("/all", componentController.getAllFiles);

// 모든 파일 최신 버전 정보 조회 (외부 API용 - 인증 없음)
router.get("/all_update", componentController.getAllLatestFiles);

// Visual Components 소프트웨어 외부 연동/동기화 전용 최신 버전 경량 조회 (인증 없음)
router.get("/vc-sync", componentController.getVcSyncFiles);

// VCMX 파일 일괄 다운로드 (구체적인 라우트를 먼저 배치)
router.get("/download/bulk/vcmx", componentController.downloadAllVcmxFiles);

// 파일 다운로드
router.get("/download/:fileId/:fileType", componentController.downloadFile);

// Multer 에러 핸들링 미들웨어
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `파일 크기가 너무 큽니다. 최대 ${
          (5 * 1024 * 1024 * 1024) / (1024 * 1024)
        }MB까지 업로드 가능합니다.`,
        error: err.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: "파일 업로드 중 오류가 발생했습니다.",
      error: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "파일 업로드 중 오류가 발생했습니다.",
      error: err.message,
    });
  }
  next();
};

// POST 요청을 먼저 배치
router.post(
  "/",
  (req, res, next) => {
    console.log("=== POST /api/components 라우트 진입 ===");
    console.log("요청 메서드:", req.method);
    console.log("요청 URL:", req.url);
    console.log("요청 헤더:", req.headers);
    next();
  },
  verifyTokenOrApiKey, // JWT 또는 X-API-Key 둘 다 허용
  (req, res, next) => {
    console.log("=== 인증 미들웨어 통과 ===");
    console.log("사용자 정보:", req.user);
    next();
  },
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // 선택사항
    { name: "sourceFile", maxCount: 1 }, // 필수
    { name: "fbxFile", maxCount: 1 }, // FBX 파일
  ]),
  handleMulterError,
  (req, res, next) => {
    console.log("=== upload 미들웨어 통과 ===");
    console.log("업로드된 파일:", req.files);
    console.log("요청 바디:", req.body);
    next();
  },
  componentController.createComponent
);

// 컴포넌트 전체 삭제 (개발자 / 관리자 가능)
router.delete("/", verifyToken, isDeveloperOrAdmin, componentController.deleteComponents);

// 특정 버전 단일 삭제 (개발자 / 관리자 가능)
router.delete(
  "/version/:fileId",
  verifyToken,
  isDeveloperOrAdmin,
  componentController.deleteComponentVersion
);

// 파일 일괄 이동 (개발자 / 관리자 가능)
router.post(
  "/bulk-move",
  verifyToken,
  isDeveloperOrAdmin,
  componentController.bulkMoveFiles
);

router.patch(
  "/:id",
  verifyTokenOrApiKey, // JWT 또는 X-API-Key 둘 다 허용
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // 선택사항
    { name: "sourceFile", maxCount: 1 }, // 선택사항
    { name: "fbxFile", maxCount: 1 }, // FBX 파일
  ]),
  handleMulterError,
  componentController.updateComponentVersion
);

// 특정 버전의 컴포넌트 주요 기능 / 정보 수정
router.put("/:id/info", verifyTokenOrApiKey, componentController.updateComponentInfo);

// 파일 상세 정보 조회 (가장 일반적인 라우트를 마지막에 배치)
router.get("/:fileId", componentController.getFileDetail);

module.exports = router;