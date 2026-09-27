(function () {
  const THEME_KEY = 'warmbly_dark_mode';

  function isDarkMode() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* Style sandboxed email iframes so they don't render blinding white rectangles */
  function styleAllIframes(isDark) {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        let style = doc.getElementById('warmbly-dark-iframe-style');
        if (isDark) {
          if (!style) {
            style = doc.createElement('style');
            style.id = 'warmbly-dark-iframe-style';
            if (doc.head) {
              doc.head.appendChild(style);
            } else if (doc.body) {
              doc.body.appendChild(style);
            }
          }
          style.textContent = `
            :root { color-scheme: dark !important; }
            html, body {
              background-color: transparent !important;
              color: #f1f5f9 !important;
              font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
            }
            body, p, span, div, font, td, th, li, h1, h2, h3, h4, h5, h6, strong, b, em {
              color: #f1f5f9 !important;
            }
            table, tr, td, tbody, thead, div[style*="background"] {
              background-color: transparent !important;
            }
            a {
              color: #38bdf8 !important;
            }
            blockquote {
              border-left: 2px solid #334155 !important;
              color: #94a3b8 !important;
            }
            hr {
              border-color: rgba(255, 255, 255, 0.1) !important;
            }
          `;
        } else {
          if (style) {
            style.remove();
          }
        }
      } catch (e) {
        // Cross-origin iframe guard
      }
    });
  }

  function applyTheme(dark, save = false) {
    if (save) {
      localStorage.setItem(THEME_KEY, dark ? 'true' : 'false');
    }

    if (dark) {
      document.documentElement.classList.add('warmbly-dark');
      document.documentElement.classList.add('dark');
      if (document.body) {
        document.body.classList.add('warmbly-dark');
        document.body.classList.add('dark');
      }
    } else {
      document.documentElement.classList.remove('warmbly-dark');
      document.documentElement.classList.remove('dark');
      if (document.body) {
        document.body.classList.remove('warmbly-dark');
        document.body.classList.remove('dark');
      }
    }

    updateButton(dark);
    styleAllIframes(dark);
  }

  const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
  const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

  function updateButton(dark) {
    const btn = document.getElementById('warmbly-darkmode-toggle');
    if (!btn) return;
    btn.innerHTML = dark ? sunSvg : moonSvg;
    btn.setAttribute('title', dark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    btn.setAttribute('aria-label', dark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }

  function toggleTheme() {
    const currentlyDark = document.documentElement.classList.contains('warmbly-dark');
    const nextDark = !currentlyDark;
    localStorage.setItem(THEME_KEY, nextDark ? 'true' : 'false');
    applyTheme(nextDark, true);
  }

  function mountButton() {
    if (document.getElementById('warmbly-darkmode-toggle')) return;

    const header = document.querySelector('.h-14');
    if (!header) return;

    const aiBtn = header.querySelector('button[aria-label="AI assistant"]');
    const notifBell = header.querySelector('button[aria-label*="notification" i]') || 
                     header.querySelector('button[aria-label*="Notification" i]');
    const searchBtn = header.querySelector('button kbd')?.closest('button') || 
                      header.querySelector('button:has(kbd)');

    let targetParent = null;
    let referenceSibling = null;

    if (aiBtn && aiBtn.parentElement) {
      targetParent = aiBtn.parentElement;
      referenceSibling = aiBtn.nextSibling;
    } else if (notifBell && notifBell.parentElement) {
      targetParent = notifBell.parentElement;
      referenceSibling = notifBell.nextSibling;
    } else if (searchBtn && searchBtn.parentElement) {
      targetParent = searchBtn.parentElement;
      referenceSibling = searchBtn;
    } else {
      const rightZone = header.querySelector('.flex.items-center.gap-2.shrink-0') ||
                        header.lastElementChild;
      if (rightZone) {
        targetParent = rightZone;
        referenceSibling = rightZone.firstChild;
      }
    }

    if (!targetParent) return;

    const btn = document.createElement('button');
    btn.id = 'warmbly-darkmode-toggle';
    btn.type = 'button';
    btn.className = 'warmbly-theme-btn';
    btn.onclick = toggleTheme;

    if (referenceSibling) {
      targetParent.insertBefore(btn, referenceSibling);
    } else {
      targetParent.appendChild(btn);
    }

    updateButton(document.documentElement.classList.contains('warmbly-dark'));
  }

  // Initial apply immediately
  const initialDark = isDarkMode();
  applyTheme(initialDark, false);

  // When DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyTheme(isDarkMode(), false);
      mountButton();
    });
  } else {
    mountButton();
  }

  // MutationObserver to:
  // 1. Keep toggle button mounted across React route changes
  // 2. Automatically style new iframes when opening emails
  const observer = new MutationObserver((mutations) => {
    if (!document.getElementById('warmbly-darkmode-toggle')) {
      mountButton();
    }

    if (document.documentElement.classList.contains('warmbly-dark')) {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeName === 'IFRAME') {
            node.addEventListener('load', () => styleAllIframes(true));
            styleAllIframes(true);
          } else if (node.querySelectorAll) {
            const iframes = node.querySelectorAll('iframe');
            if (iframes.length > 0) {
              iframes.forEach((f) => f.addEventListener('load', () => styleAllIframes(true)));
              styleAllIframes(true);
            }
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Periodically check if any newly rendered iframe loaded
  setInterval(() => {
    if (document.documentElement.classList.contains('warmbly-dark')) {
      styleAllIframes(true);
    }
  }, 1000);
})();
