# manliNova – Vorschau, 9. November 2026

Noch nicht veröffentlicht. Statische Erweiterung des vorhandenen Website-Stacks;
keine neuen Laufzeitabhängigkeiten, kein Backend und kein gemeinsamer Login.

## Änderungen

- DE `/manlinova/`, EN `/en/manlinova/`, gegenseitiger Sprachwechsel,
  Canonical-/hreflang-Verweise und Sitemap-Einträge.
- Dachmarke mit Original-Logo, Claim, Markenfarben und lokalem Space Grotesk.
- Zwei gleichwertige Produktbereiche mit Original-Logos, Zielgruppe, Nutzen,
  jeweils drei belegten Einsatzmöglichkeiten, Status und bestehenden Zieladressen.
- Gemeinsamer Kontakt, Rückweg zur jeweiligen Homepage, Impressum, Datenschutz.
- DE-Homepage: bestehende KI-Potenzial-/Beschaffungskacheln eindeutig zugeordnet;
  bestehende Dialoge beibehalten, Beschreibungen abgeglichen und Produktübersicht verlinkt.
- DE-/EN-Homepage: manliNova in der Navigation und als sichtbarer Link im Projektabschnitt, auch bei ausgeblendeter Mobilnavigation. Die EN-Homepage hat auf der
  aktuellen Basis andere Projektkacheln und keine entsprechenden Produktdialoge.

## Quellen

- Homepage: frisch geklontes Remote-main,
  `46a74f7fedc9e7a16b4c2b55b4a52f0a8131f76c`.
  Root-Anleitungen `START-HIER.txt`, `README_EINBAU.txt`, `README_VEREINT.txt` gelesen;
  keine AGENTS.md in diesem Website-Repository gefunden.
- SELVAMO: `03bd88281ecd40da2611b12bd542f813f0e0fa23`, insbesondere
  `AGENTS.md`, `README.md`, `STATUS.md`, Brandbook-PDF,
  `01_MARKENARCHITEKTUR.md` und Original-Designtokens.
  Implementierter Stand und bestätigter Online-Stand sind unterschiedlich;
  daher keine Behauptung, die interne Agenten-Beta sei bereits online verfügbar.
- Quoventra: vorhandene Sites-Produktquelle
  `appgprj_6af07c5164408191b7ba62fca52ef79e`, Commit
  `9409f2dd04cd8cba3a892e7f670d1d90eb4ea563`;
  `public/downloads/Quoventra-AI-Produktuebergabe.md`, Original-SVG und
  mitgelieferte lokale Inter-Schrift. Stimmen mit dem Nutzerbriefing überein.
- Logos unverändert als SVG-Quelldateien abgelegt; im HTML inline eingebunden,
  damit lokale Originalschriften greifen. Keine Verzerrung oder Schatten.
- Fontlizenzen unter `assets/`; manliNova-Logo mit Schutzraum mindestens
  einer halben Symbolhöhe. Keine Markenrechtsfreigabe behauptet.

## Vorschau

Im Repository-Hauptverzeichnis:

```sh
python -m http.server 8080
```

Dann `http://localhost:8080/manlinova/` öffnen.
Ein einfacher Dateidoppelklick unterstützt die absoluten Websitepfade nicht.

## Prüfung

- Headless Chromium: DE/EN bei 1440, 390 und 320 px.
- Zwei Spalten auf Desktop, eine auf Mobilgeräten; kein horizontaler Überlauf.
- Alle Logos geladen; sämtliche internen Links HTTP 200.
- Navigation von Homepage zur Produktseite und Sprachwechsel DE → EN → DE geprüft.
- Bestehende DE-Dialoge öffnen und schließen per Escape.
- Skip-Link per Tab/Enter, sichtbare Fokusmarkierung; native Links bleiben per
  Tastatur erreichbar. Keine neue eigene Dialog- oder JavaScript-Steuerung.
- Textfarbpaare: Navy/Weiß 13,55:1; Ice/Dark 11,53:1;
  Weiß/Dark 17,56:1; Türkis/Dark 8,80:1.
- Keine API-, KI-, Bestell- oder schreibenden Anwendungstests.

## Offene Punkte

- Live-HTTP-Prüfung der Render-/Quoventra-Zieladressen durch Netzwerkfreigaben
  dieser Umgebung blockiert. Originaldateien wurden über die vorhandene
  Produktquelle übernommen; es gibt keine externe Logo-/Font-Abhängigkeit.
- Bereits auf Remote-main hat die EN-Homepage bei 390 px eine Dokumentbreite von 456 px (horizontaler Überlauf). Die neue EN-Produktseite ist davon nicht betroffen; der zusätzliche Projektlink ist mobil geprüft. Bestehende Homepage-Gestaltung wurde beibehalten.
- SELVAMO-Liveversion unabhängig vom Repository-Stand vor Veröffentlichung
  gegenprüfen; geschützter Zugang bleibt unverändert.
- Visuelle/inhaltsbezogene Freigabe der Vorschau durch den Auftraggeber.
- Noch kein Push, Merge, Deployment oder Eingriff in die bestehenden Anwendungen.
