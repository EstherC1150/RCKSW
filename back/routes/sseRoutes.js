const express = require("express");
const router = express.Router();
const {
  setupSSE,
  getConnectedClientsCount,
  getConnectedClients,
} = require("../controllers/sseController");

// SSE 연결 엔드포인트
router.get("/connect", setupSSE);

// 연결된 클라이언트 수 확인 (디버깅용)
router.get("/clients/count", (req, res) => {
  res.json({
    count: getConnectedClientsCount(),
    timestamp: Date.now(),
  });
});

// 연결된 클라이언트 목록 확인 (디버깅용)
router.get("/clients/list", (req, res) => {
  res.json({
    clients: getConnectedClients(),
    timestamp: Date.now(),
  });
});

module.exports = router;
