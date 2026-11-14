import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, OWNER_UID } from './config.js';

const $ = (selector) => document.querySelector(selector);
const form = $('#projectForm');
const message = $('#formMessage');
const grid = $('#projectGrid');
const authButton = $('#authButton');
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const allowedExtensions = new Set(['apk','aab','exe','msi','msix','dmg','pkg','appimage','deb','rpm','zip','tar','gz','7z']);
$('#year').textContent = new Date().getFullYear();

let supabase;
let currentUser = null;
let projects = [];

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('is-error', isError);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function renderProjects() {
  if (currentUser?.id !== OWNER_UID) {
    $('#projectCount').textContent = 'Privat';
    return;
  }
  const query = $('#searchInput').value.trim().toLocaleLowerCase('de');
  const platform = $('#platformFilter').value;
  const visible = projects.filter((project) => {
    const matchesText = `${project.name} ${project.description} ${project.platform}`.toLocaleLowerCase('de').includes(query);
    return matchesText && (platform === 'all' || project.platform === platform);
  });
  $('#projectCount').textContent = `${visible.length} ${visible.length === 1 ? 'Projekt' : 'Projekte'}`;
  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">◇</div><h3>${projects.length ? 'Keine Treffer.' : 'Noch keine Projekte vorhanden.'}</h3><p>${projects.length ? 'Passe Suche oder Plattformfilter an.' : 'Melde dich an und veröffentliche das erste Projekt.'}</p></div>`;
    return;
  }
  grid.innerHTML = visible.map((project) => `
    <article class="project-card">
      <span class="platform-pill">${escapeHtml(project.platform)}</span>
      <h3>${escapeHtml(project.name)}</h3>
      <p>${escapeHtml(project.description || 'Keine Beschreibung angegeben.')}</p>
      <div class="project-meta"><span>${project.version ? `Version ${escapeHtml(project.version)}` : 'Version nicht angegeben'}</span><span>${escapeHtml(project.file_name || 'Datei')}</span></div>
      <div class="project-actions"><button class="button button-primary download-button" data-id="${escapeHtml(project.id)}" type="button">Herunterladen</button>${currentUser?.id === project.owner_id ? `<button class="button button-quiet delete-button" data-id="${escapeHtml(project.id)}" type="button" aria-label="${escapeHtml(project.name)} löschen">Löschen</button>` : ''}</div>
    </article>`).join('');
}

async function loadProjects() {
  const { data, error } = await supabase.from('projects').select('id,owner_id,name,description,version,platform,storage_path,file_name,created_at').eq('published', true).order('created_at', { ascending: false });
  if (error) throw error;
  projects = data || [];
  renderProjects();
}

function updateAuthUI() {
  const isOwner = currentUser?.id === OWNER_UID;
  authButton.textContent = currentUser ? 'Abmelden' : 'Anmelden';
  form.querySelectorAll('input,select,textarea,button[type="submit"]').forEach((control) => { control.disabled = !isOwner; });
  if (!currentUser) {
    setMessage('Bitte mit dem freigeschalteten Supabase-Konto anmelden.');
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">◇</div><h3>Private Bibliothek</h3><p>Melde dich mit dem freigeschalteten Konto an, um deine Projekte zu sehen.</p></div>';
  } else if (!isOwner) {
    setMessage('Dieses Supabase-Konto ist für AppVault nicht freigeschaltet.', true);
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">◇</div><h3>Zugriff nicht freigeschaltet</h3><p>Verwende das für AppVault hinterlegte Supabase-Konto.</p></div>';
  } else {
    setMessage(`Angemeldet als ${currentUser.email}`);
  }
  renderProjects();
}

authButton.addEventListener('click', async () => {
  if (!supabase) return;
  if (currentUser) {
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message, true);
    return;
  }
  const email = window.prompt('E-Mail-Adresse für den Anmeldelink:');
  if (!email?.trim()) return;
  authButton.disabled = true;
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.href.split('#')[0], shouldCreateUser: false } });
  authButton.disabled = false;
  setMessage(error ? error.message : 'Anmeldelink versendet. Bitte prüfe dein E-Mail-Postfach.');
  if (error) message.classList.add('is-error');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (currentUser?.id !== OWNER_UID) return setMessage('Nur das freigeschaltete Supabase-Konto kann Projekte veröffentlichen.', true);
  const data = new FormData(form);
  const file = data.get('file');
  const extension = file.name.split('.').pop().toLowerCase();
  if (!file || !file.size) return setMessage('Bitte wähle eine Datei aus.', true);
  if (file.size > MAX_FILE_SIZE) return setMessage('Die Datei ist größer als 100 MB.', true);
  if (!allowedExtensions.has(extension)) return setMessage('Dieser Dateityp wird nicht unterstützt. Erlaubt sind APK, EXE, DMG, AppImage und gängige Archive.', true);

  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  setMessage('Datei wird sicher hochgeladen …');
  const projectId = crypto.randomUUID();
  const storagePath = `${currentUser.id}/${projectId}/${file.name.replace(/[\\/]/g, '_')}`;
  const { error: uploadError } = await supabase.storage.from('app-files').upload(storagePath, file, { upsert: false });
  if (uploadError) {
    setMessage(uploadError.message, true);
    submit.disabled = false;
    return;
  }
  const { error } = await supabase.from('projects').insert({
    id: projectId,
    owner_id: currentUser.id,
    name: data.get('name').trim(),
    version: data.get('version').trim(),
    platform: data.get('platform'),
    description: data.get('description').trim(),
    storage_path: storagePath,
    file_name: file.name,
    file_size: file.size,
    published: true,
  });
  if (error) {
    await supabase.storage.from('app-files').remove([storagePath]);
    setMessage(error.message, true);
  } else {
    form.reset();
    setMessage('Projekt veröffentlicht.');
    await loadProjects();
  }
  submit.disabled = false;
});

grid.addEventListener('click', async (event) => {
  const downloadButton = event.target.closest('.download-button');
  const deleteButton = event.target.closest('.delete-button');
  if (downloadButton) {
    const project = projects.find((item) => item.id === downloadButton.dataset.id);
    if (!project) return;
    downloadButton.disabled = true;
    const { data, error } = await supabase.storage.from('app-files').createSignedUrl(project.storage_path, 60, { download: project.file_name });
    downloadButton.disabled = false;
    if (error) return window.alert(`Download fehlgeschlagen: ${error.message}`);
    window.location.assign(data.signedUrl);
  }
  if (deleteButton && currentUser) {
    const project = projects.find((item) => item.id === deleteButton.dataset.id);
    if (!project || !window.confirm(`„${project.name}“ und die zugehörige Datei löschen?`)) return;
    deleteButton.disabled = true;
    const { error: rowError } = await supabase.from('projects').delete().eq('id', project.id);
    if (rowError) return window.alert(`Löschen fehlgeschlagen: ${rowError.message}`);
    const { error: fileError } = await supabase.storage.from('app-files').remove([project.storage_path]);
    if (fileError) window.alert(`Projekt entfernt, Datei konnte nicht entfernt werden: ${fileError.message}`);
    await loadProjects();
  }
});

$('#searchInput').addEventListener('input', renderProjects);
$('#platformFilter').addEventListener('change', renderProjects);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  grid.innerHTML = '<div class="empty-state"><div class="empty-icon">◇</div><h3>Supabase noch nicht konfiguriert.</h3><p>Trage SUPABASE_URL und SUPABASE_PUBLISHABLE_KEY als GitHub Actions Repository-Variablen ein und starte den Pages-Workflow erneut.</p></div>';
  $('#projectCount').textContent = 'Nicht verbunden';
  setMessage('Die Datenbankverbindung ist noch nicht eingerichtet.');
  authButton.disabled = true;
  form.querySelectorAll('input,select,textarea,button[type="submit"]').forEach((control) => { control.disabled = true; });
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
    if (currentUser?.id === OWNER_UID) loadProjects().catch((error) => setMessage(error.message, true));
  });
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user || null;
  updateAuthUI();
  try {
    if (currentUser?.id === OWNER_UID) await loadProjects();
  }
  catch (error) {
    grid.innerHTML = `<div class="empty-state"><h3>Projekte konnten nicht geladen werden.</h3><p>${escapeHtml(error.message)}</p></div>`;
    $('#projectCount').textContent = 'Fehler';
  }
}
