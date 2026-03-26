const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// 카테고리 목록 조회 (모든 사용자 접근 가능)
router.get("/", categoryController.getCategories);

// 카테고리 생성 (관리자만 접근 가능)
router.post("/", verifyToken, isAdmin, categoryController.createCategory);

// 새로운 라우트
router.patch("/:id", verifyToken, isAdmin, categoryController.updateCategory);
router.delete("/:id", verifyToken, isAdmin, categoryController.deleteCategory);

// 서브 카테고리 조회
router.get("/subCategories/:categoryId", categoryController.getSubCategories);

// 서브 카테고리 생성 (관리자만 접근 가능)
router.post(
  "/:categoryId/subCategories",
  verifyToken,
  isAdmin,
  categoryController.createSubCategory
);

// 서브 카테고리 수정 (관리자만 접근 가능)
router.patch(
  "/subCategories/:id",
  verifyToken,
  isAdmin,
  categoryController.updateSubCategory
);

// 서브 카테고리 삭제 (관리자만 접근 가능)
router.delete(
  "/subCategories/:id",
  verifyToken,
  isAdmin,
  categoryController.deleteSubCategory
);

module.exports = router;
