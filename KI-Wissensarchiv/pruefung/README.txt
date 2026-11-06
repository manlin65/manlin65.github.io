MAMA QUIZLAB – EIGENSTÄNDIGE PRÜFUNGSSEITE

Der Ordner „pruefung“ ist eine vollständige, eigenständige statische Website. Er enthält alle benötigten HTML-, CSS-, JavaScript- und Logo-Dateien. Es gibt keine Abhängigkeit vom Stylesheet oder JavaScript des Wissensarchivs.

Einbau als separate Unterseite:
Den Ordner „pruefung“ unverändert in den Ordner „KI-Wissensarchiv“ im GitHub-Repository hochladen. Keine andere Datei im Wissensarchiv muss dafür geändert werden.

URL nach Veröffentlichung:
https://www.mlinner-software.de/KI-Wissensarchiv/pruefung/

Funktionen:
- Drei Reiter: „Alle Fragen“, „Simulation“ und „Prüfungsfragen Startplatz“
- 640 bereinigte Fragen aus dem Wissensarchiv und dem Marc-Fragenpool
- Wortgleiche und sehr ähnliche Fragen zusammengeführt
- Zufällige Fragenreihenfolge und gemischte Antwortoptionen
- 40 Fragen und 30 Minuten als Standard; Umfang, Woche und Zeitlimit einstellbar
- Vor- und Zurückblättern; Lösungen und Erklärungen erst am Ende
- Einfach- und Mehrfachauswahl
- Falsche Fragen wiederholen; lokale Ergebnishistorie zurücksetzen
- Separater Pool mit 55 offiziellen Startplatz-Prüfungsfragen
- Startplatz-Simulation mit zufälliger Auswahl, Wochenfilter, Zeitlimit, Vor-/Zurückblättern und Abbruch
- Lösungen und Erklärungen der Startplatz-Fragen erst nach Abgabe; falsche Auswahl rot, richtige Antwort grün
- Große orange-cyanfarbene Mama-Quizlab-Wortmarke mit KI-Kopf oben; dunkles Hintergrundbild mit warmen orangefarbenen KI-Schaltkreisen an den Außenrändern; Fragenbereich bleibt ruhig und gut lesbar

Fragenbank:
407 Fragen aus Mannis Archiv und 303 von Marc ergeben nach dem Abgleich 640 unterschiedliche Fragegruppen. Bei zusammengeführten Gruppen wählt die Simulation zufällig eine der vorhandenen Originalformulierungen.

Die offiziellen Startplatz-Fragen liegen getrennt in „startplatz-fragen.js“ und werden durch „startplatz.js“ ausgewertet. Die ursprünglichen Quiz-Kennungen bleiben sichtbar; intern sind Fragen auch bei wiederholter Kennung eindeutig gespeichert.
