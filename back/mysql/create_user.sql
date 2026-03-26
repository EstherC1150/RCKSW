USE [master]
GO
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'rcksw')
BEGIN
    CREATE LOGIN [rcksw] WITH PASSWORD=N'rcksw!!', DEFAULT_DATABASE=[rcksw], CHECK_EXPIRATION=OFF, CHECK_POLICY=OFF
END
GO

USE [rcksw]
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'rcksw')
BEGIN
    CREATE USER [rcksw] FOR LOGIN [rcksw]
END
GO

ALTER ROLE [db_owner] ADD MEMBER [rcksw]
GO
