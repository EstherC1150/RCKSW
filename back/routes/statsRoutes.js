const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

// 통계 관련 라우트
router.get("/categories", statsController.getCategoryStats);

module.exports = router;
