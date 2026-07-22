const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/";

    if (file.fieldname === "thumbnail") {
      uploadPath += "thumbnails/";
    } else if (file.fieldname === "fbxFile") {
      uploadPath += "fbx/";
    } else if (file.fieldname === "vcmxFile" || file.fieldname === "sourceFile") {
      uploadPath += "source/";
    }

    // 폴더가 존재하지 않으면 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log("폴더 생성됨:", uploadPath);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB 제한 (FBX 파일이 클 수 있음)
    fieldSize: 50 * 1024 * 1024, // 필드 크기 제한 (50MB)
  },
  fileFilter: (req, file, cb) => {
    // FBX 파일은 필수
    if (file.fieldname === "fbxFile") {
      if (!file.originalname.toLowerCase().endsWith(".fbx")) {
        return cb(new Error("FBX 파일만 업로드 가능합니다."), false);
      }
    }

    // 썸네일은 선택사항 (이미지 파일만 허용)
    if (file.fieldname === "thumbnail") {
      const extension = path.extname(file.originalname).toLowerCase();
      const isSupportedVideo =
        [".mp4", ".webm"].includes(extension) &&
        ["video/mp4", "video/webm"].includes(file.mimetype);

      if (req.body.type === "vc_plugin" && !isSupportedVideo) {
        return cb(new Error("VC PlugIn 썸네일은 MP4 또는 WebM 동영상 파일만 가능합니다."), false);
      }

      if (req.body.type !== "vc_plugin" && !file.mimetype.startsWith("image/")) {
        return cb(new Error("이미지 파일만 업로드 가능합니다."), false);
      }
    }

    // VCMX 파일은 선택사항
    if (file.fieldname === "vcmxFile") {
      if (!file.originalname.toLowerCase().endsWith(".vcmx")) {
        return cb(new Error("VCMX 파일만 업로드 가능합니다."), false);
      }
    }

    cb(null, true);
  },
});

module.exports = upload;
