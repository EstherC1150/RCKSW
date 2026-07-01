const { pool } = require('./mysql/index.js');
pool.connect().then(() => pool.request().query(`
ALTER TRIGGER [dbo].[before_file_insert]
ON [dbo].[files]
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @component_id INT;

    -- 삽입하려는 데이터에서 component_id 추출
    SELECT @component_id = component_id FROM inserted;

    -- 1. 새로운 컴포넌트인 경우 (ID가 없거나 0)
    IF @component_id IS NULL OR @component_id = 0
    BEGIN
        -- components 테이블에 새 행을 직접 삽입 (identity 기반)
        INSERT INTO components DEFAULT VALUES;
        SELECT @component_id = SCOPE_IDENTITY();

        -- files 테이블에 삽입 (rcksw 환경의 컬럼명 적용)
        INSERT INTO files (
            file_name, version, created_at, updated_at, 
            download_count, is_active, source_file_link, icon_file_link, 
            fbx_file_link, vcmx_file_link,
            thumbnail_image, description, main_features, recommended_environment, 
            uploader, category_id, sub_category_id, component_id, type
        )
        OUTPUT INSERTED.id
        SELECT 
            file_name, version, GETDATE(), GETDATE(), 
            0, 1, source_file_link, icon_file_link, 
            fbx_file_link, vcmx_file_link,
            thumbnail_image, description, main_features, recommended_environment, 
            uploader, category_id, sub_category_id, @component_id, type
        FROM inserted;
    END
    -- 2. 기존 컴포넌트의 새 버전 등록 (이미 ID가 있는 경우)
    ELSE
    BEGIN
        INSERT INTO files (
            file_name, version, created_at, updated_at, 
            download_count, is_active, source_file_link, icon_file_link, 
            fbx_file_link, vcmx_file_link,
            thumbnail_image, description, main_features, recommended_environment, 
            uploader, category_id, sub_category_id, component_id, type
        )
        OUTPUT INSERTED.id
        SELECT 
            file_name, version, GETDATE(), GETDATE(), 
            0, 1, source_file_link, icon_file_link, 
            fbx_file_link, vcmx_file_link,
            thumbnail_image, description, main_features, recommended_environment, 
            uploader, category_id, sub_category_id, component_id, type
        FROM inserted;
    END
END;
`)).then(r => {
    console.log('Trigger updated successfully!');
    process.exit(0);
}).catch(console.error);
