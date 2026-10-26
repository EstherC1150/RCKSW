const path = require('path');
const fs = require('fs');
const { pool } = require('../mysql');

const BACK_DIR = path.resolve(__dirname, '..');

async function migrate() {
  console.log('=== 서버 레거시 파일 및 DB 경로 자동 마이그레이션 시작 ===');

  try {
    await pool.connect();

    // 1. 디렉토리 매핑 정의
    const dirMappings = [
      {
        fromDir: path.join(BACK_DIR, 'uploads/source/vc_plugin/etc'),
        toDir: path.join(BACK_DIR, 'uploads/source/vc_plugin/install'),
        fromPattern: '/uploads/source/vc_plugin/etc/',
        toPattern: '/uploads/source/vc_plugin/install/',
      },
      {
        fromDir: path.join(BACK_DIR, 'uploads/source/vc_plugin/icon'),
        toDir: path.join(BACK_DIR, 'uploads/source/vc_plugin/install'),
        fromPattern: '/uploads/source/vc_plugin/icon/',
        toPattern: '/uploads/source/vc_plugin/install/',
      },
      {
        fromDir: path.join(BACK_DIR, 'uploads/source/vc_plugin/vcmx'),
        toDir: path.join(BACK_DIR, 'uploads/source/vc_plugin/install'),
        fromPattern: '/uploads/source/vc_plugin/vcmx/',
        toPattern: '/uploads/source/vc_plugin/install/',
      },
      {
        fromDir: path.join(BACK_DIR, 'uploads/source/ns_plugin/etc'),
        toDir: path.join(BACK_DIR, 'uploads/source/ns_plugin/install'),
        fromPattern: '/uploads/source/ns_plugin/etc/',
        toPattern: '/uploads/source/ns_plugin/install/',
      },
      {
        fromDir: path.join(BACK_DIR, 'uploads/source/ns_model/etc'),
        toDir: path.join(BACK_DIR, 'uploads/source/ns_model/model'),
        fromPattern: '/uploads/source/ns_model/etc/',
        toPattern: '/uploads/source/ns_model/model/',
      },
      {
        fromDir: path.join(BACK_DIR, 'uploads/source/etc/etc'),
        toDir: path.join(BACK_DIR, 'uploads/source/etc/file'),
        fromPattern: '/uploads/source/etc/etc/',
        toPattern: '/uploads/source/etc/file/',
      },
    ];

    let totalPhysicalMoved = 0;

    // 2. 물리 파일 이동 및 빈 디렉토리 정리
    for (const mapping of dirMappings) {
      if (fs.existsSync(mapping.fromDir)) {
        if (!fs.existsSync(mapping.toDir)) {
          fs.mkdirSync(mapping.toDir, { recursive: true });
        }
        const files = fs.readdirSync(mapping.fromDir);
        for (const file of files) {
          const src = path.join(mapping.fromDir, file);
          const dest = path.join(mapping.toDir, file);
          fs.renameSync(src, dest);
          console.log(`[물리 파일 이동] ${file} -> ${path.relative(BACK_DIR, mapping.toDir)}`);
          totalPhysicalMoved++;
        }
        try {
          fs.rmdirSync(mapping.fromDir);
          console.log(`[빈 폴더 삭제] ${path.relative(BACK_DIR, mapping.fromDir)}`);
        } catch (rmErr) {
          console.warn(`[참고] 폴더 삭제 건너뜀: ${rmErr.message}`);
        }
      }
    }
    console.log(`물리 파일 이동 완료 (총 ${totalPhysicalMoved}개)`);

    // 3. DB 경로 업데이트
    console.log('\n--- DB files 테이블 file_path 경로 일괄 보정 ---');
    for (const mapping of dirMappings) {
      const q = `
        UPDATE files 
        SET file_path = REPLACE(file_path, '${mapping.fromPattern}', '${mapping.toPattern}') 
        WHERE file_path LIKE '%${mapping.fromPattern}%'
      `;
      const res = await pool.request().query(q);
      if (res.rowsAffected[0] > 0) {
        console.log(`[DB 업데이트] ${mapping.fromPattern} -> ${mapping.toPattern} (${res.rowsAffected[0]}건 수정됨)`);
      }
    }

    // 4. 추가 파일(component_additional_files) 폴더 이동 및 DB 보정 (구 uploads/additional/에 있던 파일)
    const oldAdditionalDir = path.join(BACK_DIR, 'uploads/additional');
    if (fs.existsSync(oldAdditionalDir)) {
      console.log('\n--- 구버전 uploads/additional 파일 분류 이동 ---');
      const addFiles = await pool.request().query(`
        SELECT a.id, a.file_path, f.type 
        FROM component_additional_files a
        INNER JOIN files f ON a.file_id = f.id
        WHERE a.file_path LIKE '%/uploads/additional/%'
      `);

      for (const row of addFiles.recordset) {
        const cat = row.type || 'etc';
        const targetDir = path.join(BACK_DIR, `uploads/source/${cat}/additional`);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const fileName = path.basename(row.file_path);
        const srcPath = path.join(oldAdditionalDir, fileName);
        const destPath = path.join(targetDir, fileName);

        if (fs.existsSync(srcPath)) {
          fs.renameSync(srcPath, destPath);
          const newDbPath = `/uploads/source/${cat}/additional/${fileName}`;
          await pool.request().query(`
            UPDATE component_additional_files
            SET file_path = '${newDbPath}'
            WHERE id = ${row.id}
          `);
          console.log(`[추가파일 이동] ${fileName} -> uploads/source/${cat}/additional`);
        }
      }

      try {
        const remaining = fs.readdirSync(oldAdditionalDir);
        if (remaining.length === 0) {
          fs.rmdirSync(oldAdditionalDir);
          console.log('[구버전 빈 uploads/additional 폴더 삭제 완료]');
        }
      } catch (e) {}
    }

    console.log('\n=== 마이그레이션이 성공적으로 완료되었습니다! ===');
    process.exit(0);
  } catch (error) {
    console.error('마이그레이션 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

migrate();
