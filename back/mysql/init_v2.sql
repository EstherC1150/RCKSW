-- [init_v2.sql] RCKSW Project - Full Database Schema Export (MSSQL)
-- Created At: 2026-03-27
-- Description: 최신 5가지 타입(VC Plugin/Model, NS Plugin/Model, etc) 중심 구조와 
--             nullable category_id 컬럼을 반영한 최신 DB 초기화 스크립트입니다.

USE [master]
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'rcksw')
BEGIN
    CREATE DATABASE [rcksw]
END
GO

USE [rcksw]
GO

/****** 1. Table [dbo].[categories] ******/
IF OBJECT_ID('[dbo].[categories]', 'U') IS NOT NULL DROP TABLE [dbo].[categories];
CREATE TABLE [dbo].[categories](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] [nvarchar](50) NULL
);
GO

/****** 2. Table [dbo].[sub_categories] ******/
IF OBJECT_ID('[dbo].[sub_categories]', 'U') IS NOT NULL DROP TABLE [dbo].[sub_categories];
CREATE TABLE [dbo].[sub_categories](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] [nvarchar](250) NOT NULL,
    [main_category_id] [int] NOT NULL,
    CONSTRAINT [FK_sub_categories_main_category] FOREIGN KEY([main_category_id]) REFERENCES [dbo].[categories] ([id])
);
GO

/****** 3. Table [dbo].[components] ******/
IF OBJECT_ID('[dbo].[components]', 'U') IS NOT NULL DROP TABLE [dbo].[components];
CREATE TABLE [dbo].[components](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY
);
GO

/****** 4. Table [dbo].[files] ******/
IF OBJECT_ID('[dbo].[files]', 'U') IS NOT NULL DROP TABLE [dbo].[files];
CREATE TABLE [dbo].[files](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [file_name] [nvarchar](255) NULL,
    [version] [nvarchar](50) NULL,
    [type] [nvarchar](50) NULL,
    [model_type] [nvarchar](20) NULL, -- vc_model 전용: 'component' 또는 'layout'
    [description] [nvarchar](max) NULL,
    [main_features] [nvarchar](2500) NULL,
    [recommended_environment] [nvarchar](500) NULL,
    [thumbnail_image] [varchar](255) NULL,
    [source_file_link] [varchar](255) NULL,
    [icon_file_link] [nvarchar](max) NULL,
    [fbx_file_link] [nvarchar](max) NULL,
    [vcmx_file_link] [nvarchar](max) NULL,
    [category_id] [int] NULL DEFAULT ((1)), -- 카테고리 NULL 허용
    [sub_category_id] [int] NULL,
    [component_id] [int] NULL,
    [uploader] [nvarchar](100) NULL,
    [download_count] [int] NULL DEFAULT ((0)),
    [is_active] [bit] NULL DEFAULT ((1)),
    [created_at] [datetime] NULL DEFAULT (getdate()),
    [updated_at] [datetime] NULL DEFAULT (getdate()),
    CONSTRAINT [FK_files_categories] FOREIGN KEY([category_id]) REFERENCES [dbo].[categories] ([id]),
    CONSTRAINT [FK_files_sub_category] FOREIGN KEY([sub_category_id]) REFERENCES [dbo].[sub_categories] ([id])
);
GO

/****** 4-1. Table [dbo].[component_additional_files] ******/
IF OBJECT_ID('[dbo].[component_additional_files]', 'U') IS NOT NULL DROP TABLE [dbo].[component_additional_files];
CREATE TABLE [dbo].[component_additional_files](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [file_id] [int] NOT NULL,
    [original_name] [nvarchar](255) NOT NULL,
    [file_path] [nvarchar](500) NOT NULL,
    [file_size] [bigint] NULL,
    [download_count] [int] NULL DEFAULT ((0)),
    [created_at] [datetime] NULL DEFAULT (getdate()),
    CONSTRAINT [FK_additional_files_file] FOREIGN KEY([file_id]) REFERENCES [dbo].[files] ([id]) ON DELETE CASCADE
);
GO

/****** 5. Table [dbo].[users] ******/
IF OBJECT_ID('[dbo].[users]', 'U') IS NOT NULL DROP TABLE [dbo].[users];
CREATE TABLE [dbo].[users](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [email] [varchar](255) NOT NULL,
    [pwd] [varchar](500) NOT NULL,
    [username] [nvarchar](255) NULL,
    [department] [nvarchar](255) NULL,
    [position] [nvarchar](255) NULL,
    [phone_number] [varchar](15) NULL,
    [role] [varchar](50) NULL,
    [is_approved] [bit] NULL DEFAULT ((0)),
    [log] [datetime] NULL DEFAULT (NULL),
    [created_at] [datetime] NULL DEFAULT (getdate())
);
GO

-- 기본 데이터 (관리자 계정 및 기본 카테고리 필요 시 직접 추가)
-- INSERT INTO [dbo].[categories] (name) VALUES (N'기타');
-- GO
