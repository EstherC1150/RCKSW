const mysql = require('../mysql');
const fs = require('fs');
const path = require('path');

async function repairLinks() {
  try {
    await mysql.pool.connect();
    console.log("=== DB 링크 정밀 복구 시작 ===");

    const uploadsSourceDir = path.join(__dirname, '..', 'uploads', 'source');
    
    // 모든 파일을 재귀적으로 탐색하는 함수
    const getAllFiles = (dirPath, arrayOfFiles) => {
      const files = fs.readdirSync(dirPath);
      arrayOfFiles = arrayOfFiles || [];
      files.forEach(file => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
          arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
          arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      });
      return arrayOfFiles;
    };

    if (!fs.existsSync(uploadsSourceDir)) {
      console.log("uploads/source 폴더가 없습니다.");
      process.exit(0);
    }

    const allPhysicalFiles = getAllFiles(uploadsSourceDir);
    console.log(`총 ${allPhysicalFiles.length}개의 물리적 파일을 찾았습니다.`);

    for (const fullPath of allPhysicalFiles) {
      const filename = path.basename(fullPath);
      const relativePath = '/' + path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
      
      // 해당 파일명을 포함하고 있지만 경로가 다른 레코드를 찾아 업데이트
      // (기존 /uploads/fbx/..., /uploads/icon/..., /uploads/source/... 대비)
      
      // 1. source_file_link 업데이트
      const res1 = await mysql.pool.request().query(`
        UPDATE files SET source_file_link = '${relativePath}' 
        WHERE source_file_link LIKE '%/${filename}' AND source_file_link != '${relativePath}'
      `);
      if (res1.rowsAffected[0] > 0) console.log(`[Source] ${filename} 링크 복구: ${res1.rowsAffected[0]}건`);

      // 2. fbx_file_link 업데이트
      const res2 = await mysql.pool.request().query(`
        UPDATE files SET fbx_file_link = '${relativePath}' 
        WHERE fbx_file_link LIKE '%/${filename}' AND fbx_file_link != '${relativePath}'
      `);
      if (res2.rowsAffected[0] > 0) console.log(`[FBX] ${filename} 링크 복구: ${res2.rowsAffected[0]}건`);

      // 3. icon_file_link 업데이트
      const res3 = await mysql.pool.request().query(`
        UPDATE files SET icon_file_link = '${relativePath}' 
        WHERE icon_file_link LIKE '%/${filename}' AND icon_file_link != '${relativePath}'
      `);
      if (res3.rowsAffected[0] > 0) console.log(`[Icon] ${filename} 링크 복구: ${res3.rowsAffected[0]}건`);
    }

    console.log("=== DB 링크 정밀 복구 완료 ===");
    process.exit(0);
  } catch(e) {
    console.error("복구 중 에러:", e);
    process.exit(1);
  }
}
repairLinks();
