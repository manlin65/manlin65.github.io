MAMA QUIZLAB – EIGENSTÄNDIGE PRÜFUNGSSEITE

Der Ordner „pruefung“ ist eine vollständige, eigenständige statische Website. Er enthält alle benötigten HTML-, CSS-, JavaScript- und Logo-Dateien. Es gibt keine Abhängigkeit vom Stylesheet oder JavaScript des Wissensarchivs.

Einbau als separate Unterseite:
Den Ordner „pruefung“ unverändert in den Ordner „KI-Wissensarchiv“ im GitHub-Repository hochladen. Keine andere Datei im Wissensarchiv muss dafür geändert werden.

URL nach Veröffentlichung:
https://www.mlinner-software.de/KI-Wissensarchiv/pruefung/

Funktionen:
- Drei Reiter: „Alle Fragen“, „Simulation“ und „Prüfungsfragen Startplatz“
- 674 bereinigte Fragen aus dem Wissensarchiv und dem Marc-Fragenpool
- Wortgleiche und sehr ähnliche Fragen zusammengeführt
- Zufällige Fragenreihenfolge und gemischte Antwortoptionen
- 40 Fragen und 30 Minuten als Standard; Umfang, Woche und Zeitlimit einstellbar
- Vor- und Zurückblättern; Lösungen und Erklärungen erst am Ende
- Einfach- und Mehrfachauswahl
- Falsche Fragen wiederholen; lokale Ergebnishistorie zurücksetzen
- Separater Pool mit 122 Fragen insgesamt: 72 eindeutige offizielle Startplatz-Prüfungsfragen aus Woche 1–5 und 7 sowie 50 ergänzende Übungsfragen aus Marcs Woche-6-Quiz
- Die Woche-6-Fragen sind nicht als offizielle Startplatz-Prüfungsfragen bestätigt und werden im Reiter entsprechend gekennzeichnet
- Startplatz-Simulation mit zufälliger Auswahl, Wochenfilter, Zeitlimit, Vor-/Zurückblättern und Abbruch
- Lösungen und Erklärungen der Startplatz-Fragen erst nach Abgabe; falsche Auswahl rot, richtige Antwort grün
- Große orange-cyanfarbene Mama-Quizlab-Wortmarke mit KI-Kopf oben; dunkles Hintergrundbild mit warmen orangefarbenen KI-Schaltkreisen an den Außenrändern; Fragenbereich bleibt ruhig und gut lesbar

Fragenbank:
407 Fragen aus Mannis Archiv und 303 von Marc ergeben nach dem Abgleich 640 unterschiedliche Fragegruppen. 34 bislang nur im Startplatz-Fragenpool vorhandene Fragen aus Woche 7 wurden ergänzt; damit enthält der allgemeine Katalog jetzt 674 Fragegruppen. Eine wortgleiche doppelte Prüfungsfrage wurde entfernt. Bei zusammengeführten Gruppen wählt die Simulation zufällig eine der vorhandenen Originalformulierungen.

Die offiziellen Startplatz-Fragen liegen getrennt in „startplatz-fragen.js“ und werden durch „startplatz.js“ ausgewertet. Die ursprünglichen Quiz-Kennungen bleiben sichtbar; intern sind Fragen auch bei wiederholter Kennung eindeutig gespeichert.
