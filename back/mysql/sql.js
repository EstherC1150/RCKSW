module.exports = {
  // 사용자 목록을 검색하고 정렬하여 페이지네이션된 결과를 반환
  // @search: 검색어
  // @type: 검색 유형 (username, email, department, all)
  // @sortBy: 정렬 기준 (id, log)
  // @offset: 페이지네이션 시작 위치
  // @limit: 페이지당 표시할 항목 수
  userList: `
    SELECT 
      id, email, username, department, position, phone_number, role, is_approved, log
    FROM users
    WHERE 
      @search = '' OR 
      (
        (@type = 'username' AND LOWER(username) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%') OR
        (@type = 'email' AND LOWER(email) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%') OR
        (@type = 'department' AND LOWER(department) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%') OR
        (@type = 'all' AND (
          LOWER(username) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%' OR
          LOWER(email) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%' OR
          LOWER(department) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%'
        ))
      )
    ORDER BY 
      CASE @sortBy
        WHEN 'id' THEN id
        WHEN 'log' THEN log
        ELSE id
      END DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `,

  // 검색 조건에 맞는 전체 사용자 수를 반환
  // @search: 검색어
  // @type: 검색 유형 (username, email, department, all)
  userTotal: `
    SELECT COUNT(*) as total 
    FROM users
    WHERE 
      @search = '' OR 
      (
        (@type = 'username' AND LOWER(username) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%') OR
        (@type = 'email' AND LOWER(email) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%') OR
        (@type = 'department' AND LOWER(department) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%') OR
        (@type = 'all' AND (
          LOWER(username) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%' OR
          LOWER(email) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%' OR
          LOWER(department) LIKE '%' + LOWER(LTRIM(RTRIM(@search))) + '%'
        ))
      )
  `,

  // 사용자 정보 업데이트
  // @id: 사용자 ID
  // @username: 사용자 이름
  // @department: 부서
  // @position: 직책
  // @phone_number: 전화번호
  // @is_approved: 승인 여부
  // @role: 사용자 역할
  updateUser: `
    UPDATE users 
    SET 
      username = @username,
      department = @department,
      position = @position,
      phone_number = @phone_number,
      is_approved = @is_approved,
      role = @role
    WHERE id = @id
  `,

  // ID로 사용자 정보 조회
  // @id: 사용자 ID
  getUserById: `
    SELECT id, email, username, department, position, phone_number, role, is_approved 
    FROM users 
    WHERE id = @id
  `,

  // 여러 사용자 삭제
  // @ids: 삭제할 사용자 ID 목록
  deleteUsers: `
    DELETE FROM users 
    WHERE id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@ids, ','))
  `,

  // 모든 카테고리 목록 조회
  categoriesList: `SELECT * FROM categories`,

  // 특정 타입의 파일이 있는 카테고리만 조회
  // @type: 파일 타입 (library 또는 object)
  getCategoriesByType: `
    SELECT DISTINCT c.id, c.name
    FROM categories c
    INNER JOIN files f ON c.id = f.category_id
    WHERE f.type = @type AND f.is_active = 1
    ORDER BY c.name ASC
  `,

  // 카테고리 ID로 카테고리 정보 조회
  getCategoryById: `
    SELECT 
      id,
      name
    FROM categories
    WHERE id = @id
  `,

  // 서브카테고리 ID로 서브카테고리 정보 조회
  getSubCategoryById: `
    SELECT 
      id,
      name,
      main_category_id as category_id
    FROM sub_categories
    WHERE id = @id
  `,

  // 카테고리 ID로 서브 카테고리 목록 조회
  getSubCategories: `
    SELECT 
      id,
      name,
      main_category_id as category_id
    FROM sub_categories
    WHERE main_category_id = @category_id
    ORDER BY id ASC
  `,

  // 특정 타입의 파일이 있는 서브카테고리만 조회
  // @category_id: 메인 카테고리 ID
  // @type: 파일 타입 (library 또는 object)
  getSubCategoriesByType: `
    SELECT DISTINCT sc.id, sc.name, sc.main_category_id as category_id
    FROM sub_categories sc
    INNER JOIN files f ON sc.id = f.sub_category_id
    WHERE sc.main_category_id = @category_id AND f.type = @type AND f.is_active = 1
    ORDER BY sc.name ASC
  `,

  // 새로운 카테고리 생성
  // @name: 카테고리 이름
  categoryCreate: `
    INSERT INTO categories (name) 
    OUTPUT INSERTED.id, INSERTED.name
    VALUES (@name)
  `,

  // 카테고리 정보 업데이트
  // @id: 카테고리 ID
  // @name: 새로운 카테고리 이름
  categoryUpdate: `
    UPDATE categories 
    SET name = @name
    WHERE id = @id
  `,

  // 카테고리 삭제
  // @id: 삭제할 카테고리 ID
  categoryDelete: `
    DELETE FROM categories 
    WHERE id = @id
  `,

  // 카테고리 ID로 카테고리 정보 조회 (수정용)
  // @id: 카테고리 ID
  categoryGetById: `
    SELECT 
      id,
      name
    FROM categories
    WHERE id = @id
  `,

  // 카테고리 ID로 파일 목록 조회
  // @category_id: 카테고리 ID
  getFilesByCategoryId: `
    SELECT 
      id,
      file_name,
      vcmx_file_link,
      category_id,
      sub_category_id,
      type
    FROM files 
    WHERE category_id = @category_id 
    AND is_active = 1
  `,

  // 서브카테고리 ID로 파일 목록 조회
  // @sub_category_id: 서브카테고리 ID
  getFilesBySubCategoryId: `
    SELECT 
      id,
      file_name,
      vcmx_file_link,
      source_file_link,
      category_id,
      sub_category_id,
      type
    FROM files 
    WHERE sub_category_id = @sub_category_id 
    AND is_active = 1
  `,

  // 서브카테고리 생성
  // @name: 서브카테고리 이름
  // @main_category_id: 메인 카테고리 ID
  subCategoryCreate: `
    INSERT INTO sub_categories (name, main_category_id) 
    OUTPUT INSERTED.id, INSERTED.name, INSERTED.main_category_id
    VALUES (@name, @main_category_id)
  `,

  // 서브카테고리 수정
  // @id: 서브카테고리 ID
  // @name: 새로운 서브카테고리 이름
  subCategoryUpdate: `
    UPDATE sub_categories 
    SET name = @name
    WHERE id = @id
  `,

  // 서브카테고리 삭제
  // @id: 삭제할 서브카테고리 ID
  subCategoryDelete: `
    DELETE FROM sub_categories 
    WHERE id = @id
  `,

  // 파일의 VCMX 링크 업데이트
  // @file_id: 파일 ID
  // @vcmx_file_link: 새로운 VCMX 파일 링크
  updateFileVcmxLink: `
    UPDATE files 
    SET vcmx_file_link = @vcmx_file_link
    WHERE id = @file_id
  `,

  updateFileCategory: `
    UPDATE files 
    SET category_id = @category_id, 
        sub_category_id = @sub_category_id,
        vcmx_file_link = @vcmx_file_link
    WHERE id = @file_id
  `,

  updateMyProfile: `
    UPDATE users 
    SET 
      username = @username,
      department = @department,
      position = @position,
      phone_number = @phone_number
    WHERE id = @id
  `,

  updateUserPassword: `
    UPDATE users
    SET pwd = @pwd
    WHERE id = @id
  `,

  // 사용자 로그인
  // @email: 사용자 이메일
  userLogin: `
    SELECT id, email, pwd, username, role 
    FROM users 
    WHERE email = @email
  `,

  // 새로운 사용자 등록
  // @email: 이메일
  // @pwd: 비밀번호
  // @username: 사용자 이름
  // @department: 부서
  // @position: 직책
  // @phone_number: 전화번호
  // @role: 사용자 역할
  userSignup: `
    INSERT INTO users (
      email,
      pwd,
      username,
      department,
      position,
      phone_number,
      role
    ) VALUES (
      @email,
      @pwd,
      @username,
      @department,
      @position,
      @phone_number,
      @role
    )
  `,

  // 사용자 마지막 로그인 시간 업데이트
  // @id: 사용자 ID
  updateUserLastLogin: `
    UPDATE users 
    SET log = GETDATE()
    WHERE id = @id
  `,

  // 새로운 컴포넌트 생성
  // @file_name: 파일 이름
  // @version: 버전
  // @description: 설명
  // @main_features: 주요 기능
  // @recommended_environment: 권장 환경
  // @thumbnail_image: 썸네일 이미지 경로
  // @source_file_link: 소스 파일 링크
  // @icon_file_link: 아이콘 파일 링크
  // @category_id: 카테고리 ID
  // @sub_category_id: 서브 카테고리 ID
  // @uploader: 업로더 ID
  // @type: 컴포넌트 타입
  // @component_id: 컴포넌트 ID
  componentCreate: `
    DECLARE @new_component_id INT;
    INSERT INTO components DEFAULT VALUES;
    SET @new_component_id = SCOPE_IDENTITY();
    
    DECLARE @InsertedFiles TABLE (id INT);

    INSERT INTO files (
      file_name, version, description, main_features, recommended_environment,
      thumbnail_image, source_file_link, icon_file_link, fbx_file_link, vcmx_file_link,
      category_id, sub_category_id, uploader, type, model_type, component_id,
      created_at, updated_at
    )
    OUTPUT INSERTED.id INTO @InsertedFiles
    VALUES (
      @file_name, @version, @description, @main_features, @recommended_environment,
      @thumbnail_image, @source_file_link, @icon_file_link, @fbx_file_link, @vcmx_file_link,
      @category_id, @sub_category_id, @uploader, @type, @model_type, @new_component_id,
      GETDATE(), GETDATE()
    );

    SELECT id FROM @InsertedFiles;
  `,

  // 파일 목록을 검색하고 정렬하여 페이지네이션된 결과를 반환
  // @category_id: 카테고리 ID (0인 경우 모든 카테고리)
  // @sub_category_id: 서브 카테고리 ID (0인 경우 모든 서브 카테고리)
  // @search: 검색어
  // @type: 파일 타입
  // @sortBy: 정렬 기준 (name, downloads, latest)
  // @offset: 페이지네이션 시작 위치
  // @limit: 페이지당 표시할 항목 수
  fileList: `
    WITH ComponentStats AS (
      SELECT 
        component_id,
        MIN(created_at) as registration_date,
        MAX(ISNULL(updated_at, created_at)) as max_updated_at,
        SUM(download_count) as total_download_count
      FROM files
      WHERE is_active = 1
      GROUP BY component_id
    ),
    RankedFiles AS (
      SELECT 
        f.*,
        ISNULL(f.updated_at, f.created_at) as effective_updated_at,
        c.name as category_name,
        sc.name as sub_category_name,
        ROW_NUMBER() OVER (
          PARTITION BY f.component_id 
          ORDER BY f.created_at DESC, f.id DESC
        ) as rn
      FROM files f
      LEFT JOIN categories c ON f.category_id = c.id
      LEFT JOIN sub_categories sc ON f.sub_category_id = sc.id
      WHERE 
        (@category_id = 0 OR f.category_id = @category_id OR sc.main_category_id = @category_id) AND
        (@sub_category_id = 0 OR f.sub_category_id = @sub_category_id) AND
        (@search = '' OR f.file_name LIKE '%' + @search + '%') AND
        (@type = '' OR f.type = @type) AND
        (@model_type = '' OR f.model_type = @model_type) AND
        f.is_active = 1
    )
    SELECT
      rf.*,
      cs.registration_date,
      cs.total_download_count
    FROM RankedFiles rf
    LEFT JOIN ComponentStats cs ON rf.component_id = cs.component_id
    WHERE rf.rn = 1
    ORDER BY
      CASE WHEN @sortBy = 'name' THEN rf.file_name END ASC,
      CASE WHEN @sortBy = 'downloads' THEN ISNULL(cs.total_download_count, 0) END DESC,
      CASE WHEN @sortBy = 'latest' THEN cs.max_updated_at END DESC,
      CASE WHEN @sortBy NOT IN ('name', 'downloads', 'latest') THEN cs.max_updated_at END DESC,
      rf.id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `,

  // 검색 조건에 맞는 전체 파일 수를 반환
  // @category_id: 카테고리 ID (0인 경우 모든 카테고리)
  // @sub_category_id: 서브 카테고리 ID (0인 경우 모든 서브 카테고리)
  // @search: 검색어
  // @type: 파일 타입
  fileTotal: `
    WITH RankedFiles AS (
      SELECT 
        f.*,
        ROW_NUMBER() OVER (
          PARTITION BY f.component_id 
          ORDER BY f.created_at DESC, f.id DESC
        ) as rn
      FROM files f
      LEFT JOIN sub_categories sc ON f.sub_category_id = sc.id
      WHERE 
        (@category_id = 0 OR f.category_id = @category_id OR sc.main_category_id = @category_id) AND
        (@sub_category_id = 0 OR f.sub_category_id = @sub_category_id) AND
        (@search = '' OR f.file_name LIKE '%' + @search + '%') AND
        (@type = '' OR f.type = @type) AND
        (@model_type = '' OR f.model_type = @model_type) AND
        f.is_active = 1
    )
    SELECT COUNT(*) as total FROM RankedFiles WHERE rn = 1
  `,

  // ID로 파일 정보 조회
  // @id: 파일 ID
  getFileById: `
    SELECT 
      f.*,
      c.name as category_name,
      sc.name as sub_category_name
    FROM files f
    LEFT JOIN categories c ON f.category_id = c.id
    LEFT JOIN sub_categories sc ON f.sub_category_id = sc.id
    WHERE f.id = @id AND f.is_active = 1
  `,

  // 파일 다운로드 횟수 증가
  // @id: 파일 ID
  incrementDownloadCount: `
    UPDATE files SET download_count = download_count + 1 WHERE id = @id
  `,

  // 파일 상세 정보 조회 (카테고리 정보 포함)
  // @id: 파일 ID
  getFileDetail: `
    SELECT 
      f.id,
      f.file_name,
      f.version,
      f.description,
      f.main_features,
      f.recommended_environment,
      f.thumbnail_image,
      f.source_file_link,
      f.icon_file_link,
      f.fbx_file_link,
      f.vcmx_file_link,
      f.category_id,
      f.sub_category_id,
      f.uploader,
      f.component_id,
      f.type,
      f.model_type,
      f.created_at,
      f.updated_at,
      f.is_active,
      f.download_count,
      c.name as category_name
    FROM files f
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.id = @id AND f.is_active = 1
  `,

  // 관련 파일 목록 조회
  // @component_id: 컴포넌트 ID
  // @file_id: 현재 파일 ID
  getRelatedFiles: `
    SELECT 
      f.id,
      f.file_name,
      f.version,
      f.thumbnail_image,
      f.download_count,
      f.created_at,
      f.updated_at,
      f.description,
      f.main_features,
      f.recommended_environment,
      f.component_id,
      f.source_file_link,
      f.icon_file_link,
      c.name as category_name
    FROM files f
    LEFT JOIN categories c ON f.category_id = c.id
    WHERE f.component_id = @component_id
    AND f.id != @file_id
    AND f.is_active = 1
    ORDER BY f.updated_at DESC
  `,

  // 컴포넌트의 최신 버전 정보 조회
  // @component_id: 컴포넌트 ID
  getLatestComponentVersion: `
    SELECT TOP 1
      f.id,
      f.file_name,
      f.version,
      f.description,
      f.main_features,
      f.recommended_environment,
      f.thumbnail_image,
      f.source_file_link,
      f.icon_file_link,
      f.fbx_file_link,
      f.vcmx_file_link,
      f.category_id,
      f.sub_category_id,
      f.uploader,
      f.component_id,
      f.type,
      f.model_type,
      f.created_at,
      f.updated_at,
      f.is_active,
      f.download_count,
      c.name as category_name,
      sc.name as sub_category_name
    FROM files f
    LEFT JOIN categories c ON f.category_id = c.id
    LEFT JOIN sub_categories sc ON f.sub_category_id = sc.id
    WHERE (f.component_id = @component_id OR f.id = @component_id)
    AND f.is_active = 1
    ORDER BY f.updated_at DESC
  `,

  // 컴포넌트 새 버전 생성
  // @file_name: 파일 이름
  // @version: 버전
  // @description: 설명
  // @main_features: 주요 기능
  // @recommended_environment: 권장 환경
  // @thumbnail_image: 썸네일 이미지 경로
  // @source_file_link: FBX 파일 링크
  // @icon_file_link: VCMX 파일 링크
  // @category_id: 카테고리 ID
  // @uploader: 업로더 ID
  // @component_id: 컴포넌트 ID
  // @type: 컴포넌트 타입
  componentVersionCreate: `
    DECLARE @InsertedFiles TABLE (id INT);

    INSERT INTO files (
      file_name, version, description, main_features, recommended_environment,
      thumbnail_image, source_file_link, icon_file_link, fbx_file_link, vcmx_file_link,
      category_id, sub_category_id, uploader, type, model_type, component_id
    )
    OUTPUT INSERTED.id INTO @InsertedFiles
    VALUES (
      @file_name, @version, @description, @main_features, @recommended_environment,
      @thumbnail_image, @source_file_link, @icon_file_link, @fbx_file_link, @vcmx_file_link,
      @category_id, @sub_category_id, @uploader, @type, @model_type, @component_id
    );

    SELECT id FROM @InsertedFiles;
  `,

  // 같은 컴포넌트(component_id)의 모든 버전에 model_type을 동일하게 맞춤
  // @component_id: 컴포넌트 ID
  // @model_type: 적용할 모델 타입 (component 또는 layout)
  syncModelTypeForComponent: `
    UPDATE files SET model_type = @model_type WHERE component_id = @component_id
  `,

  // 카테고리별 통계 정보 조회
  // 반환: 카테고리 ID, 이름, 총 다운로드 수, 파일 수
  getCategoryStats: `
    SELECT 
      c.id AS category_id,
      c.name AS category_name,
      ISNULL(SUM(f.download_count), 0) AS total_downloads,
      COUNT(f.id) AS file_count
    FROM 
      categories c
    LEFT JOIN 
      files f ON f.category_id = c.id AND f.is_active = 1
    GROUP BY 
      c.id, c.name
    ORDER BY 
      total_downloads DESC
  `,

  // 서브카테고리 이름으로 ID 찾기
  // @name: 서브카테고리 이름
  // @category_id: 메인 카테고리 ID
  getSubCategoryIdByName: `
    SELECT 
      id,
      name,
      main_category_id as category_id
    FROM sub_categories
    WHERE name = @name
    AND main_category_id = @category_id
  `,

  // 파일의 서브카테고리 ID 업데이트
  // @file_id: 파일 ID
  // @sub_category_id: 서브카테고리 ID
  updateFileSubCategory: `
    UPDATE files 
    SET sub_category_id = @sub_category_id
    WHERE id = @file_id
  `,

  // 파일 ID들로 component_id 목록 조회
  // @ids: 파일 ID 목록 (콤마로 구분된 문자열)
  getComponentIdsByFileIds: `
    SELECT DISTINCT component_id 
    FROM files 
    WHERE id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@ids, ','))
    AND component_id IS NOT NULL 
    AND is_active = 1
  `,

  // component_id로 해당 컴포넌트의 모든 파일 정보 조회 (삭제 전 파일 경로 확인용)
  // @component_ids: 컴포넌트 ID 목록 (콤마로 구분된 문자열)
  getFilePathsByComponentIds: `
    SELECT 
      id,
      thumbnail_image,
      source_file_link,
      fbx_file_link,
      vcmx_file_link
    FROM files 
    WHERE component_id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@component_ids, ','))
    AND is_active = 1
  `,

  // 파일 ID들로 파일 정보 조회 (삭제 전 파일 경로 확인용)
  // @ids: 파일 ID 목록 (콤마로 구분된 문자열)
  getFilePathsByIds: `
    SELECT 
      id,
      thumbnail_image,
      source_file_link,
      fbx_file_link,
      vcmx_file_link
    FROM files 
    WHERE id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@ids, ','))
    AND is_active = 1
  `,

  // components 테이블에서 컴포넌트 삭제 (만약 별도 테이블이 있다면)
  // @component_ids: 컴포넌트 ID 목록 (콤마로 구분된 문자열)
  deleteComponents: `
    DELETE FROM components 
    WHERE id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@component_ids, ','))
  `,

  // files 테이블에서 파일들을 완전 삭제
  // @ids: 파일 ID 목록 (콤마로 구분된 문자열)
  deleteFiles: `
    DELETE FROM files 
    WHERE id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@ids, ','))
  `,

  // component_id로 해당 컴포넌트의 모든 파일을 완전 삭제
  // @component_ids: 컴포넌트 ID 목록 (콤마로 구분된 문자열)
  deleteFilesByComponentIds: `
    DELETE FROM files 
    WHERE component_id IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@component_ids, ','))
  `,

  // 이메일 중복 확인
  // @email: 확인할 이메일 주소
  checkEmailExists: `
    SELECT id, email 
    FROM users 
    WHERE email = @email
  `,

  // 모든 VCMX 파일 정보 조회 (일괄 다운로드용)
  getAllVcmxFiles: `
    SELECT 
      id,
      file_name,
      vcmx_file_link,
      source_file_link,
      category_id,
      sub_category_id,
      type,
      is_active
    FROM files 
    WHERE (vcmx_file_link IS NOT NULL AND vcmx_file_link != '')
       OR (source_file_link IS NOT NULL AND source_file_link LIKE '%.vcmx%')
    ORDER BY category_id, sub_category_id, file_name
  `,

  // 디버깅용: 모든 파일 정보 조회
  getAllFilesDebug: `
    SELECT 
      id,
      file_name,
      vcmx_file_link,
      category_id,
      sub_category_id,
      type,
      is_active,
      created_at,
      component_id
    FROM files 
    ORDER BY id
  `,

  // 모든 파일 정보 조회 (외부 API용)
  getAllFiles: `
    SELECT 
      id,
      file_name,
      version,
      created_at,
      updated_at,
      download_count,
      source_file_link,
      fbx_file_link,
      vcmx_file_link,
      thumbnail_image,
      uploader,
      category_id,
      component_id,
      type,
      model_type,
      description,
      main_features,
      recommended_environment,
      sub_category_id,
      is_active
    FROM files 
    WHERE is_active = 1
    ORDER BY created_at DESC
  `,
  // 모든 파일의 최신 버전 정보 조회 (외부 API용)
  getAllLatestFiles: `
    WITH RankedFiles AS (
      SELECT 
        f.*,
        ROW_NUMBER() OVER (
            PARTITION BY f.component_id 
            ORDER BY f.updated_at DESC, f.id DESC
        ) as rn
      FROM files f
      WHERE f.is_active = 1
    )
    SELECT 
      id,
      file_name,
      version,
      created_at,
      updated_at,
      download_count,
      source_file_link,
      fbx_file_link,
      vcmx_file_link,
      thumbnail_image,
      uploader,
      category_id,
      component_id,
      type,
      model_type,
      description,
      main_features,
      recommended_environment,
      sub_category_id,
      is_active
    FROM RankedFiles 
    WHERE rn = 1
    ORDER BY created_at DESC
  `,

  // 컴포넌트 전체 그룹의 이름을 업데이트 (동기화)
  // @component_id: 컴포넌트 그룹 ID
  // @file_name: 새로운 파일 이름
  updateComponentNameByGroupId: `
    UPDATE files 
    SET file_name = @file_name 
    WHERE component_id = @component_id
  `,

  // 파일 경로 업데이트 및 카테고리 정보 초기화 (마이그레이션용)
  updateFilePathsAndNullCategories: `
    UPDATE files 
    SET 
      source_file_link = @source_file_link,
      icon_file_link = @icon_file_link,
      fbx_file_link = @fbx_file_link,
      vcmx_file_link = @vcmx_file_link,
      category_id = NULL,
      sub_category_id = NULL
    WHERE id = @id
  `,

  // API Key 조회 (외부 서버-to-서버 인증용)
  // @key_value: 클라이언트가 전달한 X-API-Key 헤더 값
  getApiKey: `
    SELECT id, name, description, is_active, expires_at
    FROM api_keys
    WHERE key_value = @key_value
      AND is_active = 1
      AND (expires_at IS NULL OR expires_at > GETDATE())
  `,

  // 특정 버전에 해당하는 컴포넌트 정보(설명, 주요 기능) 업데이트
  updateComponentInfoById: `
    UPDATE files 
    SET 
      main_features = @main_features,
      description = @description,
      updated_at = GETDATE()
    WHERE id = @id
  `,
};
