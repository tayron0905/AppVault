# AppVault

AppVault ist eine responsive Projekt- und App-Bibliothek für Android, Windows, macOS und Linux.

## Enthalten
- Responsive Website mit Projektübersicht und Plattformfiltern
- Formular-Oberfläche für Projektnamen, Version, Plattform und Beschreibung
- GitHub Actions Workflow für automatisches GitHub-Pages-Deployment
- Vorbereitetes Supabase-Datenbankschema unter `supabase/schema.sql`

## GitHub Pages aktivieren
1. Repository auf GitHub öffnen.
2. Unter **Settings → Pages** als Build-Quelle **GitHub Actions** auswählen.
3. Den Workflow `Deploy AppVault to GitHub Pages` nach einem Push auf `main` laufen lassen.

## Supabase verbinden
1. Supabase-Projekt erstellen.
2. `supabase/schema.sql` im Supabase SQL Editor ausführen.
3. Einen **privaten** Storage-Bucket namens `app-files` erstellen.
4. Anschließend Supabase Project URL und Publishable Key in die Frontend-Konfiguration eintragen, sobald die Verbindung eingerichtet wird.

**Wichtig:** Niemals den `service_role`- oder Secret-Key in dieses Repository oder in Browser-Code eintragen. Die Upload- und Download-Regeln müssen über Row Level Security und Storage Policies abgesichert werden.

## Aktueller Stand
Dies ist das GitHub-Upload-Grundgerüst. Die Supabase-Anbindung und echte Datei-Uploads werden im nächsten Schritt ergänzt. Das Formular speichert derzeit noch keine Daten.
