# Pixelsort Studio

Browser-Bildwerkzeug mit einer hellen, monochromen Oberfläche, Monospace-Schrift, feinen Linien und eckigen Bedienelementen. Gestalterische Referenz: https://www.tooooools.app/. Die Oberfläche und Bildverarbeitung sind ohne Framework und ohne externe Laufzeitabhängigkeiten implementiert. Die vorherige Oberfläche ist unter `code-studio.html` weiter verfügbar, einschließlich ihrer Sortierverfahren, Animation und Sandbox-Ansicht.

## Start

Im Projektordner `python3 -m http.server 4173` ausführen und http://localhost:4173 öffnen. Die App funktioniert auf GitHub Pages ohne Build-Schritt. JavaScript-Module und Worker benötigen einen HTTP-Server; direktes Öffnen über `file://` ist ungeeignet.

## Funktionen

- Pixelsort: Helligkeit, Farbton, Sättigung und drei Farbkanäle; horizontal, vertikal und zwei Diagonalrichtungen; Schwellenfenster, Außenbereiche, zufällige Segmente, ganze Linien; Segmentlänge, Sortierreihenfolge, reproduzierbarer Zufallswert, Effektstärke.
- Dithering mit Bayer, Floyd–Steinberg und Zufallsrauschen; zwei bis acht Graustufen.
- Punktraster, RGB-Kanalversatz und frei wählbarer Duoton.
- Bildvorbereitung: Helligkeit, Kontrast und Sättigung.
- Sechs Ausgangspunkte, Zufallseinstellungen, Live-Vorschau, manuelles Anwenden, 60 Einstellungen in der Undo/Redo-Historie.
- Original, Ergebnis und verschiebbarer Vergleich; Ansicht einpassen oder 100 Prozent.
- Upload und Drag-and-drop; PNG, JPG, WebP, AVIF und GIF, soweit der Browser diese decodiert. GIF wird als Einzelbild verarbeitet.
- PNG/JPG/WebP-Export in der gewählten Arbeitsauflösung; JPG auf Weiß, Transparenz bei PNG/WebP.
- JSON-Rezepte speichern/laden, mit Format- und Wertevalidierung.
- Hintergrundberechnung im Web Worker; veraltete Berechnungen werden abgebrochen.
- Desktop- und mobile Oberfläche; Tastaturkürzel und sichtbarer Tastaturfokus.

## Grenzen

Standard-Arbeitsauflösung: maximal 1200 Pixel Kantenlänge. Optional 2400 Pixel oder Originalgröße bis 16 Megapixel. Größere Quellen werden proportional verkleinert und ihre Quellgröße wird angezeigt. Der Export entspricht dieser Arbeitsauflösung. Dateigröße maximal 60 MB. Sehr große decodierte Bilder und 16-MP-Berechnungen benötigen entsprechend Arbeitsspeicher. Die Bildverarbeitung bleibt lokal; es werden keine Bilder oder Einstellungen an einen Server gesendet. Effekte werden aus dem Original mit aktueller Bildvorbereitung berechnet und nicht als Ebenen gestapelt. Undo/Redo betrifft Einstellungen; Bildwechsel sind nicht Teil der Historie.

## Prüfung

`npm test` beziehungsweise `node --test tests/*.test.js` prüft Sortierung, Schwellen, diagonale/vertikale Verarbeitung, Transparenz, Stärke null, reproduzierbare Zufallswerte, Dithering und Rezeptvalidierung.

Browserprüfung und Designabgleich: [design/verification.md](design/verification.md). Entwurf: [design/concept.png](design/concept.png). Das Beispielbild wird deterministisch im Canvas erzeugt und kann mit denselben Parametern reproduziert werden.

## Veröffentlichung und Synchronisation

Lokaler Arbeitsbranch: `redesign/studio`. GitHub wurde nicht verändert. Eine automatische Freigabeprüfung lehnte das Anlegen eines externen Branches ohne ausdrückliche Zustimmung ab. Nach Freigabe können Branch und Pull Request erstellt werden. Der lokale Ordner besitzt keine bestätigte Google-Drive-Anbindung; es wurde keine zusätzliche Drive-Kopie angelegt. `/Volumes/Extra 5` war nicht lesbar.
