// Portfolio Showcase — Background Service Worker

async function getPortfolios() {
  const data = await chrome.storage.local.get('portfolios');
  return data.portfolios || [];
}

async function savePortfolios(portfolios) {
  await chrome.storage.local.set({ portfolios });
}

// ─── Message Handler ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  
  if (msg.type === 'GET_PORTFOLIOS') {
    (async () => {
      const portfolios = await getPortfolios();
      sendResponse({ success: true, portfolios });
    })();
    return true;
  }
  
  if (msg.type === 'SAVE_PORTFOLIO') {
    (async () => {
      const portfolios = await getPortfolios();
      const idx = portfolios.findIndex(p => p.id === msg.portfolio.id);
      if (idx >= 0) {
        portfolios[idx] = msg.portfolio;
      } else {
        portfolios.push(msg.portfolio);
      }
      await savePortfolios(portfolios);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'DELETE_PORTFOLIO') {
    (async () => {
      const portfolios = await getPortfolios();
      const filtered = portfolios.filter(p => p.id !== msg.portfolioId);
      await savePortfolios(filtered);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'EXPORT_HTML') {
    (async () => {
      const html = msg.html;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url,
        filename: `${msg.filename || 'portfolio'}.html`,
        saveAs: true
      }, () => {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        sendResponse({ success: true });
      });
    })();
    return true;
  }
  
  return true;
});

// ─── Open Side Panel ──────────────────────────────────────────────


console.log('[Portfolio Showcase] Background loaded');
