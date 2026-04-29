/**
 * migrate_to_nested_structure.js
 * 
 * 1. 기존 uploads 폴더 내의 파일들을 uploads/source/[타입]/[종류]/ 구조로 이동시킵니다.
 * 2. DB의 files 테이블에 저장된 경로 정보를 새 구조에 맞게 업데이트합니다.
 */

const mysql = require("../mysql");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

async function migrate() {
  try {
    console.log("=== 파일 구조 고도화 마이그레이션 시작 ===");
    await mysql.pool.connect();

    // 1. 모든 파일 레코드 조회
    const res = await mysql.pool.request().query(
      "SELECT id, type, source_file_link, icon_file_link, fbx_file_link, vcmx_file_link, thumbnail_image FROM files"
    );
    const files = res.recordset;
    console.log(`총 ${files.length}개의 레코드를 확인했습니다.`);

    const getCategory = (filePath) => {
      if (!filePath) return null;
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.dll') return 'dll';
      if (ext === '.vcmx' || ext === '.vcl') return 'vcmx';
      if (ext === '.fbx') return 'fbx';
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) return 'icon';
      return 'etc';
    };

    const uploadsDir = path.join(__dirname, "..", "uploads");

    for (const record of files) {
      console.log(`\n[ID: ${record.id}] 처리 중...`);
      const type = record.type || 'etc';
      const updates = {};

      // 처리할 컬럼 목록
      const columns = ['source_file_link', 'icon_file_link', 'fbx_file_link', 'vcmx_file_link'];

      for (const col of columns) {
        const oldLink = record[col];
        if (!oldLink || oldLink.trim() === "") continue;

        // 이미 새 구조(/uploads/source/...)인 경우 건너뜀 (단, icon이나 fbx에 있는 경우만 처리)
        if (oldLink.startsWith('/uploads/source/') && !oldLink.includes('/icon/') && !oldLink.includes('/fbx/')) {
           // 이미 source 밑에 있고, 하위 폴더에 icon/fbx가 없는 경우 (이미 처리된 것으로 간주)
           // 하지만 이번 기회에 확실히 nested 구조로 바꾸고 싶다면 더 세밀한 체크 가능
        }

        const category = getCategory(oldLink);
        const filename = path.basename(oldLink);
        const newLink = `/uploads/source/${type}/${category}/${filename}`.replace(/\\/g, "/");

        if (oldLink === newLink) continue;

        const oldFullPath = path.join(__dirname, "..", oldLink.startsWith('/') ? oldLink.substring(1) : oldLink);
        const newRelativePath = newLink.startsWith('/') ? newLink.substring(1) : newLink;
        const newFullPath = path.join(__dirname, "..", newRelativePath);

        // 물리적 파일 이동
        if (fsSync.existsSync(oldFullPath)) {
          await fs.mkdir(path.dirname(newFullPath), { recursive: true });
          
          // 파일 이동 (이미 존재하면 덮어쓰거나 건너뛰기 - 여기서는 안전하게 덮어쓰기)
          try {
            await fs.rename(oldFullPath, newFullPath);
            console.log(`  파일 이동: ${path.basename(oldFullPath)} -> source/${type}/${category}/`);
          } catch (mvErr) {
            // rename 실패 시 (다른 파티션 등) copy + unlink 시도
            await fs.copyFile(oldFullPath, newFullPath);
            await fs.unlink(oldFullPath);
            console.log(`  파일 복사/삭제 이동: ${path.basename(oldFullPath)}`);
          }
          updates[col] = newLink;
        } else {
          console.warn(`  경고: 물리적 파일을 찾을 수 없음 (${oldFullPath})`);
          // 파일이 없더라도 DB 경로만이라도 업데이트하고 싶다면 아래 주석 해제
          // updates[col] = newLink;
        }
      }

      // DB 업데이트
      if (Object.keys(updates).length > 0) {
        let setClause = Object.keys(updates).map(col => `${col} = '${updates[col]}'`).join(", ");
        await mysql.pool.request().query(`UPDATE files SET ${setClause} WHERE id = ${record.id}`);
        console.log(`  DB 업데이트 완료: ${Object.keys(updates).join(", ")}`);
      } else {
        console.log(`  변경 사항 없음.`);
      }
    }

    console.log("\n=== 마이그레이션 완료 ===");
    process.exit(0);
  } catch (err) {
    console.error("\n마이그레이션 중 치명적 에러 발생:", err);
    process.exit(1);
  }
}

migrate();
