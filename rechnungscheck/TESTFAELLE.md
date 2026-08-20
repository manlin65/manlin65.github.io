# Testfälle - erwartete Ergebnisse

Die Anwendung soll folgende Auffälligkeiten erkennen:

1. **Rechnung_01_Alpha_Bueroservice.pdf** - KORREKT
2. **Rechnung_02_Beta_IT_Service.pdf** - FEHLER: Gesamtbetrag um 20,00 EUR zu hoch
3. **Rechnung_03_Gamma_Technik.pdf** - FEHLER: Rechnungsnummer fehlt
4. **Rechnung_04_Delta_Consulting.pdf** - FEHLER: MwSt.-Betrag passt nicht zu 19 Prozent
5. **Rechnung_05_Epsilon_Logistik.pdf** - HINWEIS: Zahlungsziel überschritten
6. **Rechnung_06_Alpha_Dublette.pdf** - FEHLER: Dublette zu Rechnung 01
7. **Rechnung_07_Zeta_Maschinenbau.pdf** - FEHLER: Rechnungsdatum fehlt
8. **Rechnung_08_Eta_Kreativ.pdf** - KORREKT
9. **Rechnung_09_Theta_Catering.pdf** - KORREKT
10. **Rechnung_10_Iota_Software.pdf** - KORREKT

Hinweis: Die Dublette wird erkannt, wenn Rechnung 01 und Rechnung 06 gemeinsam bzw. nacheinander eingelesen wurden.