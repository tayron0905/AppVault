// AppVault frontend scaffold. Supabase is connected in the next setup step.
const form = document.querySelector('#projectForm');
const message = document.querySelector('#formMessage');
document.querySelector('#year').textContent = new Date().getFullYear();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  message.textContent = 'Projektformular bereit. Verbinde zuerst Supabase, damit Projekte dauerhaft gespeichert werden können.';
});

const search = document.querySelector('#searchInput');
const platform = document.querySelector('#platformFilter');
function updateEmptyState() {
  const grid = document.querySelector('#projectGrid');
  grid.innerHTML = `<div class="empty-state"><div class="empty-icon">◇</div><h3>Noch keine Projekte vorhanden.</h3><p>Nach der Supabase-Verbindung werden hier deine veröffentlichten Projekte angezeigt.</p></div>`;
  document.querySelector('#projectCount').textContent = '0 Projekte';
}
search.addEventListener('input', updateEmptyState);
platform.addEventListener('change', updateEmptyState);

// Supabase client configuration will be added after the project is created.
// Never put a Supabase service_role/secret key in frontend code.
