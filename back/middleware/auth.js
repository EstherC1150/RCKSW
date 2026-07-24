const jwt = require("jsonwebtoken");
const mysql = require("../mysql");

const verifyToken = (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "인증 토큰이 필요합니다.",
      });
    }

    const token = authHeader.split(" ")[1]; // Bearer token 형식에서 토큰 추출

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 검증된 유저 정보를 request 객체에 저장
    req.user = decoded;

    // 마지막 접속 시간 업데이트
    mysql.query("updateUserLastLogin", { id: decoded.id });

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "토큰이 만료되었습니다.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }
};

// 관리자 권한 체크 미들웨어
const isAdmin = (req, res, next) => {
  try {
    // JWT 토큰에서 role 확인
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "인증 토큰이 필요합니다.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // role이 'admin'인지 확인
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "관리자 권한이 필요합니다.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }
};

// 개발자 또는 관리자 권한 체크 미들웨어
const isDeveloperOrAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "인증 토큰이 필요합니다.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!["admin", "developer"].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "개발자 또는 관리자 권한이 필요합니다.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "유효하지 않은 토큰입니다.",
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isDeveloperOrAdmin,
};
