/*
  X/Twitter Ultra-Safe Mass Unfollow Script with Floating UI Panel (Dec 2025)
  Author: Shayan Taherkhani
  Website: https://shayantaherkhani.ir
*/

// === TYPE DEFINITIONS ===
interface LogEntry {
  time: string;
  username: string;
  action: ActionType;
  reason: string;
}

interface Settings {
  maxUnfollows: number;
  minDelay: number;
  maxDelay: number;
}

interface State {
  isPaused: boolean;
  shouldStop: boolean;
  unfollowed: number;
  skipped: number;
}

type ActionType = 'unfollowed' | 'skipped' | 'error';

interface WindowWithFlag extends Window {
  unfollowScriptRunning?: boolean;
}

// === GLOBAL STATE ===
declare const window: WindowWithFlag;

if (window.unfollowScriptRunning) {
  console.warn("⚠️ Script already running!");
  throw new Error("Script already active");
}
window.unfollowScriptRunning = true;

const settings: Settings = {
  maxUnfollows: 190,
  minDelay: 20000,
  maxDelay: 35000
};

const state: State = {
  isPaused: false,
  shouldStop: false,
  unfollowed: 0,
  skipped: 0
};

const logEntries: LogEntry[] = [];

// === UTILITY FUNCTIONS ===
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(min: number = settings.minDelay, max: number = settings.maxDelay): number {
  return min + Math.floor(Math.random() * (max - min));
}

export function txt(el: Element | null): string {
  if (!el) return "";
  return ((el as HTMLElement).innerText || el.textContent || "").trim().toLowerCase();
}

export function isMutual(cell: Element): boolean {
  const text = txt(cell);
  return text.includes("follows you") || text.includes("شما را دنبال می‌کند");
}

export function getUsername(cell: Element): string {
  const link = cell.querySelector('a[href^="/"][role="link"], a[href^="/"]:not([href*="status"]):not([href*="intent"])');
  if (link) {
    const href = link.getAttribute("href");
    return href?.split("/")[1] || "unknown";
  }
  return "unknown";
}

export function findUnfollowButton(cell: Element): HTMLElement | undefined {
  const btns = cell.querySelectorAll('div[role="button"], button');
  return Array.from(btns).find((b): b is HTMLElement => {
    const t = txt(b);
    return t.includes("following") || t.includes("unfollow") || t.includes("دنبال می‌کنید");
  });
}

// === UI PANEL ===
function createUI(): HTMLDivElement {
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
        <input type="number" class="setting-input" id="setting-max" value="${settings.maxUnfollows}" min="1" max="500">
      </div>
      <div class="setting-row">
        <span class="setting-label">Min Delay (sec):</span>
        <input type="number" class="setting-input" id="setting-min-delay" value="${settings.minDelay/1000}" min="5" max="120">
      </div>
      <div class="setting-row">
        <span class="setting-label">Max Delay (sec):</span>
        <input type="number" class="setting-input" id="setting-max-delay" value="${settings.maxDelay/1000}" min="10" max="180">
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
  const closeBtn = document.getElementById('close-panel');
  if (closeBtn) {
    closeBtn.onclick = (): void => {
      state.shouldStop = true;
      panel.remove();
    };
  }

  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.onclick = (): void => {
      state.isPaused = !state.isPaused;
      const btn = document.getElementById('btn-pause');
      const status = document.getElementById('status-text');
      if (state.isPaused) {
        if (btn) {
          btn.innerHTML = '▶️ Resume';
          btn.classList.add('paused');
        }
        if (status) {
          status.className = 'status paused';
          status.innerHTML = '🟡 Paused';
        }
      } else {
        if (btn) {
          btn.innerHTML = '⏸️ Pause';
          btn.classList.remove('paused');
        }
        if (status) {
          status.className = 'status running';
          status.innerHTML = '🟢 Running...';
        }
      }
    };
  }

  const stopBtn = document.getElementById('btn-stop');
  if (stopBtn) {
    stopBtn.onclick = (): void => {
      state.shouldStop = true;
      const statusText = document.getElementById('status-text');
      if (statusText) {
        statusText.className = 'status stopped';
        statusText.innerHTML = '🔴 Stopped';
      }
    };
  }

  // Settings listeners
  const settingMax = document.getElementById('setting-max') as HTMLInputElement | null;
  if (settingMax) {
    settingMax.onchange = (e: Event): void => {
      const target = e.target as HTMLInputElement;
      settings.maxUnfollows = parseInt(target.value) || 190;
      updateUI(state.unfollowed, state.skipped, '');
    };
  }

  const settingMinDelay = document.getElementById('setting-min-delay') as HTMLInputElement | null;
  if (settingMinDelay) {
    settingMinDelay.onchange = (e: Event): void => {
      const target = e.target as HTMLInputElement;
      settings.minDelay = (parseInt(target.value) || 20) * 1000;
    };
  }

  const settingMaxDelay = document.getElementById('setting-max-delay') as HTMLInputElement | null;
  if (settingMaxDelay) {
    settingMaxDelay.onchange = (e: Event): void => {
      const target = e.target as HTMLInputElement;
      settings.maxDelay = (parseInt(target.value) || 35) * 1000;
    };
  }

  return panel;
}

function updateUI(unfollowed: number = 0, skipped: number = 0, currentUser: string = ''): void {
  const remaining = Math.max(0, settings.maxUnfollows - unfollowed);
  const progress = Math.round((unfollowed / settings.maxUnfollows) * 100);

  const statUnfollowed = document.getElementById('stat-unfollowed');
  const statSkipped = document.getElementById('stat-skipped');
  const statRemaining = document.getElementById('stat-remaining');
  const progressBar = document.getElementById('progress-bar') as HTMLElement | null;
  const progressText = document.getElementById('progress-text');
  const currentUserEl = document.getElementById('current-user');

  if (statUnfollowed) statUnfollowed.textContent = String(unfollowed);
  if (statSkipped) statSkipped.textContent = String(skipped);
  if (statRemaining) statRemaining.textContent = String(remaining);
  if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
  if (progressText) progressText.textContent = `${Math.min(progress, 100)}% Complete`;
  if (currentUserEl && currentUser) currentUserEl.innerHTML = `Processing: <strong>@${currentUser}</strong>`;
}

async function waitConfirm(timeout: number = 7000): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const btn =
      document.querySelector('[data-testid="confirmationSheetConfirm"]') as HTMLElement ||
      document.querySelector('div[role="button"][data-testid*="unfollow"]') as HTMLElement ||
      document.querySelector('button[data-testid*="unfollow"]') as HTMLElement ||
      Array.from(document.querySelectorAll("button")).find(b => txt(b).includes("unfollow")) as HTMLElement;

    if (btn) return btn;
    await sleep(300);
  }
  return null;
}

async function waitWhilePaused(): Promise<void> {
  while (state.isPaused && !state.shouldStop) {
    await sleep(500);
  }
}

function logAction(username: string, action: ActionType, reason: string = ""): void {
  const time = new Date().toLocaleTimeString();
  logEntries.push({ time, username, action, reason });
  const colors: Record<ActionType, string> = {
    unfollowed: "color: green; font-weight: bold;",
    skipped: "color: orange;",
    error: "color: red; font-weight: bold;",
  };
  console.log(`%c[${time}] ${action.toUpperCase()} - @${username} ${reason}`, colors[action] || "");
}

// === MAIN FUNCTION ===
(async function main(): Promise<void> {
  createUI();
  console.log("%c🚀 Started Safe Unfollow with Floating UI Panel (Dec 2025)", "color:#1DA1F2;font-weight:bold;");

  const cells = document.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]');
  let count = 0;
  let skipped = 0;

  updateUI(count, skipped, '');

  for (const cell of Array.from(cells)) {
    if (state.shouldStop) break;
    await waitWhilePaused();
    if (count >= settings.maxUnfollows) break;

    if (!cell.querySelector('a[href^="/"]')) {
      logAction("unknown", "skipped", "No profile link (likely ad)");
      skipped++;
      updateUI(count, skipped, '');
      continue;
    }
    if (isMutual(cell)) {
      const username = getUsername(cell);
      logAction(username, "skipped", "Mutual follow");
      skipped++;
      updateUI(count, skipped, username);
      continue;
    }

    const btn = findUnfollowButton(cell);
    if (!btn) {
      const username = getUsername(cell);
      logAction(username, "skipped", "No unfollow/following button");
      skipped++;
      updateUI(count, skipped, username);
      continue;
    }

    const username = getUsername(cell);
    updateUI(count, skipped, username);

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
      updateUI(count, skipped, username);
    } catch (err) {
      const error = err as Error;
      logAction(username, "error", `Exception: ${error.message}`);
      skipped++;
      updateUI(count, skipped, username);
    }

    if (state.shouldStop) break;
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
