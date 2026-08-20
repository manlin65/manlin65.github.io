/* KI-gestützter Datenqualitäts-Check – fiktive SQL-Server-Testdaten */
IF DB_ID(N'KI_Datenqualitaet_Demo') IS NULL
    CREATE DATABASE KI_Datenqualitaet_Demo;
GO
USE KI_Datenqualitaet_Demo;
GO

DROP TABLE IF EXISTS dbo.AuftraegeTest;
DROP TABLE IF EXISTS dbo.ArtikelTest;
DROP TABLE IF EXISTS dbo.KundenTest;
GO

-- Absichtlich lockere Datentypen: Die Demo soll auch falsche Datentypen aufnehmen können.
CREATE TABLE dbo.KundenTest (
    RowID int IDENTITY(1,1) PRIMARY KEY,
    KundenID nvarchar(20) NULL,
    Firma nvarchar(120) NULL,
    Ansprechpartner nvarchar(120) NULL,
    PLZ nvarchar(20) NULL,
    Ort nvarchar(100) NULL,
    Email nvarchar(180) NULL,
    Umsatz nvarchar(50) NULL,
    Aktiv nvarchar(20) NULL,
    ErfasstAm nvarchar(30) NULL
);

CREATE TABLE dbo.ArtikelTest (
    RowID int IDENTITY(1,1) PRIMARY KEY,
    ArtikelID nvarchar(20) NULL,
    Bezeichnung nvarchar(150) NULL,
    Kategorie nvarchar(60) NULL,
    Preis nvarchar(50) NULL,
    MwStSatz nvarchar(20) NULL,
    Lagerbestand nvarchar(50) NULL,
    Lieferant nvarchar(120) NULL,
    Aktiv nvarchar(20) NULL
);

CREATE TABLE dbo.AuftraegeTest (
    RowID int IDENTITY(1,1) PRIMARY KEY,
    AuftragID nvarchar(20) NULL,
    KundenID nvarchar(20) NULL,
    ArtikelID nvarchar(20) NULL,
    Menge nvarchar(50) NULL,
    Einzelpreis nvarchar(50) NULL,
    Auftragsdatum nvarchar(30) NULL,
    Status nvarchar(30) NULL,
    Gesamt nvarchar(50) NULL
);
GO

INSERT dbo.KundenTest(KundenID,Firma,Ansprechpartner,PLZ,Ort,Email,Umsatz,Aktiv,ErfasstAm) VALUES
(N'K1001',N'Müller GmbH',N'Anna Müller',N'90402',N'Nürnberg',N'anna.mueller@mueller.de',N'12500',N'Ja',N'2026-01-15'),
(N'K1002',N'Test AG',N'Peter Test',N'',N'Schwabach',N'peter.test@test-ag.de',N'8200',N'Ja',N'2026-02-02'),
(N'K1003',N'Demo KG',N'Lena Demo',N'ABCDE',N'Nürnberg',N'lena.demo@demo.de',N'-500',N'Ja',N'2026-02-12'),
(N'K1004',N'Beispiel GmbH',N'Tom Beispiel',N'91126',N'schwabach',N'tom.beispiel@beispiel.de',N'15100',N'JA',N'2026-03-03'),
(N'K1005',N'Alpha IT GmbH',N'Mia Alpha',N'90403',N'Nürnberg',N'mia.alpha@',N'9900',N'Ja',N'2026-03-18'),
(N'K1006',N'Beta Service GmbH',N'Ben Beta',N'91052',N'Erlangen',N'ben.beta@beta.de',N'18200',N'Nein',N'2026-04-01'),
(N'K1001',N'Müller GmbH',N'Anna Müller',N'90402',N'Nürnberg',N'anna.mueller@mueller.de',N'12500',N'Ja',N'2026-01-15'),
(N'K1008',N'Gamma Logistik',N'Eva Gamma',N'90762',N'Fürth',N'eva.gamma@gamma.de',N'1250000',N'Ja',N'2026-05-04'),
(N'K1009',N'Delta Handel',N'Noah Delta',N'90402',N'Nürnberg',N'noah.delta@delta.de',N'7400',N'Ja',N'2027-01-01'),
(N'K1010',N'Omega GmbH',NULL,N'90431',N'Nürnberg',N'office@omega.de',N'6400',N'Ja',N'2026-06-01'),
(NULL,N'Ohne ID GmbH',N'Max Mustermann',N'90441',N'Nürnberg',N'max@ohneid.de',N'3500',N'Ja',N'2026-06-03'),
(N'K1012',N'Schmidt & Partner',N'Sara Schmidt',N'91207',N'Lauf',N'sara.schmidt@partner.de',N'12300',N'ja',N'2026-06-08'),
(N'K1013',N'Techno GmbH',N'Paul Techno',N'90408',N'Nürnberg',N'paul.techno@techno.de',N'zwölftausend',N'Ja',N'2026-06-09'),
(N'K1014',N'Franken Bau',N'Julia Franken',N'90411',N'Nürnberg',N'julia.franken@frankenbau.de',N'22000',N'Ja',N'2026-06-15'),
(N'K1015',N'Roth Consulting',N'Felix Roth',N'91154',N'Roth',N'felix.roth@consulting.de',N'17500',N'Nein',N'2026-07-02');

INSERT dbo.ArtikelTest(ArtikelID,Bezeichnung,Kategorie,Preis,MwStSatz,Lagerbestand,Lieferant,Aktiv) VALUES
(N'A1001',N'Notebook Business 14',N'Hardware',N'1100',N'19',N'12',N'Alpha IT GmbH',N'Ja'),
(N'A1002',N'Dockingstation USB-C',N'Hardware',N'125',N'19',N'30',N'Alpha IT GmbH',N'Ja'),
(N'A1003',N'Einrichtung Arbeitsplatz',N'Dienstleistung',N'75',N'19',N'999',N'Beta Service GmbH',N'Ja'),
(N'A1004',N'Monitor 27 Zoll',N'hardware',N'249',N'19',N'18',N'Gamma Logistik',N'Ja'),
(N'A1005',N'Lizenz Standard',N'Software',N'29.90',N'19',N'250',N'Delta Handel',N'Ja'),
(N'A1006',N'Support Premium',N'Dienstleistung',N'-99',N'19',N'999',N'Beta Service GmbH',N'Ja'),
(N'A1007',N'Maus Wireless',N'Hardware',N'39.90',N'19',N'-5',N'Gamma Logistik',N'Ja'),
(N'A1008',N'Tastatur DE',N'Hardware',N'59.90',N'19',N'45',N'Gamma Logistik',N'JA'),
(N'A1009',N'Sonderartikel',NULL,N'89',N'19',N'5',N'Omega GmbH',N'Ja'),
(N'A1010',N'Beratung Remote',N'Dienstleistung',N'achtzig',N'19',N'999',N'Roth Consulting',N'Ja'),
(N'A1011',N'Buch Fachliteratur',N'Sonstiges',N'45',N'7',N'8',N'Schmidt & Partner',N'Ja'),
(N'A1012',N'USB-C Kabel',N'Hardware',N'14.90',N'19',N'100',N'Alpha IT GmbH',N'Nein'),
(N'A1012',N'USB-C Kabel',N'Hardware',N'14.90',N'19',N'100',N'Alpha IT GmbH',N'Nein'),
(NULL,N'Artikel ohne ID',N'Hardware',N'9.90',N'19',N'3',N'Alpha IT GmbH',N'Ja'),
(N'A1015',N'Falsche MwSt',N'Hardware',N'199',N'25',N'7',N'Alpha IT GmbH',N'Ja');

INSERT dbo.AuftraegeTest(AuftragID,KundenID,ArtikelID,Menge,Einzelpreis,Auftragsdatum,Status,Gesamt) VALUES
(N'O2001',N'K1001',N'A1001',N'2',N'1100',N'2026-07-01',N'Offen',N'2200'),
(N'O2002',N'K1002',N'A1002',N'3',N'125',N'2026-07-02',N'Erledigt',N'375'),
(N'O2003',N'K9999',N'A1003',N'2',N'75',N'2026-07-03',N'Offen',N'150'),
(N'O2004',N'K1004',N'A9999',N'1',N'249',N'2026-07-04',N'Offen',N'249'),
(N'O2005',N'K1005',N'A1005',N'0',N'29.90',N'2026-07-05',N'Offen',N'0'),
(N'O2006',N'K1006',N'A1006',N'1',N'-99',N'2026-07-06',N'Offen',N'-99'),
(N'O2007',N'K1001',N'A1002',N'2',N'125',N'2026-07-07',N'offen',N'250'),
(N'O2008',N'K1008',N'A1004',N'2',N'249',N'2026-07-08',N'Erledigt',N'400'),
(N'O2009',NULL,N'A1005',N'5',N'29.90',N'2026-07-09',N'Offen',N'149.50'),
(N'O2010',N'K1009',N'A1007',N'1',N'39.90',N'2027-01-10',N'Offen',N'39.90'),
(N'O2011',N'K1010',N'A1008',N'zwei',N'59.90',N'2026-07-11',N'Offen',N'119,80'),
(N'O2012',N'K1012',N'A1011',N'1',N'45',N'2026-07-12',N'Storniert',N'45'),
(N'O2012',N'K1012',N'A1011',N'1',N'45',N'2026-07-12',N'Storniert',N'45'),
(N'O2014',N'K1014',N'A1001',N'1',N'1100',NULL,N'Offen',N'1100'),
(NULL,N'K1015',N'A1002',N'2',N'125',N'2026-07-15',N'Offen',N'250');
GO

SELECT 'KundenTest' AS Tabelle, COUNT(*) Datensaetze FROM dbo.KundenTest
UNION ALL SELECT 'ArtikelTest', COUNT(*) FROM dbo.ArtikelTest
UNION ALL SELECT 'AuftraegeTest', COUNT(*) FROM dbo.AuftraegeTest;
GO
