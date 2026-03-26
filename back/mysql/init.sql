USE [rcksw]
GO

/****** 1. Table [dbo].[categories] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[categories](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](50) NULL,
 CONSTRAINT [PK__categori__3213E83FCAA12FE7] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** 2. Table [dbo].[components] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[components](
	[id] [int] IDENTITY(1,1) NOT NULL,
 CONSTRAINT [PK_components] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** 3. Table [dbo].[files] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[files](
	[file_name] [nvarchar](255) NULL,
	[version] [nvarchar](50) NULL,
	[created_at] [datetime] NULL,
	[updated_at] [datetime] NULL,
	[download_count] [int] NULL,
	[is_active] [bit] NULL,
	[fbx_file_link] [varchar](255) NULL,
	[thumbnail_image] [varchar](255) NULL,
	[uploader] [nvarchar](100) NULL,
	[category_id] [int] NOT NULL,
	[component_id] [int] NULL,
	[type] [nvarchar](50) NULL,
	[id] [int] IDENTITY(1,1) NOT NULL,
	[description] [nvarchar](max) NULL,
	[main_features] [nvarchar](2500) NULL,
	[vcmx_file_link] [nvarchar](max) NULL,
	[recommended_environment] [nvarchar](500) NULL,
	[sub_category_id] [int] NULL,
 CONSTRAINT [PK_files] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** 4. Table [dbo].[sub_categories] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sub_categories](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](250) NOT NULL,
	[main_category_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** 5. Table [dbo].[users] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[pwd] [varchar](500) NOT NULL,
	[username] [nvarchar](255) NULL,
	[created_at] [datetime] NULL,
	[department] [nvarchar](255) NULL,
	[position] [nvarchar](255) NULL,
	[phone_number] [varchar](15) NULL,
	[role] [varchar](50) NULL,
	[is_approved] [bit] NULL,
	[log] [datetime] NULL,
 CONSTRAINT [PK_users] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

-- DEFAULT CONSTRAINTS
ALTER TABLE [dbo].[files] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[files] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[files] ADD  DEFAULT ((0)) FOR [download_count]
GO
ALTER TABLE [dbo].[files] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[files] ADD  DEFAULT ((1)) FOR [category_id]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT ((0)) FOR [is_approved]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (NULL) FOR [log]
GO

-- FOREIGN KEYS
ALTER TABLE [dbo].[files]  WITH CHECK ADD  CONSTRAINT [FK_files_categories] FOREIGN KEY([category_id]) REFERENCES [dbo].[categories] ([id])
GO
ALTER TABLE [dbo].[files] CHECK CONSTRAINT [FK_files_categories]
GO
ALTER TABLE [dbo].[files]  WITH CHECK ADD  CONSTRAINT [FK_files_sub_category] FOREIGN KEY([sub_category_id]) REFERENCES [dbo].[sub_categories] ([id])
GO
ALTER TABLE [dbo].[files] CHECK CONSTRAINT [FK_files_sub_category]
GO
ALTER TABLE [dbo].[sub_categories]  WITH CHECK ADD FOREIGN KEY([main_category_id]) REFERENCES [dbo].[categories] ([id])
GO
