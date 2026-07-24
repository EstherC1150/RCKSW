/**
 * userRoutes.js 파일은 사용자 관련 API 엔드포인트를 정의하는 라우터 모듈입니다
 * 사용자 인증, 회원가입, 프로필 관리 등의 기능을 제공합니다
 */

// 필요한 모듈 불러오기
const express = require("express"); // Express 웹 프레임워크
const router = express.Router(); // Express 라우터 인스턴스 생성
const userController = require("../controllers/userController"); // 사용자 관련 컨트롤러
const { verifyToken, isAdmin } = require("../middleware/auth"); // 인증 미들웨어

// 사용자 목록 조회 (관리자 전용)
// verifyToken: JWT 토큰 검증
// isAdmin: 관리자 권한 확인
router.get("/", verifyToken, isAdmin, userController.getUsers);

// 이메일 중복 확인 (회원가입 전 사용)
// 인증 불필요 - 회원가입 전 단계
// POST 방식으로 이메일 정보를 body에 담아 보안 강화
router.post("/checkEmail", userController.checkEmail);

// 회원가입 엔드포인트
// 새로운 사용자 등록
router.post("/signup", userController.signup);

// 로그인 엔드포인트
// 사용자 인증 및 JWT 토큰 발급
router.post("/login", userController.login);

// 사용자 프로필 조회
// verifyToken: JWT 토큰 검증
router.get("/profile", verifyToken, userController.getProfile);

// 본인 프로필 정보 수정
router.patch("/profile", verifyToken, userController.updateMyProfile);

// 사용자 정보 수정 (관리자만 가능)
// verifyToken: JWT 토큰 검증
// isAdmin: 관리자 권한 확인
// :id: 수정할 사용자의 ID
router.patch("/:id", verifyToken, isAdmin, userController.updateUser);

// 여러 사용자 삭제 (관리자만 가능)
// verifyToken: JWT 토큰 검증
// isAdmin: 관리자 권한 확인
router.delete("/", verifyToken, isAdmin, userController.deleteUsers);

// 라우터 모듈 내보내기
module.exports = router;
