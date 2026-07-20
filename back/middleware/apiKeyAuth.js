const mysql = require("../mysql");

/**
 * API Key 인증 미들웨어
 * X-API-Key 헤더를 DB의 api_keys 테이블에서 조회하여 유효성 검증
 */
const verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API Key가 필요합니다. (X-API-Key 헤더)",
      });
    }

    const result = await mysql.query("getApiKey", { key_value: apiKey });

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "유효하지 않거나 만료된 API Key입니다.",
      });
    }

    const apiKeyRecord = result.recordset[0];

    // req.user 형태를 기존 JWT 방식과 통일 (컨트롤러에서 req.user.email 사용 중)
    req.user = {
      email: `api-key:${apiKeyRecord.name}`, // uploader 필드에 기록될 값
      role: "api",
      apiKeyId: apiKeyRecord.id,
      apiKeyName: apiKeyRecord.name,
    };

    next();
  } catch (error) {
    console.error("API Key 검증 오류:", error);
    return res.status(500).json({
      success: false,
      message: "API Key 인증 중 서버 오류가 발생했습니다.",
    });
  }
};

/**
 * JWT 또는 API Key 중 하나만 통과해도 허용하는 복합 미들웨어
 * - 기존 내부 사용자: Authorization: Bearer <jwt>
 * - 외부 서버:       X-API-Key: <key>
 */
const verifyTokenOrApiKey = (req, res, next) => {
  const hasJwt = !!req.headers.authorization;
  const hasApiKey = !!req.headers["x-api-key"];

  if (!hasJwt && !hasApiKey) {
    return res.status(401).json({
      success: false,
      message: "인증이 필요합니다. (JWT 토큰 또는 X-API-Key 헤더)",
    });
  }

  if (hasApiKey) {
    // API Key 방식 우선 처리
    return verifyApiKey(req, res, next);
  }

  // JWT 방식: 기존 verifyToken 로직 인라인 실행
  const jwt = require("jsonwebtoken");
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // 마지막 접속 시간 업데이트 (fire-and-forget)
    mysql.query("updateUserLastLogin", { id: decoded.id }).catch(() => {});

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

module.exports = {
  verifyApiKey,
  verifyTokenOrApiKey,
};
