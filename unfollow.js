/*
  X/Twitter Ultra-Safe Mass Unfollow Script with Floating UI Panel (Dec 2025)
  Author: Shayan Taherkhani
  Website: https://shayantaherkhani.ir
*/

if (window.unfollowScriptRunning) {
  console.warn("⚠️ Script already running!");
  throw new Error("Script already active");
}
window.unfollowScriptRunning = true;

// === SETTINGS ===
let MAX_UNFOLLOWS = 190;
let MIN_DELAY = 20000;
let MAX_DELAY = 35000;
let isPaused = false;
let shouldStop = false;

// === UI PANEL ===
function createUI() {
  const panel = document.createElement('div');
  panel.id = 'unfollow-panel';
  panel.innerHTML = `
    <style>
      #unfollow-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 16px;
        padding: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
        color: #fff;
      }
      #unfollow-panel * { box-sizing: border-box; }
      #unfollow-panel .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      #unfollow-panel .title {
        font-size: 16px;
        font-weight: 700;
        color: #1DA1F2;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #unfollow-panel .close-btn {
        background: rgba(255,255,255,0.1);
        border: none;
        color: #fff;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
      }
      #unfollow-panel .close-btn:hover { background: #e0245e; }
      #unfollow-panel .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }
      #unfollow-panel .stat-box {
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
        padding: 12px 8px;
        text-align: center;
      }
      #unfollow-panel .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #1DA1F2;
      }
      #unfollow-panel .stat-label {
        font-size: 11px;
        color: rgba(255,255,255,0.6);
        margin-top: 4px;
      }
      #unfollow-panel .progress-container {
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        height: 8px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      #unfollow-panel .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #1DA1F2, #17bf63);
        width: 0%;
        transition: width 0.3s ease;
        border-radius: 10px;
      }
      #unfollow-panel .progress-text {
        text-align: center;
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        margin-bottom: 16px;
      }
      #unfollow-panel .current-user {
        background: rgba(29,161,242,0.1);
        border: 1px solid rgba(29,161,242,0.3);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 16px;
        font-size: 13px;
        text-align: center;
      }
      #unfollow-panel .settings-section {
        margin-bottom: 16px;
      }
      #unfollow-panel .setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      #unfollow-panel .setting-label {
        font-size: 12px;
        color: rgba(255,255,255,0.8);
      }
      #unfollow-panel .setting-input {
        width: 80px;
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.1);
        color: #fff;
        font-size: 13px;
        text-align: center;
      }
      #unfollow-panel .setting-input:focus {
        outline: none;
        border-color: #1DA1F2;
      }
      #unfollow-panel .buttons {
        display: flex;
        gap: 10px;
      }
      #unfollow-panel .btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      #unfollow-panel .btn-pause {
        background: #f7931a;
        color: #fff;
      }
      #unfollow-panel .btn-pause:hover { background: #e8820a; }
      #unfollow-panel .btn-pause.paused {
        background: #17bf63;
      }
      #unfollow-panel .btn-stop {
        background: #e0245e;
        color: #fff;
      }
      #unfollow-panel .btn-stop:hover { background: #c91c52; }
      #unfollow-panel .status {
        text-align: center;
        padding: 8px;
        border-radius: 6px;
        font-size: 12px;
        margin-top: 12px;
      }
      #unfollow-panel .status.running {
        background: rgba(23,191,99,0.2);
        color: #17bf63;
      }
      #unfollow-panel .status.paused {
        background: rgba(247,147,26,0.2);
        color: #f7931a;
      }
      #unfollow-panel .status.stopped {
        background: rgba(224,36,94,0.2);
        color: #e0245e;
      }
    </style>
    <div class="header">
      <div class="title">🚀 Mass Unfollow</div>
      <button class="close-btn" id="close-panel">×</button>
    </div>
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value" id="stat-unfollowed">0</div>
        <div class="stat-label">Unfollowed</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" id="stat-skipped">0</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" id="stat-remaining">0</div>
        <div class="stat-label">Remaining</div>
      </div>
    </div>
    <div class="progress-container">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
    <div class="progress-text" id="progress-text">0% Complete</div>
    <div class="current-user" id="current-user">⏳ Starting...</div>
    <div class="settings-section">
      <div class="setting-row">
        <span class="setting-label">Max Unfollows:</span>
        <input type="number" class="setting-input" id="setting-max" value="${MAX_UNFOLLOWS}" min="1" max="500">
      </div>
      <div class="setting-row">
        <span class="setting-label">Min Delay (sec):</span>
        <input type="number" class="setting-input" id="setting-min-delay" value="${MIN_DELAY/1000}" min="5" max="120">
      </div>
      <div class="setting-row">
        <span class="setting-label">Max Delay (sec):</span>
        <input type="number" class="setting-input" id="setting-max-delay" value="${MAX_DELAY/1000}" min="10" max="180">
      </div>
    </div>
    <div class="buttons">
      <button class="btn btn-pause" id="btn-pause">⏸️ Pause</button>
      <button class="btn btn-stop" id="btn-stop">⏹️ Stop</button>
    </div>
    <div class="status running" id="status-text">🟢 Running...</div>
  `;
  document.body.appendChild(panel);

  // Event listeners
  document.getElementById('close-panel').onclick = () => {
    shouldStop = true;
    panel.remove();
  };

  document.getElementById('btn-pause').onclick = () => {
    isPaused = !isPaused;
    const btn = document.getElementById('btn-pause');
    const status = document.getElementById('status-text');
    if (isPaused) {
      btn.innerHTML = '▶️ Resume';
      btn.classList.add('paused');
      status.className = 'status paused';
      status.innerHTML = '🟡 Paused';
    } else {
      btn.innerHTML = '⏸️ Pause';
      btn.classList.remove('paused');
      status.className = 'status running';
      status.innerHTML = '🟢 Running...';
    }
  };

  document.getElementById('btn-stop').onclick = () => {
    shouldStop = true;
    document.getElementById('status-text').className = 'status stopped';
    document.getElementById('status-text').innerHTML = '🔴 Stopped';
  };

  // Settings listeners
  document.getElementById('setting-max').onchange = (e) => {
    MAX_UNFOLLOWS = parseInt(e.target.value) || 190;
    updateUI();
  };
  document.getElementById('setting-min-delay').onchange = (e) => {
    MIN_DELAY = (parseInt(e.target.value) || 20) * 1000;
  };
  document.getElementById('setting-max-delay').onchange = (e) => {
    MAX_DELAY = (parseInt(e.target.value) || 35) * 1000;
  };

  return panel;
}

function updateUI(unfollowed = 0, skipped = 0, currentUser = '', total = 0) {
  const remaining = Math.max(0, MAX_UNFOLLOWS - unfollowed);
  const progress = total > 0 ? Math.round((unfollowed / MAX_UNFOLLOWS) * 100) : 0;

  const statUnfollowed = document.getElementById('stat-unfollowed');
  const statSkipped = document.getElementById('stat-skipped');
  const statRemaining = document.getElementById('stat-remaining');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const currentUserEl = document.getElementById('current-user');

  if (statUnfollowed) statUnfollowed.textContent = unfollowed;
  if (statSkipped) statSkipped.textContent = skipped;
  if (statRemaining) statRemaining.textContent = remaining;
  if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
  if (progressText) progressText.textContent = `${Math.min(progress, 100)}% Complete`;
  if (currentUserEl && currentUser) currentUserEl.innerHTML = `Processing: <strong>@${currentUser}</strong>`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
  return MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY));
}

function txt(el) {
  return (el?.innerText || el?.textContent || "").trim().toLowerCase();
}

function isMutual(cell) {
  return txt(cell).includes("follows you") || txt(cell).includes("شما را دنبال می‌کند");
}

function getUsername(cell) {
  const link = cell.querySelector('a[href^="/"][role="link"], a[href^="/"]:not([href*="status"]):not([href*="intent"])');
  if (link) {
    return link.getAttribute("href").split("/")[1] || "unknown";
  }
  return "unknown";
}

function findUnfollowButton(cell) {
  const btns = cell.querySelectorAll('div[role="button"], button');
  return Array.from(btns).find(b => {
    const t = txt(b);
    return t.includes("following") || t.includes("unfollow") || t.includes("دنبال می‌کنید");
  });
}

async function waitConfirm(timeout = 7000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const btn =
      document.querySelector('[data-testid="confirmationSheetConfirm"]') ||
      document.querySelector('div[role="button"][data-testid*="unfollow"]') ||
      document.querySelector('button[data-testid*="unfollow"]') ||
      Array.from(document.querySelectorAll("button")).find(b => txt(b).includes("unfollow"));

    if (btn) return btn;
    await sleep(300);
  }
  return null;
}

async function waitWhilePaused() {
  while (isPaused && !shouldStop) {
    await sleep(500);
  }
}

const logEntries = [];

function logAction(username, action, reason = "") {
  const time = new Date().toLocaleTimeString();
  logEntries.push({ time, username, action, reason });
  const colors = {
    unfollowed: "color: green; font-weight: bold;",
    skipped: "color: orange;",
    error: "color: red; font-weight: bold;",
  };
  console.log(`%c[${time}] ${action.toUpperCase()} - @${username} ${reason}`, colors[action] || "");
}

(async function main() {
  createUI();
  console.log("%c🚀 Started Safe Unfollow with Floating UI Panel (Dec 2025)", "color:#1DA1F2;font-weight:bold;");

  const cells = document.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]');
  let count = 0, skipped = 0;
  const total = cells.length;

  updateUI(count, skipped, '', total);

  for (const cell of cells) {
    if (shouldStop) break;
    await waitWhilePaused();
    if (count >= MAX_UNFOLLOWS) break;

    if (!cell.querySelector('a[href^="/"]')) {
      logAction("unknown", "skipped", "No profile link (likely ad)");
      skipped++;
      updateUI(count, skipped, '', total);
      continue;
    }
    if (isMutual(cell)) {
      const username = getUsername(cell);
      logAction(username, "skipped", "Mutual follow");
      skipped++;
      updateUI(count, skipped, username, total);
      continue;
    }

    const btn = findUnfollowButton(cell);
    if (!btn) {
      const username = getUsername(cell);
      logAction(username, "skipped", "No unfollow/following button");
      skipped++;
      updateUI(count, skipped, username, total);
      continue;
    }

    const username = getUsername(cell);
    updateUI(count, skipped, username, total);

    try {
      btn.scrollIntoView({ block: "center" });
      await sleep(500);
      btn.click();

      const confirmBtn = await waitConfirm();
      if (confirmBtn) {
        confirmBtn.click();
        count++;
        logAction(username, "unfollowed");
      } else {
        logAction(username, "skipped", "No confirmation dialog - assuming unfollowed");
        count++;
      }
      updateUI(count, skipped, username, total);
    } catch (err) {
      logAction(username, "error", `Exception: ${err.message}`);
      skipped++;
      updateUI(count, skipped, username, total);
    }

    if (shouldStop) break;
    await waitWhilePaused();

    const d = randomDelay();
    const currentUserEl = document.getElementById('current-user');
    if (currentUserEl) currentUserEl.innerHTML = `⏳ Waiting ${Math.round(d / 1000)}s...`;
    console.log(`⏳ Waiting ${Math.round(d / 1000)} seconds before next unfollow...`);
    await sleep(d);
  }

  const statusText = document.getElementById('status-text');
  const currentUserEl = document.getElementById('current-user');
  if (statusText) {
    statusText.className = 'status stopped';
    statusText.innerHTML = '✅ Complete!';
  }
  if (currentUserEl) currentUserEl.innerHTML = `🎉 Done! Unfollowed ${count} users`;

  console.log(`%c=== SESSION COMPLETE ===`, "color:#1DA1F2; font-weight:bold;");
  console.log(`Unfollowed: ${count}, Skipped: ${skipped}`);
  console.table(logEntries);

  window.unfollowScriptRunning = false;
})();
