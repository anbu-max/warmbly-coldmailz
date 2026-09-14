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

  // =========================================================================
  // WARMUP COOLDOWN & DISTRIBUTION INSPECTOR FEATURE
  // =========================================================================

  let warmupData = {
    isRunning: true,
    distributionMode: "round_robin",
    currentEmail: "anbu.fromdigital@gmail.com",
    nextEmail: "zenkucarter@gmail.com",
    secondsRemaining: 74,
    totalCooldown: 180,
    replyRate: 35,
    minDelay: 180,
    window: "24/7 (00:00 - 23:59)",
    queue: [
      { email: "anbu.fromdigital@gmail.com", remaining: 74 },
      { email: "zenkucarter@gmail.com", remaining: 154 },
      { email: "contact.alexforgrowth@gmail.com", remaining: 234 },
      { email: "s63400391@gmail.com", remaining: 314 },
      { email: "kevinzdigital@gmail.com", remaining: 394 },
      { email: "jannetz.grows@gmail.com", remaining: 474 },
      { email: "alanrictsons@gmail.com", remaining: 554 }
    ]
  };

  function formatSecs(s) {
    if (s <= 0) return "0s";
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  }

  async function fetchLiveTelemetry() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // 1. Fetch live account statuses (which has exact current_volume & target_volume per mailbox)
      let accounts = [];
      try {
        const accRes = await fetch('http://localhost:8080/v1/analytics/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (accRes.ok) {
          const accData = await accRes.json();
          accounts = Array.isArray(accData) ? accData : (accData?.data || []);
        }
      } catch (e) {}

      // If analytics/accounts empty, fallback to /v1/emails
      if (!accounts || accounts.length === 0) {
        const emailsRes = await fetch('http://localhost:8080/v1/emails?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (emailsRes.ok) {
          const emailsData = await emailsRes.json();
          accounts = emailsData?.data || [];
        }
      }

      if (!accounts || accounts.length === 0) return;

      // Filter to ONLY actively warming accounts that HAVE NOT REACHED their daily limit
      const eligibleAccounts = [];
      let totalMailboxCount = accounts.length;
      let completedCount = 0;

      for (const acc of accounts) {
        if (acc.status !== 'active') continue;
        const ws = acc.warmup_status;
        if (ws) {
          if (!ws.enabled || ws.paused) continue;
          const sent = ws.current_volume || 0;
          const target = ws.target_volume || 10;
          if (sent >= target) {
            completedCount++;
            continue; // STRICTLY SKIP: mailbox reached its daily limit for today!
          }
          eligibleAccounts.push({
            email: acc.email,
            sent: sent,
            target: target,
            remainingQuota: target - sent
          });
        } else if (acc.warmup && !acc.warmup_paused_at) {
          eligibleAccounts.push({
            email: acc.email,
            sent: 0,
            target: acc.warmup_base || 10,
            remainingQuota: acc.warmup_base || 10
          });
        }
      }

      // Deterministic pseudo-randomized jitter between 240s (4 min) and 480s (8 min) per mailbox
      function getMailboxJitterSecs(emailStr, slotIndex) {
        let hash = 0;
        for (let i = 0; i < emailStr.length; i++) {
          hash = (hash << 5) - hash + emailStr.charCodeAt(i);
          hash |= 0;
        }
        const jitterVariance = Math.abs(hash + slotIndex * 77) % 240; // 0 to 240s (0 to 4 min)
        return 240 + jitterVariance; // 240s to 480s (4.0 min to 8.0 min)
      }

      const now = Math.floor(Date.now() / 1000);

      if (eligibleAccounts.length === 0) {
        // All accounts completed today's target volume!
        warmupData = {
          isRunning: true,
          allCompletedToday: true,
          totalMailboxCount: totalMailboxCount,
          completedCount: completedCount,
          eligibleCount: 0,
          distributionMode: "round_robin",
          currentEmail: "All Active Mailboxes Completed Today's Limit (10/10)",
          nextEmail: "Round Robin Resumes Tomorrow Morning (+1/day)",
          secondsRemaining: 0,
          totalCooldown: 240,
          jitterMinText: "Paused Until Tomorrow",
          replyRate: 35,
          minDelay: 240,
          window: "24/7 (00:00 - 23:59)",
          queue: []
        };
        return;
      }

      const currentJitter = getMailboxJitterSecs(eligibleAccounts[0].email, Math.floor(now / 300));
      const currentSlot = Math.floor(now / currentJitter) % eligibleAccounts.length;
      const nextSlot = (currentSlot + 1) % eligibleAccounts.length;
      const elapsedInSlot = now % currentJitter;
      const remaining = currentJitter - elapsedInSlot;

      const q = [];
      let cumulative = remaining;
      for (let i = 0; i < Math.min(7, eligibleAccounts.length); i++) {
        const idx = (currentSlot + i) % eligibleAccounts.length;
        const mail = eligibleAccounts[idx];
        const itemJitter = getMailboxJitterSecs(mail.email, idx);
        q.push({
          email: mail.email,
          sent: mail.sent,
          target: mail.target,
          remainingQuota: mail.remainingQuota,
          remaining: i === 0 ? remaining : cumulative,
          jitterMin: (itemJitter / 60).toFixed(1)
        });
        if (i > 0) cumulative += itemJitter;
      }

      const currentJitterMin = (currentJitter / 60).toFixed(1);

      warmupData = {
        isRunning: true,
        allCompletedToday: false,
        totalMailboxCount: totalMailboxCount,
        completedCount: completedCount,
        eligibleCount: eligibleAccounts.length,
        distributionMode: "round_robin",
        currentEmail: eligibleAccounts[currentSlot].email,
        currentEmailQuota: `${eligibleAccounts[currentSlot].sent}/${eligibleAccounts[currentSlot].target}`,
        nextEmail: eligibleAccounts[nextSlot].email,
        nextEmailQuota: `${eligibleAccounts[nextSlot].sent}/${eligibleAccounts[nextSlot].target}`,
        secondsRemaining: remaining,
        totalCooldown: currentJitter,
        jitterMinText: `${currentJitterMin} min (Random 4-8m)`,
        replyRate: 35,
        minDelay: 240,
        window: "24/7 (00:00 - 23:59)",
        queue: q
      };
    } catch (err) {
      // Fallback
    }
  }

  // Ticker for smooth live countdown
  setInterval(() => {
    if (warmupData.secondsRemaining > 0) {
      warmupData.secondsRemaining--;
      if (warmupData.queue) {
        warmupData.queue.forEach(item => {
          if (item.remaining > 0) item.remaining--;
        });
      }
    } else {
      fetchLiveTelemetry();
    }
    updateWarmupBtnDisplay();
  }, 1000);

  // Poll live data periodically
  setInterval(fetchLiveTelemetry, 10000);
  fetchLiveTelemetry();

  function updateWarmupBtnDisplay() {
    const btn = document.getElementById('warmbly-warmup-telemetry-btn');
    if (!btn) return;
    const timeSpan = btn.querySelector('.warmup-time-text');
    if (timeSpan) {
      if (warmupData.allCompletedToday) {
        timeSpan.textContent = "Done Today (10/10)";
      } else {
        timeSpan.textContent = warmupData.secondsRemaining > 0 ? formatSecs(warmupData.secondsRemaining) : "Active";
      }
    }
  }

  function openWarmupInspector() {
    let modal = document.getElementById('warmbly-warmup-modal');
    if (modal) {
      modal.remove();
    }

    const progressPercent = warmupData.totalCooldown > 0 
      ? Math.min(100, Math.max(5, Math.round(((warmupData.totalCooldown - warmupData.secondsRemaining) / warmupData.totalCooldown) * 100)))
      : 100;

    modal = document.createElement('div');
    modal.id = 'warmbly-warmup-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      padding: 16px;
      animation: warmblyFadeIn 0.15s ease-out;
    `;

    modal.innerHTML = `
      <div style="
        background: #090d16;
        border: 1px solid #1e293b;
        border-radius: 16px;
        width: 100%;
        max-width: 620px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.1);
        color: #f1f5f9;
        overflow: hidden;
        animation: warmblyScaleUp 0.15s ease-out;
      ">
        <!-- Header -->
        <div style="padding: 18px 20px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; justify-content: center; color: #fbbf24;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"></path></svg>
            </div>
            <div>
              <h2 style="font-size: 15px; font-weight: 600; margin: 0; color: #f8fafc;">Warmup Cooldown & Distribution Inspector</h2>
              <p style="font-size: 12px; color: #94a3b8; margin: 2px 0 0 0;">Real-time peer-to-peer warmup sequence & task dispatch queue</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
              <span style="width: 6px; height: 6px; border-radius: 9999px; background: #34d399; box-shadow: 0 0 8px #34d399;"></span>
              Running
            </span>
            <button id="warmbly-modal-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1;">✕</button>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <!-- Primary 2-Email Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <!-- Card 1: Cooldown -->
            <div style="border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.35); background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.03) 100%); padding: 14px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #fbbf24; display: flex; align-items: center; gap: 5px;">
                  ⏳ 1. In Cooldown Now
                </span>
                <span style="font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; background: rgba(245, 158, 11, 0.25); color: #fde68a; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.4);">
                  ${warmupData.secondsRemaining > 0 ? formatSecs(warmupData.secondsRemaining) + ' left' : 'Active'}
                </span>
              </div>
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10.5px; color: #94a3b8; margin-bottom: 3px;">
                  <span>Mailing Account:</span>
                  ${warmupData.currentEmailQuota ? `<span style="font-family: monospace; font-weight: 600; color: #fbbf24; background: rgba(245,158,11,0.15); padding: 1px 5px; border-radius: 3px;">${warmupData.currentEmailQuota} Sent</span>` : ''}
                </div>
                <div style="font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: #fef08a; background: rgba(0, 0, 0, 0.4); padding: 7px 9px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.25); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${warmupData.currentEmail}
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
                  <span>Cooldown Progress</span>
                  <span style="font-family: ui-monospace, monospace; color: #fbbf24;">${progressPercent}%</span>
                </div>
                <div style="width: 100%; height: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 9999px;"></div>
                </div>
              </div>
            </div>

            <!-- Card 2: Next In Line -->
            <div style="border-radius: 12px; border: 1px solid rgba(14, 165, 233, 0.35); background: linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0.03) 100%); padding: 14px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; display: flex; align-items: center; gap: 5px;">
                  ➡️ 2. Next In Line
                </span>
                <span style="font-size: 11px; font-weight: 600; background: rgba(14, 165, 233, 0.2); color: #bae6fd; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(14, 165, 233, 0.35);">
                  Scheduled Next
                </span>
              </div>
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10.5px; color: #94a3b8; margin-bottom: 3px;">
                  <span>Next Mailbox (Round Robin):</span>
                  ${warmupData.nextEmailQuota ? `<span style="font-family: monospace; font-weight: 600; color: #38bdf8; background: rgba(14,165,233,0.15); padding: 1px 5px; border-radius: 3px;">${warmupData.nextEmailQuota} Sent</span>` : ''}
                </div>
                <div style="font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: #e0f2fe; background: rgba(0, 0, 0, 0.4); padding: 7px 9px; border-radius: 6px; border: 1px solid rgba(14, 165, 233, 0.25); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${warmupData.nextEmail}
                </div>
              </div>
              <p style="font-size: 10.5px; color: #94a3b8; margin: 0; line-height: 1.4;">
                ${warmupData.allCompletedToday 
                  ? "All mailboxes reached daily limit. Auto-resumes tomorrow morning with incremented daily target." 
                  : `Will automatically start mailing once <span style="color: #fbbf24; font-family: monospace;">${warmupData.currentEmail.split('@')[0]}</span> finishes cooldown.`}
              </p>
            </div>
          </div>

          <!-- Specs Grid -->
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; border-radius: 12px; padding: 14px;">
            <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 10px;">
              Engine Telemetry & Configuration
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 8px 10px;">
                <div style="font-size: 10px; color: #94a3b8;">Distribution</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #34d399; margin-top: 2px;">Round Robin</div>
              </div>
              <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 8px 10px;">
                <div style="font-size: 10px; color: #94a3b8;">Peer Reply Rate</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #38bdf8; margin-top: 2px;">35% Target</div>
              </div>
              <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 8px 10px;">
                <div style="font-size: 10px; color: #94a3b8;">Delay Interval</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #fbbf24; margin-top: 2px;">4.0 - 8.0 min (Random)</div>
              </div>
              <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 8px 10px;">
                <div style="font-size: 10px; color: #94a3b8;">Active Window</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #c084fc; margin-top: 2px;">24/7 Window</div>
              </div>
            </div>
            <div style="margin-top: 8px; padding: 7px 10px; border-radius: 6px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); font-size: 10.5px; color: #94a3b8; line-height: 1.4;">
              <span style="color: #38bdf8; font-weight: 600;">Daily Cap Protection:</span> When a mailbox hits its daily target (10/10 today, +1/day ramp), the Round Robin engine automatically skips it for the day and passes sending turns exclusively to remaining accounts.
            </div>
          </div>

          <!-- Upcoming Queue List -->
          <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(30, 41, 59, 0.8); border-radius: 12px; padding: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 8px;">
              <span>Active Round Robin Queue (${warmupData.eligibleCount || warmupData.queue.length} Accounts with sends remaining)</span>
              <span style="font-size: 10px; color: #64748b;">${warmupData.completedCount || 0} Mailboxes Completed Today</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px; max-height: 140px; overflow-y: auto;">
              ${warmupData.queue.length === 0 ? `
                <div style="padding: 12px; text-align: center; color: #34d399; font-size: 11.5px; font-weight: 600; background: rgba(16, 185, 129, 0.1); border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2);">
                  🎉 All mailboxes reached their maximum daily warmup limit for today (10/10). Resuming tomorrow!
                </div>
              ` : warmupData.queue.slice(2, 7).map((item, idx) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px; background: rgba(2, 6, 23, 0.5); border: 1px solid rgba(30, 41, 59, 0.5); font-size: 11px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-family: monospace; font-size: 10px; color: #64748b;">#${idx + 3}</span>
                    <span style="font-family: monospace; color: #e2e8f0;">${item.email}</span>
                    <span style="font-family: monospace; font-size: 10px; color: #38bdf8; background: rgba(14, 165, 233, 0.15); padding: 1px 4px; border-radius: 3px;">${item.sent}/${item.target}</span>
                  </div>
                  <span style="font-family: monospace; color: #94a3b8; font-size: 10px;">${formatSecs(item.remaining)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'warmbly-modal-close') {
        modal.remove();
      }
    });
  }

  function mountWarmupTelemetryButton() {
    if (document.getElementById('warmbly-warmup-telemetry-btn')) return;

    // 1. Direct Search Input anchor (most robust and reliable across all views)
    const searchInput = document.querySelector('input[placeholder*="Search by email"]') ||
                        document.querySelector('input[placeholder*="Search"]') ||
                        document.querySelector('input[type="search"]');

    let rightZone = null;
    let refChild = null;

    if (searchInput) {
      const searchBoxContainer = searchInput.closest('div.h-7') || searchInput.parentElement;
      if (searchBoxContainer && searchBoxContainer.parentElement) {
        rightZone = searchBoxContainer.parentElement;
        refChild = searchBoxContainer;
      }
    }

    if (!rightZone) {
      const sectionBars = Array.from(document.querySelectorAll('div.min-h-9, div[class*="min-h-9"]'));
      const mailboxesBar = sectionBars.find(el => el.textContent.includes('Mailboxes') || el.textContent.includes('MAILBOXES'));
      if (mailboxesBar) {
        rightZone = mailboxesBar.querySelector('.ml-auto') || mailboxesBar.lastElementChild;
        refChild = rightZone ? rightZone.firstChild : null;
      }
    }

    if (!rightZone) return;

    const btn = document.createElement('button');
    btn.id = 'warmbly-warmup-telemetry-btn';
    btn.type = 'button';
    btn.title = 'Inspect live warmup cooldown and round-robin queue';
    btn.style.cssText = `
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      height: 28px !important;
      padding: 0 10px !important;
      margin-right: 6px !important;
      border-radius: 6px !important;
      border: 1px solid rgba(245, 158, 11, 0.4) !important;
      background: rgba(245, 158, 11, 0.12) !important;
      color: #fbbf24 !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      font-family: inherit !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
      z-index: 10 !important;
    `;

    btn.innerHTML = `
      <span style="display: flex; position: relative; width: 8px; height: 8px;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: #fbbf24; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; width: 8px; height: 8px; border-radius: 9999px; background: #f59e0b;"></span>
      </span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fbbf24;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"></path></svg>
      <span>Warmup:</span>
      <span class="warmup-time-text" style="font-family: ui-monospace, monospace; font-weight: 700; color: #fde68a;">
        ${warmupData.secondsRemaining > 0 ? formatSecs(warmupData.secondsRemaining) : "Active"}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8; margin-left: 2px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(245, 158, 11, 0.22)';
      btn.style.borderColor = 'rgba(245, 158, 11, 0.6)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(245, 158, 11, 0.12)';
      btn.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    });

    btn.onclick = openWarmupInspector;

    if (refChild) {
      rightZone.insertBefore(btn, refChild);
    } else {
      rightZone.appendChild(btn);
    }
  }

  // Initial apply immediately
  const initialDark = isDarkMode();
  applyTheme(initialDark, false);

  // When DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyTheme(isDarkMode(), false);
      mountButton();
      mountWarmupTelemetryButton();
    });
  } else {
    mountButton();
    mountWarmupTelemetryButton();
  }

  // MutationObserver to:
  // 1. Keep toggle button mounted across React route changes
  // 2. Keep Warmup telemetry button mounted on SectionBar across React route changes
  // 3. Automatically style new iframes when opening emails
  const observer = new MutationObserver((mutations) => {
    if (!document.getElementById('warmbly-darkmode-toggle')) {
      mountButton();
    }

    if (!document.getElementById('warmbly-warmup-telemetry-btn')) {
      mountWarmupTelemetryButton();
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

  // Periodically check if any newly rendered iframe or section bar loaded
  setInterval(() => {
    if (!document.getElementById('warmbly-warmup-telemetry-btn')) {
      mountWarmupTelemetryButton();
    }
    if (document.documentElement.classList.contains('warmbly-dark')) {
      styleAllIframes(true);
    }
  }, 1000);
})();
