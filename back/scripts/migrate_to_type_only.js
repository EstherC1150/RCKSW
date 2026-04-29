const mysql = require("../mysql");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

async function migrate() {
  console.log("=== 데이터 및 저장소 마이그레이션 시작 ===");

  try {
    // 1. 모든 파일 정보 조회
    const result = await mysql.query("getAllFiles", {});
    const files = result.recordset;
    console.log(`총 ${files.length}개의 파일을 처리합니다.`);

    for (const file of files) {
      console.log(`\n--- 처리 중: ID ${file.id} (${file.file_name}) ---`);
      
      const type = file.type || "etc";
      const updates = {
        id: file.id,
        category_id: null,
        sub_category_id: null,
        source_file_link: file.source_file_link,
        icon_file_link: file.icon_file_link,
        fbx_file_link: file.fbx_file_link,
        vcmx_file_link: file.vcmx_file_link
      };

      // 파일 이동 및 경로 업데이트 함수
      const moveFile = async (oldRelativePath, subFolder) => {
        if (!oldRelativePath || oldRelativePath.trim() === "" || oldRelativePath.includes("null")) return oldRelativePath;
        
        const filename = path.basename(oldRelativePath);
        const newRelativePath = `/uploads/${subFolder}/${type}/${filename}`.replace(/\\/g, "/");
        
        // 경로가 이미 올바른 형식이면 이동 생략
        if (oldRelativePath === newRelativePath) return oldRelativePath;

        const oldFullPath = path.join(__dirname, "..", oldRelativePath);
        const newDir = path.join(__dirname, "..", "uploads", subFolder, type);
        const newFullPath = path.join(newDir, filename);

        try {
          if (fsSync.existsSync(oldFullPath)) {
            await fs.mkdir(newDir, { recursive: true });
            await fs.rename(oldFullPath, newFullPath);
            console.log(`  [이동 성공] ${subFolder}: ${oldRelativePath} -> ${newRelativePath}`);
            return newRelativePath;
          } else {
            console.warn(`  [파일 없음] ${subFolder}: ${oldFullPath}`);
            return oldRelativePath; // 파일이 없으면 기존 경로 유지 (DB만 업데이트 방지용)
          }
        } catch (err) {
          console.error(`  [이동 실패] ${subFolder}: ${err.message}`);
          return oldRelativePath;
        }
      };

      // 각 파일 타입별 이동 실행
      updates.source_file_link = await moveFile(file.source_file_link, "source");
      updates.icon_file_link = await moveFile(file.icon_file_link, "icon");
      updates.fbx_file_link = await moveFile(file.fbx_file_link, "fbx");
      updates.vcmx_file_link = await moveFile(file.vcmx_file_link, "vcmx");

      // DB 업데이트
      // 주의: sql.js에 updateFilePathsAndNullCategories 쿼리를 추가해야 함
      await mysql.query("updateFilePathsAndNullCategories", updates);
      console.log(`  [DB 업데이트 완료] ID ${file.id}`);
    }

    console.log("\n=== 마이그레이션 완료 ===");
    process.exit(0);
  } catch (error) {
    console.error("마이그레이션 중 치명적 에러:", error);
    process.exit(1);
  }
}

migrate();
