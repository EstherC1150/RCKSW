-- ============================================================
-- API Key 관리 테이블 생성
-- RCKSW 외부 서버-to-서버 인증용
-- 실행: SQL Server Management Studio 또는 sqlcmd
-- ============================================================

-- 테이블이 이미 존재하면 삭제 후 재생성 (최초 1회만 실행)
IF OBJECT_ID('dbo.api_keys', 'U') IS NOT NULL
    DROP TABLE dbo.api_keys;
GO

CREATE TABLE dbo.api_keys (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    key_value   NVARCHAR(128)   NOT NULL UNIQUE,   -- 실제 API Key 값 (환경변수 등으로 관리)
    name        NVARCHAR(100)   NOT NULL,           -- 발급 대상 이름 (예: 'VisualComponents팀')
    description NVARCHAR(255)   NULL,               -- 용도 메모
    is_active   BIT             NOT NULL DEFAULT 1, -- 0이면 즉시 차단 가능
    created_at  DATETIME        NOT NULL DEFAULT GETDATE(),
    expires_at  DATETIME        NULL                -- NULL이면 만료 없음 (영구)
);
GO

-- ============================================================
-- 발급 예시 (관리자가 직접 실행)
-- key_value는 openssl rand -hex 32 또는 uuid 등으로 생성
-- ============================================================
-- INSERT INTO dbo.api_keys (key_value, name, description, is_active, expires_at)
-- VALUES (
--     'your-secret-api-key-here-replace-this',
--     'VisualComponents팀',
--     '외부 컴포넌트 업로드 자동화용',
--     1,
--     NULL  -- 영구 키, 만료일 지정 시 예: '2027-12-31'
-- );
