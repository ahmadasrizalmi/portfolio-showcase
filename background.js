// Portfolio Showcase — Background Service Worker

// ─── Portfolio Management ────────────────────────────────────────

async function getPortfolios() {
  const data = await chrome.storage.local.get('portfolios');
  return data.portfolios || [];
}

async function savePortfolios(portfolios) {
  await chrome.storage.local.set({ portfolios });
}

async function savePortfolio(portfolio) {
  const portfolios = await getPortfolios();
  const existing = portfolios.findIndex(p => p.id === portfolio.id);
  if (existing >= 0) {
    portfolios[existing] = portfolio;
  } else {
    portfolios.unshift(portfolio);
  }
  await savePortfolios(portfolios);
}

async function deletePortfolio(id) {
  const portfolios = await getPortfolios();
  const filtered = portfolios.filter(p => p.id !== id);
  await savePortfolios(filtered);
}

// ─── HTML Generator ──────────────────────────────────────────────

function generatePortfolioHTML(portfolio) {
  const { title, description, photos, brand, createdAt } = portfolio;
  
  const photoHTML = photos.map((p, i) => `
    <div class="photo-item" data-index="${i}">
      <img src="${p.base64}" alt="${esc(p.caption || title + ' ' + (i+1))}" loading="lazy">
      ${p.caption ? `<div class="photo-caption">${esc(p.caption)}</div>` : ''}
    </div>
  `).join('\n');
  
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description || title + ' - Interior Photography Portfolio')}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      background: #F2F2F7;
      color: #1D1D1F;
      -webkit-font-smoothing: antialiased;
    }
    
    .hero {
      padding: 60px 20px 40px;
      text-align: center;
      background: white;
      border-bottom: 0.5px solid #E5E5EA;
    }
    
    .hero-title {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    
    .hero-desc {
      font-size: 16px;
      color: #86868B;
      max-width: 480px;
      margin: 0 auto 16px;
      line-height: 1.5;
    }
    
    .hero-meta {
      font-size: 13px;
      color: #86868B;
    }
    
    .gallery {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    
    .photo-item {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      background: white;
      border: 0.5px solid #E5E5EA;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .photo-item:hover { transform: scale(1.02); }
    
    .photo-item img {
      width: 100%;
      height: 240px;
      object-fit: cover;
      display: block;
    }
    
    .photo-caption {
      padding: 12px 16px;
      font-size: 14px;
      color: #86868B;
    }
    
    .footer {
      text-align: center;
      padding: 40px 20px;
      color: #86868B;
      font-size: 13px;
    }
    
    .footer-brand {
      font-weight: 600;
      color: #1D1D1F;
    }
    
    /* Lightbox */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.95);
      z-index: 100;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .lightbox.active { display: flex; }
    
    .lightbox img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    @media (max-width: 600px) {
      .gallery { grid-template-columns: 1fr; }
      .hero-title { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1 class="hero-title">${esc(title)}</h1>
    ${description ? `<p class="hero-desc">${esc(description)}</p>` : ''}
    <div class="hero-meta">${photos.length} photos &middot; ${brand ? esc(brand) : 'Ahmad Asri Photography'}</div>
  </div>
  
  <div class="gallery">
    ${photoHTML}
  </div>
  
  <div class="footer">
    <div class="footer-brand">${esc(brand || 'Ahmad Asri Photography')}</div>
    <div>Interior Photography &middot; Yogyakarta</div>
    <div style="margin-top:8px;">Generated with Portfolio Showcase</div>
  </div>
  
  <!-- Lightbox -->
  <div class="lightbox" id="lightbox">
    <button class="lightbox-close">&times;</button>
    <img id="lightbox-img" src="" alt="">
  </div>
  
  <script>
    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    document.querySelectorAll('.photo-item').forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
      });
    });
    
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.classList.remove('active');
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('active');
    });
  </script>
</body>
</html>`;
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Message Handler ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  
  if (msg.type === 'GET_PORTFOLIOS') {
    (async () => {
      const portfolios = await getPortfolios();
      // Don't send base64 photos in list (too large)
      const list = portfolios.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        brand: p.brand,
        photoCount: p.photos?.length || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
      sendResponse({ success: true, portfolios: list });
    })();
    return true;
  }
  
  if (msg.type === 'GET_PORTFOLIO') {
    (async () => {
      const portfolios = await getPortfolios();
      const portfolio = portfolios.find(p => p.id === msg.id);
      sendResponse({ success: !!portfolio, portfolio });
    })();
    return true;
  }
  
  if (msg.type === 'SAVE_PORTFOLIO') {
    (async () => {
      await savePortfolio(msg.portfolio);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'DELETE_PORTFOLIO') {
    (async () => {
      await deletePortfolio(msg.id);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'GENERATE_HTML') {
    (async () => {
      const portfolios = await getPortfolios();
      const portfolio = portfolios.find(p => p.id === msg.id);
      if (!portfolio) {
        sendResponse({ success: false, error: 'Portfolio not found' });
        return;
      }
      const html = generatePortfolioHTML(portfolio);
      sendResponse({ success: true, html });
    })();
    return true;
  }
  
  if (msg.type === 'DOWNLOAD_HTML') {
    const html = msg.html;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url,
      filename: `portfolio_${Date.now()}.html`,
      saveAs: true
    }, () => {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      sendResponse({ success: true });
    });
    return true;
  }
});

// ─── Open Side Panel ──────────────────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

console.log('[Portfolio Showcase] Background loaded');
