const mysql = require("../mysql");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const { Jimp } = require("jimp");
const sharp = require("sharp");
const { FBXThumbnailGenerator } = require("../utils/thumbnailGenerator");
const {
  sendComponentUpdate,
  sendComponentDelete,
  sendComponentCreate,
} = require("../controllers/sseController");

// 파일 타입과 확장자에 따라 저장 경로(카테고리)를 결정하는 헬퍼 함수
const getPathByCategory = (type, originalName, fieldName) => {
  const ext = path.extname(originalName).toLowerCase();
  let category = 'etc';
  
  // fieldName에 따른 기본 카테고리 분류
  if (fieldName === 'iconFile') {
    category = 'icon';
  } else if (fieldName === 'fbxFile') {
    category = 'fbx';
  } else if (fieldName === 'sourceFile') {
    // 소스 파일의 경우 확장자에 따라 세분화
    if (ext === '.dll') category = 'dll';
    else if (ext === '.vcmx' || ext === '.vcl') category = 'vcmx';
    else if (ext === '.fbx') category = 'fbx';
    else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) category = 'icon';
  }
  
  const typeFolder = type || 'etc';
  const relativeDir = path.join('uploads', 'source', typeFolder, category);
  const absoluteDir = path.join(__dirname, '..', relativeDir);
  
  return { relativeDir, absoluteDir, category };
};

// FBX 파일에서 자동 썸네일 생성 (Sharp + Jimp 사용)
const generateThumbnailFromFBX = async (fbxFilePath, outputPath) => {
  try {
    console.log("FBX 썸네일 생성 시작:", { fbxFilePath, outputPath });

    // FBX 파일 정보 수집
    const fbxFileName = path.basename(fbxFilePath);
    const fileStats = fsSync.statSync(fbxFilePath);
    const fileSizeKB = Math.round(fileStats.size / 1024);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

    // Sharp를 사용해서 기본 썸네일 이미지 생성
    const width = 512;
    const height = 512;

    // 그라데이션 배경 생성
    const gradientSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#87ceeb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4682b4;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
        
        <!-- 3D 박스 아이콘 -->
        <g transform="translate(${width / 2 - 50}, ${height / 2 - 80})">
          <path d="M10 20 L50 0 L90 20 L90 60 L50 80 L10 60 Z" 
                fill="#ffffff" fill-opacity="0.9" stroke="#333" stroke-width="2"/>
          <path d="M10 20 L50 40 L90 20 M50 40 L50 80" 
                fill="none" stroke="#333" stroke-width="2"/>
        </g>
        
        <!-- FBX 텍스트 -->
        <text x="${width / 2}" y="${height / 2 + 40}" 
              font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
              text-anchor="middle" fill="#ffffff">FBX Model</text>
              
        <!-- 파일명 -->
        <text x="${width / 2}" y="${height / 2 + 70}" 
              font-family="Arial, sans-serif" font-size="14" 
              text-anchor="middle" fill="#ffffff">${fbxFileName}</text>
              
        <!-- 파일 크기 -->
        <text x="${width / 2}" y="${height / 2 + 90}" 
              font-family="Arial, sans-serif" font-size="12" 
              text-anchor="middle" fill="#ffffff">${fileSizeMB}MB (${fileSizeKB}KB)</text>
              
        <!-- 생성 날짜 -->
        <text x="${width / 2}" y="${height / 2 + 110}" 
              font-family="Arial, sans-serif" font-size="10" 
              text-anchor="middle" fill="#ffffff">Generated: ${new Date().toLocaleDateString()}</text>
              
        <!-- 하단 텍스트 -->
        <text x="${width / 2}" y="${height - 20}" 
              font-family="Arial, sans-serif" font-size="10" 
              text-anchor="middle" fill="#ffffff" fill-opacity="0.8">Auto Generated Thumbnail</text>
      </svg>
    `;

    // SVG를 PNG로 변환
    await sharp(Buffer.from(gradientSvg)).png().toFile(outputPath);

    console.log("FBX 썸네일 생성 완료:", outputPath);
    return outputPath;
  } catch (error) {
    console.error("썸네일 생성 실패:", error);

    // Sharp 실패 시 Jimp로 폴백
    try {
      console.log("Sharp 실패, Jimp로 폴백 시도...");

      const image = new Jimp({ width: 512, height: 512, color: 0x87ceebff });
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

      // 텍스트 추가
      image.print(
        font,
        0,
        200,

        {
          text: "FBX Model",
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        },
        512,
        100
      );

      const fbxFileName = path.basename(fbxFilePath);
      const fileStats = fsSync.statSync(fbxFilePath);
      const fileSizeKB = Math.round(fileStats.size / 1024);

      image.print(
        smallFont,
        0,
        280,
        {
          text: `File: ${fbxFileName}`,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        },
        512,
        50
      );

      image.print(
        smallFont,
        0,
        310,
        {
          text: `Size: ${fileSizeKB}KB`,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        },
        512,
        50
      );

      await image.writeAsync(outputPath);
      console.log("Jimp 폴백으로 썸네일 생성 완료:", outputPath);
      return outputPath;
    } catch (jimpError) {
      console.error("Jimp 폴백도 실패:", jimpError);
      throw error;
    }
  }
};

// 컴포넌트 등록 컨트롤러
exports.createComponent = async (req, res) => {
  try {
    console.log("=== createComponent 시작 ===");

    const userEmail = req.user?.email || "guest";

    const {
      componentName,
      version,
      description,
      features,
      environment,
      categoryId,
      subCategoryId,
      type,
    } = req.body;

    // features가 배열이면 Join하고, 문자열이면 그대로 사용
    let finalFeatures = Array.isArray(features) ? features : (features || "");

    // 파일은 선택사항 (단독 생성되는 경우도 고려)
    // 필수값이 누락된 경우 "null" 문자열로 대체 (프론트엔드에서 처리하지만 백엔드에서도 안전장치 마련)
    const finalComponentName = componentName || "null";
    const finalVersion = version || "null";
    const finalCategoryIdStr = categoryId || "null";
    const finalSubCategoryIdStr = subCategoryId || "null";


    // 카테고리 정보는 더 이상 경로에 사용하지 않음 (null 처리 예정)
    const categoryName = "deleted"; 
    const subCategoryName = "deleted";
    const finalCategoryId = null; 
    const finalSubCategoryId = null;


    // 아이콘 파일 저장
    let iconUrl = null;
    if (req.files.iconFile?.length) {
      const uploadedFile = req.files.iconFile[0];
      const { relativeDir, absoluteDir } = getPathByCategory(type, uploadedFile.originalname || uploadedFile.filename, 'iconFile');
      
      await fs.mkdir(absoluteDir, { recursive: true });

      const sourcePath = uploadedFile.path;
      const targetPath = path.join(absoluteDir, uploadedFile.filename);
      await fs.rename(sourcePath, targetPath);

      iconUrl = `/${relativeDir}/${uploadedFile.filename}`.replace(/\\/g, "/");
    }

    // 소스 파일 저장
    let sourceUrl = null;
    let isFbxFile = false;
    let sourceFilePath = null;
    
    if (req.files?.sourceFile?.length) {
      const sourceFile = req.files.sourceFile[0];
      const { relativeDir, absoluteDir } = getPathByCategory(type, sourceFile.originalname || sourceFile.filename, 'sourceFile');
      
      await fs.mkdir(absoluteDir, { recursive: true });

      const ext = path.extname(sourceFile.originalname || sourceFile.filename).toLowerCase();
      isFbxFile = ext === '.fbx';
      
      const sourcePath = sourceFile.path;
      const targetPath = path.join(absoluteDir, sourceFile.filename);
      await fs.rename(sourcePath, targetPath);
      
      sourceFilePath = targetPath; // 썸네일 생성 시 사용할 절대 경로
      sourceUrl = `/${relativeDir}/${sourceFile.filename}`.replace(/\\/g, "/");
    }

    // FBX 파일 저장 (VC Model 등에서 사용)
    let fbxUrl = null;
    let fbxFilePath = null;
    if (req.files?.fbxFile?.length) {
      const fbxFile = req.files.fbxFile[0];
      const { relativeDir, absoluteDir } = getPathByCategory(type, fbxFile.originalname || fbxFile.filename, 'fbxFile');
      
      await fs.mkdir(absoluteDir, { recursive: true });

      const srcPath = fbxFile.path;
      const targetPath = path.join(absoluteDir, fbxFile.filename);
      await fs.rename(srcPath, targetPath);

      fbxFilePath = targetPath;
      fbxUrl = `/${relativeDir}/${fbxFile.filename}`.replace(/\\/g, "/");
      isFbxFile = true; // FBX 파일이 직접 업로드된 경우
    }

    // 썸네일 처리 (프론트엔드 생성 우선, 없으면 서버에서 생성)
    let thumbnailUrl = null;

    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      // 1. 프론트엔드에서 직접 업로드한 썸네일이 있는 경우 최우선 사용
      const thumbnailFile = req.files.thumbnail[0];
      thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`.replace(/\\/g, "/");
      console.log("프론트엔드 업로드 썸네일 사용:", thumbnailUrl);
    } else if (isFbxFile && (fbxFilePath || sourceFilePath)) {
      // 2. FBX 파일이 있는 경우 (직접 업로드된 fbxFile 또는 fbx 확장자의 sourceFile)
      const targetFbxPath = fbxFilePath || sourceFilePath;
      const timestamp = Date.now();
      const thumbnailFilename = `auto-thumbnail-${timestamp}.png`;
      const thumbnailPath = path.join(
        __dirname,
        "..",
        "uploads",
        "thumbnails",
        thumbnailFilename
      );

      // uploads/thumbnails 디렉토리 확인 및 생성
      const thumbnailDir = path.join(__dirname, "..", "uploads", "thumbnails");
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnailGenerator = new FBXThumbnailGenerator();

      try {
        await thumbnailGenerator.generateThumbnailFromFBX(
          targetFbxPath,
          thumbnailPath
        );
        console.log("서버 3D 썸네일 생성 성공!");
        thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
      } catch (error) {
        console.log(
          "서버 3D 썸네일 생성 실패, 폴백 생성 시도:",
          error.message
        );
        try {
          await generateThumbnailFromFBX(targetFbxPath, thumbnailPath);
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
        } catch (fallbackError) {
          console.error("폴백 썸네일 생성도 실패:", fallbackError);
        }
      }
    }



    // 4. 최종적으로 썸네일이 없는 경우 기본 타입별 전용 아이콘 할당 (프론트엔드 로컬 asset 사용)
    if (!thumbnailUrl) {
      if (type === "vc_plugin" || type === "vc_model") {
        thumbnailUrl = "/images/ic-vc.png";
      } else if (type === "ns_plugin" || type === "ns_model") {
        thumbnailUrl = "/images/ic-ns.png";
      } else {
        thumbnailUrl = "/images/ic-etc.png";
      }
      console.log("기본 타입별 썸네일 사용:", thumbnailUrl);
    }


    // DB 등록
    const insertData = {
      file_name: finalComponentName,
      version: finalVersion,
      description: description || "null",
      main_features: typeof finalFeatures === 'string' ? JSON.stringify([finalFeatures]) : JSON.stringify(finalFeatures || []),
      recommended_environment: environment || "null",
      thumbnail_image: thumbnailUrl,
      source_file_link: sourceUrl,
      icon_file_link: iconUrl,
      category_id: finalCategoryId,
      sub_category_id: finalSubCategoryId,
      uploader: userEmail,
      type,
      fbx_file_link: fbxUrl,
      vcmx_file_link: sourceUrl && sourceUrl.toLowerCase().endsWith('.vcmx') ? sourceUrl : null,
    };

    const result = await mysql.query("componentCreate", insertData);

    // 저장 데이터 확인
    const savedData = await mysql.query("getFileById", {
      id: result.recordset[0].id,
    });

    // SSE 이벤트 전송 - 새 컴포넌트 생성 알림
    try {
      sendComponentCreate({
        id: savedData.recordset[0].id,
        file_name: savedData.recordset[0].file_name,
        version: savedData.recordset[0].version,
        description: savedData.recordset[0].description,
        type: savedData.recordset[0].type,
        category_id: savedData.recordset[0].category_id,
        sub_category_id: savedData.recordset[0].sub_category_id,
        uploader: savedData.recordset[0].uploader,
        action: "component_created",
        timestamp: new Date().toISOString(),
      });
    } catch (sseError) {
      console.warn("SSE 이벤트 전송 실패:", sseError);
    }

    res.status(200).json({
      success: true,
      message: "컴포넌트 등록 완료",
      data: savedData.recordset[0],
    });
  } catch (error) {
    console.error("컴포넌트 등록 에러:", error);
    res.status(500).json({
      success: false,
      message: "컴포넌트 등록 실패",
      error: error.message,
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = parseInt(req.query.categoryId) || 0;
    const subCategoryId = parseInt(req.query.subCategoryId) || 0;
    const searchQuery = req.query.search || "";
    const sortBy = req.query.sortBy || "latest";
    const type = req.query.type || "";
    const offset = (page - 1) * limit;

    const searchParams = {
      category_id: categoryId,
      sub_category_id: subCategoryId,
      search: searchQuery,
      type: type,
      sortBy: sortBy,
      offset: offset,
      limit: limit,
    };

    // 전체 수 조회
    const totalResult = await mysql.query("fileTotal", searchParams);

    // 파일 목록 조회
    const result = await mysql.query("fileList", searchParams);

    // 프론트엔드에서 사용하는 형식으로 응답
    res.status(200).send({
      totalPages: Math.ceil(totalResult.recordset[0].total / limit),
      currentPage: page,
      sortBy: sortBy,
      type: type,
      files: result.recordset.map((file) => {
        // 썸네일 경로가 없으면 타입에 따른 기본 이미지 설정
        let thumbnailPath = file.thumbnail_image 
          ? `/uploads/thumbnails/${path.basename(file.thumbnail_image)}`
          : null;
          
        if (!thumbnailPath) {
          // 썸네일 파일 경로 설정
          if (file.type === "vc_plugin" || file.type === "vc_model") thumbnailPath = "/uploads/thumbnails/ic-vc.png";
          else if (file.type === "ns_plugin" || file.type === "ns_model") thumbnailPath = "/uploads/thumbnails/ic-ns.png";
          else thumbnailPath = "/uploads/thumbnails/ic-etc.png";
        }

        return {
          ...file,
          thumbnail_image: thumbnailPath,
          main_features: JSON.parse(file.main_features || "[]"),
          download_count: file.total_download_count || file.download_count || 0,
        };
      }),
    });
  } catch (error) {
    console.error("파일 조회 에러:", error);
    res.status(500).send({
      error: "Failed to fetch files",
      details: error.message,
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { fileId, fileType } = req.params;

    const fileResult = await mysql.query("getFileById", { id: fileId });

    if (!fileResult || fileResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "파일을 찾을 수 없습니다.",
      });
    }

    const file = fileResult.recordset[0];
    let filePath;
    let fileName;

    if (fileType === "source") {
      if (!file.source_file_link) {
        return res.status(404).json({ success: false, message: "소스 파일이 존재하지 않습니다." });
      }
      const sourceLink = file.source_file_link.startsWith('/') ? file.source_file_link.substring(1) : file.source_file_link;
      filePath = path.join(__dirname, "..", sourceLink);
      // 파일명을 파일명_버전 형식으로 변경
      const originalFileName = path.basename(file.source_file_link);
      const fileExtension = path.extname(originalFileName);
      const fileNameWithoutExt = path.basename(originalFileName, fileExtension);
      fileName = `${file.file_name}_${file.version}${fileExtension}`;
    } else if (fileType === "fbx") {
      if (!file.fbx_file_link) {
        return res.status(404).json({ success: false, message: "FBX 파일이 존재하지 않습니다." });
      }
      const fbxLink = file.fbx_file_link.startsWith('/') ? file.fbx_file_link.substring(1) : file.fbx_file_link;
      filePath = path.join(__dirname, "..", fbxLink);
      const originalFileName = path.basename(file.fbx_file_link);
      const fileExtension = path.extname(originalFileName);
      fileName = `${file.file_name}_${file.version}${fileExtension}`;
    } else if (fileType === "icon") {
      if (!file.icon_file_link) {
        return res.status(404).json({ success: false, message: "아이콘 파일이 존재하지 않습니다." });
      }
      // leading slash 제거하여 path.join이 올바르게 동작하도록 함
      const iconLink = file.icon_file_link.startsWith('/') ? file.icon_file_link.substring(1) : file.icon_file_link;
      filePath = path.join(__dirname, "..", iconLink);
      
      const iconFileName = path.basename(iconLink);
      const fileExtension = path.extname(iconFileName);
      fileName = `${file.file_name}_${file.version}${fileExtension}`;

      console.log("아이콘 파일 다운로드 시도:", {
        fileId,
        fileName,
        filePath,
        iconLink: file.icon_file_link,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "잘못된 파일 타입입니다.",
      });
    }

    try {
      const normalizedPath = path.normalize(filePath);
      console.log("정규화된 경로:", normalizedPath);

      // 파일 존재 확인
      if (!fsSync.existsSync(normalizedPath)) {
        throw new Error(`파일을 찾을 수 없습니다: ${normalizedPath}`);
      }

      const stats = await fs.stat(normalizedPath);
      console.log("파일 정보:", {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mode: stats.mode,
        actualPath: normalizedPath,
      });

      // 실제 파일 경로로 업데이트
      filePath = normalizedPath;
    } catch (error) {
      console.error("파일 접근 오류:", {
        error: error.message,
        code: error.code,
        path: filePath,
        normalizedPath: path.normalize(filePath),
        currentDir: process.cwd(),
        dirExists: await fs
          .access(path.dirname(filePath))
          .then(() => true)
          .catch(() => false),
      });
      return res.status(404).json({
        success: false,
        message: "파일을 찾을 수 없습니다.",
      });
    }

    await mysql.query("incrementDownloadCount", { id: fileId });

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    const fileStream = fsSync.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("파일 다운로드 에러:", error);
    res.status(500).json({
      success: false,
      message: "파일 다운로드 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const getFileDetail = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileResult = await mysql.query("getFileDetail", { id: fileId });

    if (!fileResult || fileResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "파일을 찾을 수 없습니다.",
      });
    }

    const file = fileResult.recordset[0];

    // DB에 저장된 경로를 그대로 사용 (이미 마이그레이션 및 새 로직으로 경로가 잘 저장되어 있음)
    const iconPath = file.icon_file_link || null;
    const sourcePath = file.source_file_link || null;
    const fbxPath = file.fbx_file_link || null;
    const vcmxPath = file.vcmx_file_link || null;

    let thumbnailPath = file.thumbnail_image || null;

    // 만약 썸네일이 없으면 타입에 따른 기본 이미지 설정 (프론트엔드 public/images 로컬 에셋 사용)
    if (!thumbnailPath || 
        thumbnailPath === "/uploads/thumbnails/ic-vc.png" || 
        thumbnailPath === "/uploads/thumbnails/ic-ns.png" || 
        thumbnailPath === "/uploads/thumbnails/ic-etc.png") {
      if (file.type === "vc_plugin" || file.type === "vc_model") thumbnailPath = "/images/ic-vc.png";
      else if (file.type === "ns_plugin" || file.type === "ns_model") thumbnailPath = "/images/ic-ns.png";
      else thumbnailPath = "/images/ic-etc.png";
    }

    let mainFeatures = [];
    try {
      if (file.main_features) {
        if (
          file.main_features.startsWith("[") ||
          file.main_features.startsWith("{")
        ) {
          mainFeatures = JSON.parse(file.main_features);
        } else {
          mainFeatures = file.main_features
            .split(",")
            .map((item) => item.trim());
        }
      }
    } catch (error) {
      console.warn("main_features 파싱 실패:", file.main_features);
      mainFeatures = file.main_features ? [file.main_features] : [];
    }

    // component_id를 숫자로 변환
    const componentId = parseInt(file.component_id) || null;

    const relatedFilesResult = await mysql.query("getRelatedFiles", {
      component_id: componentId,
      file_id: parseInt(fileId),
    });

    const formattedRelatedFiles = relatedFilesResult.recordset.map(
      (relatedFile) => ({
        id: relatedFile.id,
        fileName: relatedFile.file_name,
        version: relatedFile.version,
        thumbnailImage: relatedFile.thumbnail_image 
          ? `/uploads/thumbnails/${path.basename(relatedFile.thumbnail_image)}`
          : "/images/thumbnail.png",
        downloadCount: relatedFile.download_count,
        createdAt: relatedFile.created_at,
        updatedAt: relatedFile.updated_at, // 업데이트 날짜 추가
        description: relatedFile.description,
        mainFeatures: relatedFile.main_features
          ? typeof relatedFile.main_features === "string"
            ? relatedFile.main_features.split(",").map((item) => item.trim())
            : relatedFile.main_features
          : [],
        recommendedEnvironment: relatedFile.recommended_environment,
        componentId: relatedFile.component_id,
        categoryName: relatedFile.category_name,
        fileLinks: {
          source: relatedFile.source_file_link ? `/uploads/source/${path.basename(relatedFile.source_file_link)}` : null,
          icon: relatedFile.icon_file_link || null,
          fbx: relatedFile.fbx_file_link ? `/uploads/fbx/${path.basename(relatedFile.fbx_file_link)}` : null,
          vcmx: relatedFile.vcmx_file_link || null,
        },
      })
    );

    const responseData = {
      id: file.id,
      fileName: file.file_name,
      version: file.version,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      downloadCount: file.download_count,
      thumbnailImage: thumbnailPath,
      description: file.description,
      mainFeatures: mainFeatures,
      recommendedEnvironment: file.recommended_environment,
      componentId: componentId,
      category: {
        id: file.category_id,
        name: file.category_name,
      },
      fileLinks: {
        source: sourcePath,
        icon: iconPath,
        fbx: fbxPath,
        vcmx: vcmxPath,
      },
      relatedFiles: formattedRelatedFiles,
      type: file.type,
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("파일 상세 정보 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "파일 상세 정보 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const updateComponentVersion = async (req, res) => {
  try {
    const componentId = Number(req.params.id);

    if (!componentId || isNaN(componentId) || componentId <= 0) {
      throw new Error(`유효하지 않은 component_id: ${componentId}`);
    }

    console.log("컴포넌트 ID 확인:", componentId);
    console.log("컴포넌트 ID 타입:", typeof componentId);

    const originalFileResult = await mysql.query("getLatestComponentVersion", {
      component_id: componentId,
    });

    console.log("componentId:", componentId);
    console.log(
      "원본 파일 조회 결과:",
      JSON.stringify(originalFileResult, null, 2)
    );

    if (
      !originalFileResult ||
      !originalFileResult.recordset ||
      originalFileResult.recordset.length === 0
    ) {
      console.log("원본 파일을 찾을 수 없음");
      return res.status(404).json({
        success: false,
        message: "원본 컴포넌트를 찾을 수 없습니다.",
      });
    }

    const originalFile = originalFileResult.recordset[0];
    console.log("원본 파일 데이터:", JSON.stringify(originalFile, null, 2));

    if (!originalFile) {
      console.log("원본 파일 데이터가 없음");
      return res.status(404).json({
        success: false,
        message: "원본 컴포넌트 데이터가 없습니다.",
      });
    }

    if (!originalFile.component_id) {
      console.log("원본 파일에 component_id가 없음");
      return res.status(404).json({
        success: false,
        message: "원본 컴포넌트 ID가 없습니다.",
      });
    }

    const userEmail = req.user.email;

    const {
      componentName,
      version,
      description,
      features,
      environment,
      useOriginalThumbnail,
    } = req.body;

    // 카테고리 정보는 더 이상 경로에 사용하지 않음 (null 처리 예정)
    const categoryName = "deleted"; 
    const subCategoryName = "deleted";

    // 아이콘 파일 처리 (선택사항)
    let iconUrl;
    if (req.body.useExistingIcon === "true" && req.body.existingIconPath) {
      // 기존 아이콘 파일 사용
      iconUrl = req.body.existingIconPath;
    } else if (req.files.iconFile && req.files.iconFile[0]) {
      // 새 아이콘 파일 업로드
      const iconFile = req.files.iconFile[0];
      const iconType = originalFile.type || "etc";
      const { relativeDir, absoluteDir } = getPathByCategory(iconType, iconFile.originalname || iconFile.filename, 'iconFile');

      try {
        await fs.mkdir(absoluteDir, { recursive: true });
        const srcPath = iconFile.path;
        const targetPath = path.join(absoluteDir, iconFile.filename);

        await fs.rename(srcPath, targetPath);
        iconUrl = `/${relativeDir}/${iconFile.filename}`.replace(/\\/g, "/");
      } catch (error) {
        console.error("Icon 파일 처리 실패:", error);
        throw new Error("Icon 파일 저장에 실패했습니다.");
      }
    } else {
      // 아이콘 파일이 없는 경우 기존 파일 사용 또는 null
      iconUrl = originalFile.icon_file_link || null;
    }

    // 소스 파일 처리
    let sourceUrl;
    let sourceFilePath; // 소스 파일 경로 저장용
    let isFbxFile = false;
    
    if (req.body.useExistingSource === "true" && req.body.existingSourcePath) {
      // 기존 소스 파일 사용
      sourceUrl = req.body.existingSourcePath;
    } else if (req.files.sourceFile && req.files.sourceFile[0]) {
      // 새 소스 파일 업로드
      const sourceFile = req.files.sourceFile[0];
      const sourceType = originalFile.type || "etc";
      const { relativeDir, absoluteDir } = getPathByCategory(sourceType, sourceFile.originalname || sourceFile.filename, 'sourceFile');
      
      await fs.mkdir(absoluteDir, { recursive: true });
      const srcPath = sourceFile.path;
      const targetPath = path.join(absoluteDir, sourceFile.filename);
      await fs.rename(srcPath, targetPath);

      sourceUrl = `/${relativeDir}/${sourceFile.filename}`.replace(/\\/g, "/");
      sourceFilePath = targetPath; // 서버 내 절대 경로 저장 (썸네일 생성용)

      const ext = path.extname(sourceFile.originalname || sourceFile.filename).toLowerCase();
      isFbxFile = ext === '.fbx';
    } else {
      // 기존에도 없고 새 파일도 없으면
      return res.status(400).json({
        success: false,
        message: "소스 파일이 필요합니다. (새 파일 업로드 또는 기존 파일 사용)",
      });
    }

    // FBX 파일 처리 (선택사항)
    let fbxUrl;
    if (req.body.useExistingFbx === "true" && req.body.existingFbxPath) {
      fbxUrl = req.body.existingFbxPath;
    } else if (req.files.fbxFile && req.files.fbxFile[0]) {
      const fbxFile = req.files.fbxFile[0];
      const fbxType = originalFile.type || "etc";
      const { relativeDir, absoluteDir } = getPathByCategory(fbxType, fbxFile.originalname || fbxFile.filename, 'fbxFile');

      await fs.mkdir(absoluteDir, { recursive: true });
      const srcPath = fbxFile.path;
      const targetPath = path.join(absoluteDir, fbxFile.filename);
      await fs.rename(srcPath, targetPath);

      fbxUrl = `/${relativeDir}/${fbxFile.filename}`.replace(/\\/g, "/");
      isFbxFile = true;
    } else {
      fbxUrl = originalFile.fbx_file_link || null;
    }

    // 썸네일 처리 로직 개선 (신규 등록과 동일한 방식)
    let thumbnailUrl;
    console.log("썸네일 처리 시작:", {
      hasThumbnailFile: !!(req.files.thumbnail && req.files.thumbnail[0]),
      hasSourceFile: !!sourceFilePath,
      useExistingSource: req.body.useExistingSource,
      originalThumbnail: originalFile.thumbnail_image,
    });

    if (req.files.thumbnail && req.files.thumbnail[0]) {
      // 새 썸네일 업로드 (최우선)
      console.log("새 썸네일 파일 사용");
      thumbnailUrl = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`.replace(/\\/g, "/");
    } else if (req.body.useExistingSource === "true") {
      // 기존 소스 파일 사용 시 기존 썸네일 사용
      console.log("기존 소스 사용 - 기존 썸네일 유지");
      thumbnailUrl = originalFile.thumbnail_image;
    } else if (sourceFilePath && isFbxFile) {
      // 새 파일이 FBX일 때만 썸네일 자동 생성
      try {
        console.log("새 FBX 파일로부터 썸네일 자동 생성 시작");

        const timestamp = Date.now();
        const thumbnailFilename = `thumbnail-${timestamp}.png`;
        const thumbnailPath = path.join(
          __dirname,
          "..",
          "uploads",
          "thumbnails",
          thumbnailFilename
        );

        // uploads/thumbnails 디렉토리 확인 및 생성
        const thumbnailDir = path.join(
          __dirname,
          "..",
          "uploads",
          "thumbnails"
        );
        await fs.mkdir(thumbnailDir, { recursive: true });

        const thumbnailGenerator = new FBXThumbnailGenerator();

        try {
          await thumbnailGenerator.generateThumbnailFromFBX(
            sourceFilePath,
            thumbnailPath
          );
          console.log("서버 3D 썸네일 생성 성공!");
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
        } catch (error) {
          console.log(
            "서버 썸네일 생성 실패, 기본 썸네일로 폴백:",
            error.message
          );
          await generateThumbnailFromFBX(sourceFilePath, thumbnailPath);
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
        }
      } catch (error) {
        console.error("썸네일 자동 생성 실패:", error);
        // 썸네일 생성 실패 시 기존 썸네일 사용
        thumbnailUrl = originalFile.thumbnail_image;
      }
    } else {
      // 그 외의 경우 기존 썸네일 사용
      console.log("기존 썸네일 사용");
      thumbnailUrl = originalFile.thumbnail_image;
    }

    console.log("최종 썸네일 URL:", thumbnailUrl);

    let featuresString;
    try {
      if (typeof features === "string") {
        featuresString = features.startsWith("[")
          ? features
          : JSON.stringify([features]);
      } else if (Array.isArray(features)) {
        featuresString = JSON.stringify(features);
      } else {
        featuresString = originalFile.main_features || "[]";
      }
    } catch (e) {
      console.error("Features parsing error:", e);
      featuresString = "[]";
    }

    const insertData = {
      file_name: componentName || originalFile.file_name,
      version: version,
      description: description || "",
      main_features: featuresString,
      recommended_environment: environment || "",
      thumbnail_image: thumbnailUrl,
      source_file_link: sourceUrl,
      icon_file_link: iconUrl,
      fbx_file_link: fbxUrl,
      category_id: null,
      sub_category_id: null,
      uploader: userEmail,
      component_id: originalFile.component_id || componentId, // 보장된 component_id 사용
      type: originalFile.type,
      vcmx_file_link: sourceUrl && sourceUrl.toLowerCase().endsWith('.vcmx') ? sourceUrl : null,
      created_at: originalFile.created_at, // 원본 파일의 등록일 유지
    };

    console.log("버전 업데이트 삽입 데이터:", {
      component_id: insertData.component_id,
      created_at: insertData.created_at,
      version: insertData.version
    });

    console.log("최종 component_id 확인:", {
      입력_ID: componentId,
      삽입할_ID: insertData.component_id,
    });

    // 만약 이름이 변경되었다면 해당 그룹의 모든 이름을 동기화
    if (componentName && componentName !== originalFile.file_name) {
      try {
        await mysql.query("updateComponentNameByGroupId", {
          component_id: insertData.component_id,
          file_name: componentName,
        });
        console.log(`컴포넌트 그룹(${insertData.component_id}) 이름 동기화 완료: ${componentName}`);
      } catch (syncError) {
        console.warn("이름 동기화 실패 (신규 행은 생성됨):", syncError);
      }
    }

    const result = await mysql.query("componentVersionCreate", insertData);
    const newId = result.recordset[0].id;
    const savedDataResult = await mysql.query("getFileById", { id: newId });
    const savedData = savedDataResult.recordset[0];

    console.log("새 버전 생성 결과:", result);

    if (!result || !result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        success: false,
        message: "새 버전 생성에 실패했습니다.",
      });
    }

    console.log("저장된 데이터:", savedData);
    console.log("savedData.vcmx_file_link:", savedData.vcmx_file_link);

    // 아이콘 파일 저장 확인 (아이콘 파일이 있는 경우에만)
    if (savedData.icon_file_link) {
      const savedIconPath = path.join(
        __dirname,
        "..",
        savedData.icon_file_link
      );
      try {
        await fs.access(savedIconPath);
        console.log("아이콘 파일이 성공적으로 저장됨:", savedIconPath);
      } catch (error) {
        console.error("아이콘 파일 저장 실패:", {
          error: error.message,
          path: savedIconPath,
          iconLink: savedData.icon_file_link,
        });
      }
    } else {
      console.log("아이콘 파일이 없습니다.");
    }

    // SSE 이벤트 전송 - 컴포넌트 업데이트 알림
    try {
      sendComponentUpdate({
        id: savedData.id,
        componentId: savedData.component_id,
        version: version,
        description: description,
        features: featuresString,
        environment: environment,
        urls: {
          thumbnail: thumbnailUrl,
          source: sourceUrl,
          icon: iconUrl,
        },
        action: "version_created",
        timestamp: new Date().toISOString(),
      });
    } catch (sseError) {
      console.warn("SSE 이벤트 전송 실패:", sseError);
    }

    res.status(201).json({
      success: true,
      message: "새 버전이 등록되었습니다.",
      data: {
        id: savedData.id,
        componentId: savedData.component_id,
        version: version,
        description: description,
        features: featuresString,
        environment: environment,
        urls: {
          thumbnail: thumbnailUrl,
          source: sourceUrl,
          icon: iconUrl,
        },
        // 최신 버전 정보 추가
        latestVersion: {
          id: savedData.id,
          version: version,
          description: description,
          thumbnailImage: thumbnailUrl,
          fileLinks: {
            source: sourceUrl,
            icon: iconUrl,
          },
        },
      },
    });
  } catch (error) {
    console.error("버전 업데이트 오류:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteComponents = async (req, res) => {
  try {
    const { ids } = req.body;

    // 입력값 검증
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "삭제할 파일 ID 목록이 필요합니다.",
      });
    }

    // ID 배열을 숫자로 변환하고 유효성 검사
    const fileIds = ids
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id) && id > 0);

    if (fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "유효한 파일 ID가 없습니다.",
      });
    }

    console.log("삭제 요청된 파일 ID들:", fileIds);

    // 1. 파일 ID들로 component_id 목록 조회
    const componentIdsResult = await mysql.query("getComponentIdsByFileIds", {
      ids: fileIds.join(","),
    });

    const componentIds = componentIdsResult.recordset
      .map((row) => row.component_id)
      .filter((id) => id !== null);

    console.log("관련 컴포넌트 ID들:", componentIds);

    // 2. 삭제 전 파일 경로들 수집 (실제 파일 삭제용)
    let filePaths = [];

    if (componentIds.length > 0) {
      // component_id가 있는 경우: 해당 컴포넌트의 모든 파일 경로 조회
      const filePathsResult = await mysql.query("getFilePathsByComponentIds", {
        component_ids: componentIds.join(","),
      });
      filePaths = filePathsResult.recordset;
    } else {
      // component_id가 없는 경우: 요청된 파일 ID들의 경로만 조회
      const filePathsResult = await mysql.query("getFilePathsByIds", {
        ids: fileIds.join(","),
      });
      filePaths = filePathsResult.recordset;
    }

    console.log("삭제할 파일 경로들:", filePaths);

    // 3. 데이터베이스에서 삭제
    if (componentIds.length > 0) {
      // components 테이블에서 삭제 (만약 별도 테이블이 있다면)
      try {
        await mysql.query("deleteComponents", {
          component_ids: componentIds.join(","),
        });
      } catch (error) {
        // components 테이블이 없을 수도 있으므로 에러 무시
        console.warn(
          "components 테이블 삭제 실패 (테이블이 없을 수 있음):",
          error.message
        );
      }

      // 해당 컴포넌트의 모든 파일을 완전 삭제
      await mysql.query("deleteFilesByComponentIds", {
        component_ids: componentIds.join(","),
      });
    } else {
      // component_id가 없는 파일들만 완전 삭제
      await mysql.query("deleteFiles", {
        ids: fileIds.join(","),
      });
    }

    // 4. 실제 파일 삭제
    const deletedFiles = [];
    const failedFiles = [];

    for (const fileInfo of filePaths) {
      const filesToDelete = [
        fileInfo.thumbnail_image,
        fileInfo.source_file_link,
        fileInfo.icon_file_link,
      ].filter((filePath) => filePath && filePath.trim() !== "");

      for (const filePath of filesToDelete) {
        try {
          const fullPath = path.join(__dirname, "..", filePath);

          // 파일 존재 여부 확인
          try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
            deletedFiles.push(filePath);
            console.log("파일 삭제 성공:", fullPath);
          } catch (accessError) {
            if (accessError.code === "ENOENT") {
              console.log("파일이 이미 존재하지 않음:", fullPath);
            } else {
              throw accessError;
            }
          }
        } catch (error) {
          console.error("파일 삭제 실패:", filePath, error.message);
          failedFiles.push({ filePath, error: error.message });
        }
      }
    }

    // 5. 빈 디렉토리 정리 (VCMX 파일의 경우)
    const vcmxFiles = filePaths
      .map((f) => f.vcmx_file_link)
      .filter((f) => f && f.includes("/vcmx/"));

    for (const vcmxFile of vcmxFiles) {
      try {
        const dirPath = path.dirname(path.join(__dirname, "..", vcmxFile));
        const dirContents = await fs.readdir(dirPath);

        if (dirContents.length === 0) {
          await fs.rmdir(dirPath);
          console.log("빈 디렉토리 삭제:", dirPath);
        }
      } catch (error) {
        console.warn("디렉토리 정리 실패:", error.message);
      }
    }

    const responseMessage =
      componentIds.length > 0
        ? `${componentIds.length}개의 컴포넌트와 관련 파일들이 삭제되었습니다.`
        : `${fileIds.length}개의 파일이 삭제되었습니다.`;

    // SSE 이벤트 전송 - 컴포넌트 삭제 알림
    try {
      if (componentIds.length > 0) {
        componentIds.forEach((componentId) => {
          sendComponentDelete(componentId);
        });
      }
    } catch (sseError) {
      console.warn("SSE 이벤트 전송 실패:", sseError);
    }

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        deletedFileIds: fileIds,
        deletedComponentIds: componentIds,
        deletedFilePaths: deletedFiles.length,
        failedFiles: failedFiles.length,
        details: {
          deletedFiles,
          failedFiles,
        },
      },
    });
  } catch (error) {
    console.error("컴포넌트 삭제 에러:", error);
    res.status(500).json({
      success: false,
      message: "컴포넌트 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// VCMX 파일 일괄 다운로드 함수
const downloadAllVcmxFiles = async (req, res) => {
  try {
    console.log("VCMX 파일 일괄 다운로드 시작");

    // DB에서 모든 VCMX 파일 정보 조회
    console.log("DB에서 VCMX 파일 목록 조회 중...");

    // 디버깅: 모든 파일 정보 먼저 확인
    console.log("\n=== 디버깅: 모든 파일 정보 ===");
    const allFilesResult = await mysql.query("getAllFilesDebug");
    console.log("전체 파일 수:", allFilesResult.recordset.length);
    allFilesResult.recordset.forEach((file, index) => {
      console.log(
        `${index + 1}. ID:${file.id}, 파일명:${file.file_name}, VCMX링크:${
          file.vcmx_file_link
        }, is_active:${file.is_active}`
      );
    });

    console.log("\n=== VCMX 파일만 필터링 ===");
    const filesResult = await mysql.query("getAllVcmxFiles");
    console.log("VCMX 파일 수:", filesResult.recordset.length);
    console.log("VCMX 파일 목록:", filesResult.recordset);

    if (!filesResult || filesResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "다운로드할 VCMX 파일이 없습니다.",
      });
    }

    const files = filesResult.recordset;
    console.log(`총 ${files.length}개의 VCMX 파일을 찾았습니다.`);

    let successCount = 0;
    let errorCount = 0;
    const fileList = [];

    // 각 파일 정보 수집
    for (const file of files) {
      try {
        // console.log(`\n=== 파일 처리 시작 ===`);
        // console.log(`파일 ID: ${file.id}`);
        // console.log(`파일명: ${file.file_name}`);
        // console.log(`VCMX 링크: ${file.vcmx_file_link}`);
        // console.log(`카테고리 ID: ${file.category_id}`);
        // console.log(`서브카테고리 ID: ${file.sub_category_id}`);
        // console.log(`타입: ${file.type}`);

        // 카테고리와 서브카테고리 정보 조회
        // 실제 파일 경로 구성
        const filePath = path.join(__dirname, "..", file.vcmx_file_link);

        // 파일 존재 확인
        try {
          if (fsSync.existsSync(filePath)) {
            // 파일 정보를 목록에 추가
            fileList.push({
              id: file.id,
              fileName: path.basename(filePath),
              originalName: file.file_name,
              category: "N/A",
              subCategory: "N/A",
              type: file.type,
              downloadUrl: `/api/components/download/${file.id}/vcmx`,
            });
            successCount++;
          } else {
            console.log(`파일을 찾을 수 없습니다: ${filePath}`);
            errorCount++;
          }
        } catch (fileError) {
          console.error(`파일 처리 오류 (ID: ${file.id}):`, fileError.message);
          errorCount++;
        }
      } catch (error) {
        console.error(`파일 처리 오류 (ID: ${file.id}):`, error.message);
        errorCount++;
      }
    }

    console.log(`처리 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);

    // 파일 목록을 JSON으로 반환
    res.json({
      success: true,
      message: `${successCount}개의 VCMX 파일을 찾았습니다.`,
      data: {
        files: fileList,
        totalCount: successCount,
        errorCount: errorCount,
      },
    });
  } catch (error) {
    console.error("VCMX 파일 일괄 다운로드 에러:", error);
    console.error("에러 스택:", error.stack);
    res.status(500).json({
      success: false,
      message: "VCMX 파일 일괄 다운로드 중 오류가 발생했습니다.",
      error: error.message,
      stack: error.stack,
    });
  }
};

// 모든 파일 정보 조회 (외부 API용)
const getAllFiles = async (req, res) => {
  try {
    console.log("모든 파일 정보 조회 요청");

    // 모든 파일 정보 조회
    const result = await mysql.query("getAllFiles", {});

    if (!result || !result.recordset) {
      return res.status(500).json({
        success: false,
        message: "파일 정보를 조회할 수 없습니다.",
      });
    }

    // 응답 데이터 가공
    const files = result.recordset.map((file) => {
      // main_features JSON 파싱
      let mainFeatures = [];
      try {
        if (file.main_features) {
          mainFeatures = JSON.parse(file.main_features);
        }
      } catch (error) {
        console.warn("main_features 파싱 실패:", file.main_features);
        mainFeatures = file.main_features ? [file.main_features] : [];
      }

      return {
        id: file.id,
        file_name: file.file_name,
        version: file.version,
        created_at: file.created_at,
        updated_at: file.updated_at,
        download_count: file.download_count,
        source_file_link: file.source_file_link,
        thumbnail_image: file.thumbnail_image,
        uploader: file.uploader,
        category_id: file.category_id,
        component_id: file.component_id,
        type: file.type,
        description: file.description,
        main_features: mainFeatures,
        recommended_environment: file.recommended_environment,
        icon_file_link: file.icon_file_link,
        sub_category_id: file.sub_category_id,
        is_active: file.is_active,
      };
    });

    console.log(`총 ${files.length}개의 파일 정보 조회 완료`);

    res.status(200).json({
      success: true,
      message: "모든 파일 정보 조회 성공",
      total_count: files.length,
      data: files,
    });
  } catch (error) {
    console.error("모든 파일 정보 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "파일 정보 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 모든 파일의 최신 버전 정보 조회 (외부 API용)
const getAllLatestFiles = async (req, res) => {
  try {
    console.log("모든 파일 최신 버전 정보 조회 요청");

    // 모든 파일 최신 버전 정보 조회
    const result = await mysql.query("getAllLatestFiles", {});

    if (!result || !result.recordset) {
      return res.status(500).json({
        success: false,
        message: "파일 정보를 조회할 수 없습니다.",
      });
    }

    // 응답 데이터 가공
    const files = result.recordset.map((file) => {
      // main_features JSON 파싱
      let mainFeatures = [];
      try {
        if (file.main_features) {
          mainFeatures = JSON.parse(file.main_features);
        }
      } catch (error) {
        console.warn("main_features 파싱 실패:", file.main_features);
        mainFeatures = file.main_features ? [file.main_features] : [];
      }

      return {
        id: file.id,
        file_name: file.file_name,
        version: file.version,
        created_at: file.created_at,
        updated_at: file.updated_at,
        download_count: file.download_count,
        source_file_link: file.source_file_link,
        thumbnail_image: file.thumbnail_image,
        uploader: file.uploader,
        category_id: file.category_id,
        component_id: file.component_id,
        type: file.type,
        description: file.description,
        main_features: mainFeatures,
        recommended_environment: file.recommended_environment,
        icon_file_link: file.icon_file_link,
        sub_category_id: file.sub_category_id,
        is_active: file.is_active,
      };
    });

    console.log(`총 ${files.length}개의 최신 버전 파일 정보 조회 완료`);

    res.status(200).json({
      success: true,
      message: "모든 파일 최신 버전 정보 조회 성공",
      total_count: files.length,
      data: files,
    });
  } catch (error) {
    console.error("모든 파일 최신 버전 정보 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "파일 정보 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 파일 일괄 이동 함수
const bulkMoveFiles = async (req, res) => {
  try {
    const { fileIds, categoryId, subCategoryId } = req.body;

    // 입력값 검증
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "이동할 파일 ID 목록이 필요합니다.",
      });
    }

    if (!categoryId || !subCategoryId) {
      return res.status(400).json({
        success: false,
        message: "목적지 카테고리와 서브카테고리가 필요합니다.",
      });
    }

    // 카테고리와 서브카테고리 정보 조회
    const categoryResult = await mysql.query("getCategoryById", {
      id: categoryId,
    });
    const subCategoryResult = await mysql.query("getSubCategoryById", {
      id: subCategoryId,
    });

    if (!categoryResult.recordset[0] || !subCategoryResult.recordset[0]) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 카테고리 또는 서브카테고리입니다.",
      });
    }

    const categoryName = categoryResult.recordset[0].name;
    const subCategoryName = subCategoryResult.recordset[0].name;

    console.log(
      `파일 일괄 이동 시작: ${fileIds.length}개 파일을 ${categoryName}/${subCategoryName}으로 이동`
    );

    let movedFiles = 0;
    let failedFiles = [];

    for (const fileId of fileIds) {
      try {
        // 파일 정보 조회
        const fileResult = await mysql.query("getFileById", { id: fileId });
        if (!fileResult.recordset[0]) {
          failedFiles.push({ fileId, error: "파일을 찾을 수 없습니다." });
          continue;
        }

        const file = fileResult.recordset[0];

        // 기존 카테고리 정보 조회
        const oldCategoryResult = await mysql.query("getCategoryById", {
          id: file.category_id,
        });
        const oldSubCategoryResult = await mysql.query("getSubCategoryById", {
          id: file.sub_category_id,
        });

        if (
          !oldCategoryResult.recordset[0] ||
          !oldSubCategoryResult.recordset[0]
        ) {
          failedFiles.push({
            fileId,
            error: "기존 카테고리 정보를 찾을 수 없습니다.",
          });
          continue;
        }

        const oldCategoryName = oldCategoryResult.recordset[0].name;
        const oldSubCategoryName = oldSubCategoryResult.recordset[0].name;

        // VCMX 파일 이동 (있는 경우)
        if (file.vcmx_file_link) {
          const typePath = file.type === "ns_plugin" ? "오브젝트" : "라이브러리";
          const filename = path.basename(file.vcmx_file_link);

          const oldBasePath = path.join(
            __dirname,
            "..",
            "uploads",
            "vcmx",
            typePath,
            oldCategoryName,
            oldSubCategoryName
          );
          const newBasePath = path.join(
            __dirname,
            "..",
            "uploads",
            "vcmx",
            typePath,
            categoryName,
            subCategoryName
          );

          const oldFilePath = path.join(oldBasePath, filename);
          const newFilePath = path.join(newBasePath, filename);

          // 새 디렉토리 생성
          await fs.mkdir(newBasePath, { recursive: true });

          // 파일 이동
          if (fsSync.existsSync(oldFilePath)) {
            await fs.rename(oldFilePath, newFilePath);
            console.log(`파일 이동 완료: ${oldFilePath} → ${newFilePath}`);
          }
        }

        // DB 업데이트
        await mysql.query("updateFileCategory", {
          file_id: fileId,
          category_id: categoryId,
          sub_category_id: subCategoryId,
          vcmx_file_link: file.vcmx_file_link
            ? `/uploads/vcmx/${
                file.type === "ns_plugin" ? "오브젝트" : "라이브러리"
              }/${categoryName}/${subCategoryName}/${path.basename(
                file.vcmx_file_link
              )}`
            : file.vcmx_file_link,
        });

        movedFiles++;
        console.log(`파일 ID ${fileId} 이동 완료`);
      } catch (fileError) {
        console.error(`파일 이동 실패 (ID: ${fileId}):`, fileError.message);
        failedFiles.push({ fileId, error: fileError.message });
      }
    }

    // SSE 이벤트 전송 - 파일 이동 알림
    try {
      // 이동된 파일들의 component_id 수집
      const movedFileResults = await Promise.all(
        fileIds.map((id) => mysql.query("getFileById", { id }))
      );

      const componentIds = movedFileResults
        .map((result) => result.recordset[0]?.component_id)
        .filter((id) => id !== null && id !== undefined);

      componentIds.forEach((componentId) => {
        sendComponentUpdate({
          componentId,
          action: "files_moved",
          timestamp: new Date().toISOString(),
        });
      });
    } catch (sseError) {
      console.warn("SSE 이벤트 전송 실패:", sseError);
    }

    res.status(200).json({
      success: true,
      message: `${movedFiles}개 파일이 성공적으로 이동되었습니다.`,
      data: {
        movedFiles,
        failedFiles,
        totalRequested: fileIds.length,
      },
    });
  } catch (error) {
    console.error("파일 일괄 이동 에러:", error);
    res.status(500).json({
      success: false,
      message: "파일 이동 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

module.exports = {
  createComponent: exports.createComponent,
  getFiles,
  downloadFile,
  getFileDetail,
  updateComponentVersion,
  deleteComponents,
  downloadAllVcmxFiles, // vc에서 접근 파일 다운 - 추가
  getAllFiles, // vc에서 접근 - 새로 추가
  getAllLatestFiles, // vc에서 접근 - 최신 버전만
  bulkMoveFiles, // 파일 일괄 이동 - 새로 추가
};