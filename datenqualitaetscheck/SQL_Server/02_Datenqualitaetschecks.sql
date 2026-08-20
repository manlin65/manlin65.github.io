USE KI_Datenqualitaet_Demo;
GO

/* Liefert eine gemeinsame Fehlerliste – nur lesend. */
WITH KundenDuplikate AS (
    SELECT KundenID FROM dbo.KundenTest
    WHERE NULLIF(LTRIM(RTRIM(KundenID)),N'') IS NOT NULL
    GROUP BY KundenID HAVING COUNT(*) > 1
), ArtikelDuplikate AS (
    SELECT ArtikelID FROM dbo.ArtikelTest
    WHERE NULLIF(LTRIM(RTRIM(ArtikelID)),N'') IS NOT NULL
    GROUP BY ArtikelID HAVING COUNT(*) > 1
), AuftragDuplikate AS (
    SELECT AuftragID FROM dbo.AuftraegeTest
    WHERE NULLIF(LTRIM(RTRIM(AuftragID)),N'') IS NOT NULL
    GROUP BY AuftragID HAVING COUNT(*) > 1
)
SELECT * FROM (
    SELECT 'Kunden' Bereich, RowID, ISNULL(KundenID,N'') DatensatzID, 'Fehler' Schweregrad, 'KundenID fehlt' Problem
    FROM dbo.KundenTest WHERE NULLIF(LTRIM(RTRIM(KundenID)),N'') IS NULL
    UNION ALL
    SELECT 'Kunden', k.RowID, k.KundenID, 'Fehler', 'Doppelte KundenID'
    FROM dbo.KundenTest k JOIN KundenDuplikate d ON d.KundenID=k.KundenID
    UNION ALL
    SELECT 'Kunden', RowID, ISNULL(KundenID,N''), 'Fehler', 'PLZ ist nicht fünfstellig numerisch'
    FROM dbo.KundenTest WHERE PLZ IS NULL OR LEN(LTRIM(RTRIM(PLZ)))<>5 OR TRY_CONVERT(int,PLZ) IS NULL
    UNION ALL
    SELECT 'Kunden', RowID, ISNULL(KundenID,N''), 'Fehler', 'E-Mail-Format auffällig'
    FROM dbo.KundenTest WHERE Email IS NULL OR Email NOT LIKE '%_@_%._%'
    UNION ALL
    SELECT 'Kunden', RowID, ISNULL(KundenID,N''), 'Fehler', 'Umsatz ist keine nichtnegative Zahl'
    FROM dbo.KundenTest WHERE TRY_CONVERT(decimal(18,2),REPLACE(Umsatz,',','.')) IS NULL OR TRY_CONVERT(decimal(18,2),REPLACE(Umsatz,',','.')) < 0
    UNION ALL
    SELECT 'Kunden', RowID, ISNULL(KundenID,N''), 'Hinweis', 'Aktiv-Wert nicht standardisiert (Ja/Nein)'
    FROM dbo.KundenTest WHERE Aktiv NOT IN (N'Ja',N'Nein')
    UNION ALL
    SELECT 'Kunden', RowID, ISNULL(KundenID,N''), 'Hinweis', 'ErfasstAm liegt in der Zukunft oder ist ungültig'
    FROM dbo.KundenTest WHERE TRY_CONVERT(date,ErfasstAm) IS NULL OR TRY_CONVERT(date,ErfasstAm) > CAST(GETDATE() AS date)

    UNION ALL
    SELECT 'Artikel', RowID, ISNULL(ArtikelID,N''), 'Fehler', 'ArtikelID fehlt'
    FROM dbo.ArtikelTest WHERE NULLIF(LTRIM(RTRIM(ArtikelID)),N'') IS NULL
    UNION ALL
    SELECT 'Artikel', a.RowID, a.ArtikelID, 'Fehler', 'Doppelte ArtikelID'
    FROM dbo.ArtikelTest a JOIN ArtikelDuplikate d ON d.ArtikelID=a.ArtikelID
    UNION ALL
    SELECT 'Artikel', RowID, ISNULL(ArtikelID,N''), 'Fehler', 'Preis ist keine nichtnegative Zahl'
    FROM dbo.ArtikelTest WHERE TRY_CONVERT(decimal(18,2),REPLACE(Preis,',','.')) IS NULL OR TRY_CONVERT(decimal(18,2),REPLACE(Preis,',','.')) < 0
    UNION ALL
    SELECT 'Artikel', RowID, ISNULL(ArtikelID,N''), 'Fehler', 'Lagerbestand ist ungültig oder negativ'
    FROM dbo.ArtikelTest WHERE TRY_CONVERT(int,Lagerbestand) IS NULL OR TRY_CONVERT(int,Lagerbestand) < 0
    UNION ALL
    SELECT 'Artikel', RowID, ISNULL(ArtikelID,N''), 'Fehler', 'MwSt-Satz ist nicht 0, 7 oder 19'
    FROM dbo.ArtikelTest WHERE TRY_CONVERT(int,MwStSatz) NOT IN (0,7,19)
    UNION ALL
    SELECT 'Artikel', RowID, ISNULL(ArtikelID,N''), 'Fehler', 'Kategorie fehlt'
    FROM dbo.ArtikelTest WHERE NULLIF(LTRIM(RTRIM(Kategorie)),N'') IS NULL
    UNION ALL
    SELECT 'Artikel', RowID, ISNULL(ArtikelID,N''), 'Hinweis', 'Aktiv-Wert nicht standardisiert (Ja/Nein)'
    FROM dbo.ArtikelTest WHERE Aktiv NOT IN (N'Ja',N'Nein')

    UNION ALL
    SELECT 'Aufträge', RowID, ISNULL(AuftragID,N''), 'Fehler', 'AuftragID fehlt'
    FROM dbo.AuftraegeTest WHERE NULLIF(LTRIM(RTRIM(AuftragID)),N'') IS NULL
    UNION ALL
    SELECT 'Aufträge', a.RowID, a.AuftragID, 'Fehler', 'Doppelte AuftragID'
    FROM dbo.AuftraegeTest a JOIN AuftragDuplikate d ON d.AuftragID=a.AuftragID
    UNION ALL
    SELECT 'Aufträge', a.RowID, ISNULL(a.AuftragID,N''), 'Fehler', 'KundenID existiert nicht im Kundenstamm'
    FROM dbo.AuftraegeTest a LEFT JOIN dbo.KundenTest k ON k.KundenID=a.KundenID
    WHERE NULLIF(LTRIM(RTRIM(a.KundenID)),N'') IS NULL OR k.RowID IS NULL
    UNION ALL
    SELECT 'Aufträge', a.RowID, ISNULL(a.AuftragID,N''), 'Fehler', 'ArtikelID existiert nicht im Artikelstamm'
    FROM dbo.AuftraegeTest a LEFT JOIN dbo.ArtikelTest p ON p.ArtikelID=a.ArtikelID
    WHERE NULLIF(LTRIM(RTRIM(a.ArtikelID)),N'') IS NULL OR p.RowID IS NULL
    UNION ALL
    SELECT 'Aufträge', RowID, ISNULL(AuftragID,N''), 'Fehler', 'Menge ist ungültig oder <= 0'
    FROM dbo.AuftraegeTest WHERE TRY_CONVERT(decimal(18,3),REPLACE(Menge,',','.')) IS NULL OR TRY_CONVERT(decimal(18,3),REPLACE(Menge,',','.')) <= 0
    UNION ALL
    SELECT 'Aufträge', RowID, ISNULL(AuftragID,N''), 'Fehler', 'Einzelpreis ist ungültig oder negativ'
    FROM dbo.AuftraegeTest WHERE TRY_CONVERT(decimal(18,2),REPLACE(Einzelpreis,',','.')) IS NULL OR TRY_CONVERT(decimal(18,2),REPLACE(Einzelpreis,',','.')) < 0
    UNION ALL
    SELECT 'Aufträge', RowID, ISNULL(AuftragID,N''), 'Fehler', 'Gesamt stimmt nicht mit Menge × Einzelpreis überein'
    FROM dbo.AuftraegeTest
    WHERE TRY_CONVERT(decimal(18,3),REPLACE(Menge,',','.')) IS NOT NULL
      AND TRY_CONVERT(decimal(18,2),REPLACE(Einzelpreis,',','.')) IS NOT NULL
      AND TRY_CONVERT(decimal(18,2),REPLACE(Gesamt,',','.')) IS NOT NULL
      AND ABS(TRY_CONVERT(decimal(18,3),REPLACE(Menge,',','.')) * TRY_CONVERT(decimal(18,2),REPLACE(Einzelpreis,',','.')) - TRY_CONVERT(decimal(18,2),REPLACE(Gesamt,',','.'))) > 0.01
    UNION ALL
    SELECT 'Aufträge', RowID, ISNULL(AuftragID,N''), 'Hinweis', 'Status nicht standardisiert'
    FROM dbo.AuftraegeTest WHERE Status NOT IN (N'Offen',N'Erledigt',N'Storniert')
    UNION ALL
    SELECT 'Aufträge', RowID, ISNULL(AuftragID,N''), 'Hinweis', 'Auftragsdatum fehlt, ist ungültig oder liegt in der Zukunft'
    FROM dbo.AuftraegeTest WHERE TRY_CONVERT(date,Auftragsdatum) IS NULL OR TRY_CONVERT(date,Auftragsdatum) > CAST(GETDATE() AS date)
) q
ORDER BY CASE Schweregrad WHEN 'Fehler' THEN 1 ELSE 2 END, Bereich, RowID;
GO
