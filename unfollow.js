/*
  X/Twitter Ultra-Safe Mass Unfollow Script (Stable Pro – Nov 2025)
  Author: Shayan Taherkhani
  Website: https://shayantaherkhani.ir
  Notes:
   - Fully human-like behavior (25–40s delay)
   - Robust selectors for new X UI
   - Protects mutual follows
   - Zero ToS-risk speed pattern
*/

if (window.unfollowScriptRunning) {
  console.warn("⚠️ Script already running!");
  throw new Error("Script already active");
}
window.unfollowScriptRunning = true;

const MAX_UNFOLLOWS = 190;
const MIN_DELAY = 25000;
const MAX_DELAY = 40000;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomDelay() {
  return MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY));
}

// Read text content safely
function txt(el) {
  return (el?.innerText || el?.textContent || "").trim().toLowerCase();
}

// Detect “Follows you”
function isMutual(cell) {
  return txt(cell).includes("follows you") || txt(cell).includes("شما را دنبال می‌کند");
}

// Extract username reliably
function getUsername(cell) {
  const nameBlock = cell.querySelector('[data-testid="User-Name"] a[href^="/"]');
  if (nameBlock) {
    const parts = nameBlock.getAttribute("href").split("/").filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }
  return "unknown";
}

// Find the unfollow / following button
function findUnfollowButton(cell) {
  const btns = cell.querySelectorAll('div[role="button"], button');
  return Array.from(btns).find(b => {
    const t = txt(b);
    return t.includes("following") || t.includes("unfollow") || t.includes("دنبال می‌کنید");
  });
}

// Find confirmation button (covers all new UI states)
async function waitConfirm(timeout = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const btn =
      document.querySelector('[data-testid="confirmationSheetConfirm"]') ||
      document.querySelector('button[data-testid*="unfollow"]') ||
      Array.from(document.querySelectorAll("button")).find(b => txt(b).includes("unfollow"));

    if (btn) return btn;
    await sleep(250);
  }
  return null;
}

(async function main() {
  console.log(
    "%cStarted Safe Unfollow Session (Nov 2025)",
    "color:#1DA1F2;font-weight:bold;"
  );

  const cells = document.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]');
  let count = 0, skipped = 0;

  for (const cell of cells) {
    if (count >= MAX_UNFOLLOWS) break;

    if (!cell.querySelector('a[href^="/"]')) continue; // skip ads
    if (isMutual(cell)) { skipped++; continue; }

    const btn = findUnfollowButton(cell);
    if (!btn) { skipped++; continue; }

    const username = getUsername(cell);

    btn.scrollIntoView({ block: "center" });
    await sleep(500);
    btn.click();

    const confirm = await waitConfirm();
    if (confirm) {
      confirm.click();
      count++;
      console.log(`%cUnfollowed #${count}: @${username}`, "color:green");
    } else {
      console.log(`⚠️ Skip (no dialog): @${username}`);
      skipped++;
    }

    const d = randomDelay();
    console.log(`⏳ Waiting ${Math.round(d / 1000)}s...`);
    await sleep(d);
  }

  console.log(`%cDone. Unfollowed: ${count}, Skipped: ${skipped}`, "color:#1DA1F2");
  window.unfollowScriptRunning = false;
})();