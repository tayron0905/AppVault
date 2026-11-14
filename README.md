# AppVault

Responsive Bibliothek für Android-, Windows-, macOS- und Linux-Projekte. GitHub Pages liefert die Website aus; Supabase verwaltet Anmeldung, Projektdaten und Dateien.

## Funktionen

- Anmeldung per E-Mail-Link
- Projekt veröffentlichen, suchen und nach Plattform filtern
- Private Dateispeicherung mit kurzlebigen Download-Links
- Projekt und Datei als Eigentümer löschen
- GitHub Actions Deployment zu GitHub Pages

## Einmalige Einrichtung

### 1. Supabase

1. Erstelle ein Projekt unter [supabase.com](https://supabase.com/).
2. Öffne **SQL Editor**, füge den Inhalt von `supabase/schema.sql` ein und führe ihn aus. Das erstellt Tabelle, private Storage-Bucket und Zugriffspolicies.
3. Unter **Project Settings → API** kopiere die **Project URL** und den **Publishable key** (früher `anon` key). Ein `service_role`- oder Secret-Key gehört niemals in die Website.
4. In **Authentication → URL Configuration** setze die Site URL auf `https://tayron0905.github.io/AppVault/` und füge dieselbe URL zu den Redirect URLs hinzu.

### 2. GitHub Actions Variablen

Die Verbindung ist bereits in `assets/js/config.js` eingetragen. Optional kannst du sie im Repository unter **Settings → Secrets and variables → Actions → Variables** hinterlegen; wenn beide Variablen gesetzt sind, nutzt der Deployment-Workflow diese Werte:

| Name | Wert |
| --- | --- |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable key |

Das sind öffentliche Frontendwerte. Niemals Secret- oder `service_role`-Keys als Variable eintragen. Der Publishable Key ist für Browser-Anwendungen gedacht; Tabellen- und Storage-Zugriffe werden über Supabase Policies begrenzt.

### 3. Pages Deployment

1. In **Settings → Pages** bei **Build and deployment** die Quelle **GitHub Actions** auswählen.
2. In **Actions** den Workflow **Deploy AppVault to GitHub Pages** starten (oder eine Änderung nach `main` pushen).
3. Die Website wird unter `https://tayron0905.github.io/AppVault/` erreichbar, sobald der Workflow erfolgreich abgeschlossen ist.

## Nutzung

Klicke auf **Anmelden**, gib deine E-Mail ein und öffne den zugesandten Link. Danach kannst du ein Projekt samt Datei veröffentlichen. Akzeptiert werden APK, AAB, EXE, MSI, MSIX, DMG, PKG, AppImage, DEB, RPM sowie ZIP/TAR/GZ/7Z bis 100 MB.

Veröffentlichte Projekte sind öffentlich lesbar. Dateien liegen in einem privaten Bucket; zum Download erzeugt Supabase einen nur 60 Sekunden gültigen Link. Angemeldete Eigentümer können eigene Einträge löschen.

## Lokal bearbeiten

Die Site ist statisch und benötigt keinen Build-Schritt. Für lokale Vorschau z. B. `python3 -m http.server` im Projektordner starten und die angezeigte Adresse im Browser öffnen.
