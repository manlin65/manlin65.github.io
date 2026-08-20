-- KI-gestuetzter Angebots- und Rechnungscheck
-- SQL Server Demo-Schema
IF DB_ID(N'KI_Rechnungscheck') IS NULL
    CREATE DATABASE KI_Rechnungscheck;
GO
USE KI_Rechnungscheck;
GO

IF OBJECT_ID(N'dbo.DocumentPositions', N'U') IS NOT NULL DROP TABLE dbo.DocumentPositions;
IF OBJECT_ID(N'dbo.Documents', N'U') IS NOT NULL DROP TABLE dbo.Documents;
GO

CREATE TABLE dbo.Documents (
    DocumentId           int IDENTITY(1,1) PRIMARY KEY,
    DocumentType         nvarchar(30) NOT NULL,
    FileName             nvarchar(260) NULL,
    Supplier             nvarchar(200) NULL,
    Customer             nvarchar(200) NULL,
    DocumentNumber       nvarchar(100) NULL,
    DocumentDate         date NULL,
    NetAmount            decimal(18,2) NULL,
    VatRate              decimal(9,2) NULL,
    VatAmount            decimal(18,2) NULL,
    GrossAmount          decimal(18,2) NULL,
    PaymentTermsDays     int NULL,
    DueDate              date NULL,
    CheckStatus          nvarchar(30) NULL,
    CheckMessage         nvarchar(max) NULL,
    CreatedAt            datetime2(0) NOT NULL CONSTRAINT DF_Documents_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.DocumentPositions (
    PositionId           int IDENTITY(1,1) PRIMARY KEY,
    DocumentId           int NOT NULL,
    PositionNo           int NOT NULL,
    ArticleNo            nvarchar(100) NULL,
    Description          nvarchar(500) NULL,
    Quantity             decimal(18,3) NULL,
    Unit                 nvarchar(30) NULL,
    UnitPrice            decimal(18,2) NULL,
    LineTotal            decimal(18,2) NULL,
    CONSTRAINT FK_DocumentPositions_Documents FOREIGN KEY(DocumentId)
        REFERENCES dbo.Documents(DocumentId) ON DELETE CASCADE
);
GO
CREATE INDEX IX_Documents_NumberSupplier ON dbo.Documents(Supplier, DocumentNumber);
GO
