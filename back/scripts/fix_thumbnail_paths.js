const mysql = require('../mysql');
async function fixPaths() {
  try {
    await mysql.pool.connect();
    // 1. 기본 썸네일 경로를 프론트엔드 로컬 경로(/images/)로 변경
    const res1 = await mysql.pool.request().query(`
      UPDATE files 
      SET thumbnail_image = REPLACE(thumbnail_image, '/uploads/thumbnails/', '/images/')
      WHERE thumbnail_image LIKE '/uploads/thumbnails/ic-%'
    `);
    console.log(`기본 아이콘 경로 업데이트 완료: ${res1.rowsAffected[0]}건`);

    // 2. 혹시 마이그레이션 도중 fbx_file_link 등에 잘못된 주소가 들어간 경우 (선택사항 - 현재는 getFileDetail에서 직접 DB값을 쓰므로 안전함)
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
fixPaths();
