// Portfolio Showcase — Side Panel Logic

const $ = id => document.getElementById(id);

let portfolios = [];
let editingPortfolio = null;

// ─── Init ──────────────────────────────────────────────────────────

async function init() {
  setupEvents();
  loadPortfolios();
}

// ─── Portfolios ────────────────────────────────────────────────────

function loadPortfolios() {
  chrome.runtime.sendMessage({ type: 'GET_PORTFOLIOS' }, (resp) => {
    if (resp?.success) {
      portfolios = resp.portfolios;
      renderPortfolioList();
    }
  });
}

function renderPortfolioList() {
  const list = $('portfolio-list');
  $('portfolio-count').textContent = `${portfolios.length} Portfolios`;
  
  if (portfolios.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        <div>Belum ada portfolio. Klik "+ Baru" untuk mulai.</div>
      </div>
    `;
    return;
  }
  
  list.innerHTML = portfolios.map(p => `
    <div class="portfolio-card" data-id="${p.id}">
      <div class="portfolio-header">
        <h3 class="portfolio-title">${esc(p.title || 'Untitled')}</h3>
        <span class="portfolio-count">${p.photoCount || 0} foto</span>
      </div>
      ${p.description ? `<div class="portfolio-desc">${esc(p.description)}</div>` : ''}
      <div class="portfolio-meta">${p.brand || 'Ahmad Asri Photography'} &middot; ${formatDate(p.createdAt)}</div>
    </div>
  `).join('');
  
  list.querySelectorAll('.portfolio-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      editPortfolio(id);
    });
  });
}

// ─── Edit Portfolio ────────────────────────────────────────────────

function editPortfolio(id) {
  chrome.runtime.sendMessage({ type: 'GET_PORTFOLIO', id }, (resp) => {
    if (resp?.success && resp.portfolio) {
      editingPortfolio = resp.portfolio;
      
      $('edit-title').value = editingPortfolio.title || '';
      $('edit-desc').value = editingPortfolio.description || '';
      $('edit-brand').value = editingPortfolio.brand || 'Ahmad Asri Photography';
      
      renderPhotoGrid();
      showView('edit');
    }
  });
}

function renderPhotoGrid() {
  const grid = $('photo-grid');
  const photos = editingPortfolio?.photos || [];
  
  $('photo-count').textContent = photos.length;
  
  if (photos.length === 0) {
    grid.innerHTML = '';
    return;
  }
  
  grid.innerHTML = photos.map((p, i) => `
    <div class="photo-thumb">
      <img src="${p.base64}" alt="${esc(p.caption || '')}">
      <button class="photo-remove" data-index="${i}">&times;</button>
    </div>
  `).join('');
  
  grid.querySelectorAll('.photo-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      editingPortfolio.photos.splice(idx, 1);
      renderPhotoGrid();
    });
  });
}

function addPhotos(files) {
  if (!editingPortfolio) return;
  if (!editingPortfolio.photos) editingPortfolio.photos = [];
  
  const maxFiles = 20;
  const filesArr = Array.from(files).slice(0, maxFiles - editingPortfolio.photos.length);
  
  let loaded = 0;
  
  filesArr.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      // Resize to max 1200px width
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1200;
        let w = img.width;
        let h = img.height;
        
        if (w > maxW) {
          h = (h / w) * maxW;
          w = maxW;
        }
        
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        
        editingPortfolio.photos.push({
          base64: canvas.toDataURL('image/jpeg', 0.85),
          caption: '',
          name: file.name
        });
        
        loaded++;
        if (loaded === filesArr.length) {
          renderPhotoGrid();
          toast(`${filesArr.length} foto ditambahkan`);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Save/Export ──────────────────────────────────────────────────

function savePortfolio() {
  if (!editingPortfolio) return;
  
  editingPortfolio.title = $('edit-title').value || 'Untitled Portfolio';
  editingPortfolio.description = $('edit-desc').value;
  editingPortfolio.brand = $('edit-brand').value;
  editingPortfolio.updatedAt = new Date().toISOString();
  
  chrome.runtime.sendMessage({ type: 'SAVE_PORTFOLIO', portfolio: editingPortfolio }, (resp) => {
    if (resp?.success) {
      toast('Portfolio disimpan');
      loadPortfolios();
    }
  });
}

function exportHTML() {
  if (!editingPortfolio) return;
  
  chrome.runtime.sendMessage({ 
    type: 'GENERATE_HTML', 
    id: editingPortfolio.id 
  }, (resp) => {
    if (resp?.success && resp.html) {
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_HTML',
        html: resp.html
      }, (r) => {
        toast('HTML downloaded');
      });
    }
  });
}

function deletePortfolio() {
  if (!editingPortfolio) return;
  if (!confirm('Hapus portfolio ini?')) return;
  
  chrome.runtime.sendMessage({ type: 'DELETE_PORTFOLIO', id: editingPortfolio.id }, () => {
    editingPortfolio = null;
    showView('list');
    loadPortfolios();
    toast('Portfolio dihapus');
  });
}

// ─── View Management ──────────────────────────────────────────────

function showView(view) {
  $('view-list').style.display = view === 'list' ? 'block' : 'none';
  $('view-edit').style.display = view === 'edit' ? 'block' : 'none';
}

// ─── UI Helpers ────────────────────────────────────────────────────

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Events ────────────────────────────────────────────────────────

function setupEvents() {
  // New portfolio
  $('btn-new').addEventListener('click', () => {
    editingPortfolio = {
      id: `portfolio_${Date.now()}`,
      title: '',
      description: '',
      brand: 'Ahmad Asri Photography',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    $('edit-title').value = '';
    $('edit-desc').value = '';
    $('edit-brand').value = 'Ahmad Asri Photography';
    renderPhotoGrid();
    showView('edit');
  });
  
  // Back
  $('btn-back').addEventListener('click', () => {
    showView('list');
    loadPortfolios();
  });
  
  // Photo upload
  $('drop-zone').addEventListener('click', () => $('photo-input').click());
  $('photo-input').addEventListener('change', (e) => {
    if (e.target.files.length) addPhotos(e.target.files);
  });
  
  // Drag & drop
  $('drop-zone').addEventListener('dragover', (e) => {
    e.preventDefault();
    $('drop-zone').classList.add('dragover');
  });
  $('drop-zone').addEventListener('dragleave', () => {
    $('drop-zone').classList.remove('dragover');
  });
  $('drop-zone').addEventListener('drop', (e) => {
    e.preventDefault();
    $('drop-zone').classList.remove('dragover');
    if (e.dataTransfer.files.length) addPhotos(e.dataTransfer.files);
  });
  
  // Save
  $('btn-save').addEventListener('click', savePortfolio);
  
  // Export
  $('btn-export-html').addEventListener('click', exportHTML);
  
  // Delete
  $('btn-delete').addEventListener('click', deletePortfolio);
}

// ─── Start ─────────────────────────────────────────────────────────

init();
