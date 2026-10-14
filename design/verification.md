# Prüfung vom 14.10.2026

## Designabgleich

Referenz: Tooooools.app, Startseite und geöffneter Editor direkt im Ego Browser angesehen. Konzept: `concept.png`, mit dem integrierten Imagegen erzeugt. Konzept und gerenderte Umsetzung wurden mit `view_image` visuell geprüft. Desktop: 1440 × 900; Mobil: 390 × 844, außerdem die scrollbaren Einstellungen. Kein horizontaler Seitenüberlauf im mobilen Dokument.

| Prüfpunkt | Umsetzung und Ergebnis |
| --- | --- |
| Aufbau | Drei Bereiche: Werkzeuge, Parameter, große Vorschau. Export dauerhaft erreichbar auf Desktop. |
| Palette | Helles #f8f7f4, Anthrazit #303030, graue Trennlinien. Orange als kleiner Markenakzent und im Beispielbild. Keine UI-Verläufe. |
| Schrift | Monospace für Navigation, Regler, Beschriftungen und Aktionen; bewusst kleine Editor-Typografie nach der direkten Referenz. |
| Komponenten | Eckige Schaltflächen, Linienregler, kompakte Dropdowns. Aktives Werkzeug dunkel, gewählte Ansicht unterstrichen. |
| Bildfläche | Originales Canvas-Bild, proportionales Einpassen, separate Vergleichsebene. Exporte bleiben frei von Vergleichsmarkierungen. |
| Mobil | Horizontale Werkzeugauswahl, Vorschau vor Einstellungen, zwei Spalten für Regler. Export am Ende der Einstellungen. Eine zunächst überlagernde mobile Exportleiste wurde entfernt. |
| Texte | Werkzeugnamen, Upload, Parameter und Export entsprechen der festgelegten Informationsstruktur. Zusätzliche Hinweise erklären Auflösung, Formate und echte Beschränkungen. |

Das generierte Konzept dient als gestalterische Richtung. Bewusste Abweichungen: schmalere Navigation und Parameterleiste nach der direkten Tooooools-Referenz; kompaktere Typografie; globale Kopfzeile; zusätzliche funktionale Parameter; mathematisch erzeugtes, reproduzierbares Beispielbild statt des generierten Bildmotivs; mobile Anordnung. Die Umsetzung wurde gegen Referenz und Konzept geprüft. Es wird keine pixelidentische Umsetzung des generierten Entwurfs behauptet. Konzeptauflösung 1586 × 1024 einschließlich gezeichneter Browserleiste; Browserprüfung bei 1440 × 900 ohne Browserleiste, daher kein identischer nativer Ausschnitt.

## Funktion

Sieben automatisierte Tests bestanden. Zusätzlich im Ego Browser geprüft:

- Initiales Beispielbild und Hintergrundberechnung.
- Alle fünf Werkzeuge und Presets.
- Originalvergleich auf 28 Prozent; Exportcanvas bleibt 1000 × 1000 Pixel groß.
- PNG-Download gespeichert, visuell geprüft und wieder hochgeladen.
- JPG- und WebP-Downloads erfolgreich gespeichert.
- Einstellung rückgängig und wiederholen.
- JSON-Rezept importiert und Kanalversatz 35 bestätigt; ungültiges Rezept mit negativem Seed wird abgewiesen.
- Desktop-Darstellung und mobile Parameterbedienung; kein horizontaler Dokumentüberlauf.

Nicht empirisch geprüft: maximale 16-MP-Dateien, AVIF-/GIF-Kompatibilität jedes Browsers, echte mobile Touchgeräte. Die bestehenden Funktionen des erhaltenen Code-Studios wurden nicht vollständig erneut geprüft.

## Übergabe

Quellcode lokal fertig. Kein Push, kein Pull Request, kein Deployment: automatische Freigabeprüfung lehnte das Anlegen eines GitHub-Branches ohne ausdrückliche Zustimmung ab. Keine bestätigte Google-Drive-Verknüpfung des konkreten Projektordners. Keine zusätzliche Drive-Kopie erstellt.
