const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 업로드 기본 경로
const uploadBasePath = path.join(__dirname, "../uploads");

// 업로드 디렉토리가 없으면 생성
if (!fs.existsSync(uploadBasePath)) {
  fs.mkdirSync(uploadBasePath, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadBasePath;

    // 파일 타입에 따라 경로 설정
    if (file.fieldname === "thumbnail_image") {
      uploadPath = path.join(uploadBasePath, "thumbnails");
    } else if (file.fieldname === "fbx_file") {
      uploadPath = path.join(uploadBasePath, "fbx");
    } else if (file.fieldname === "vcmx_file") {
      // 요청에서 type 파라미터 확인
      const type = req.body.type || "library";
      uploadPath = path.join(uploadBasePath, "vcmx", type);
    }

    // 업로드 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

module.exports = storage;
