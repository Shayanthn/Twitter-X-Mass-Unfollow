/*
  X/Twitter Ultra-Safe Mass Unfollow Script with Detailed Logging (Final Version - Nov 2025)
  Author: Shayan Taherkhani
  Website: https://shayantaherkhani.ir
*/

if (window.unfollowScriptRunning) {
  console.warn("⚠️ Script already running!");
  throw new Error("Script already active");
}
window.unfollowScriptRunning = true;

const MAX_UNFOLLOWS = 190;
const MIN_DELAY = 20000;  // حداقل تاخیر 20 ثانیه
const MAX_DELAY = 35000;  // حداکثر تاخیر 35 ثانیه

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
    // بررسی چند selector احتمالی دکمه تایید انفالو
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
  console.log("%c🚀 Started Safe Unfollow with Detailed Logging (Final Version Nov 2025)", "color:#1DA1F2;font-weight:bold;");

  // انتخاب سلول‌های کاربر - اگر ساختار تغییر کرد این قسمت نیاز به اصلاح داره
  const cells = document.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]');
  let count = 0, skipped = 0;

  for (const cell of cells) {
    if (count >= MAX_UNFOLLOWS) break;

    if (!cell.querySelector('a[href^="/"]')) {
      logAction("unknown", "skipped", "No profile link (likely ad)");
      skipped++;
      continue;
    }
    if (isMutual(cell)) {
      const username = getUsername(cell);
      logAction(username, "skipped", "Mutual follow");
      skipped++;
      continue;
    }

    const btn = findUnfollowButton(cell);
    if (!btn) {
      const username = getUsername(cell);
      logAction(username, "skipped", "No unfollow/following button");
      skipped++;
      continue;
    }

    const username = getUsername(cell);
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
        // اگر اصلاً دیالوگ تایید نبود، فرض می‌کنیم انفالو انجام شده (برای جلوگیری از توقف)
        logAction(username, "skipped", "No confirmation dialog - assuming unfollowed");
        count++;
      }
    } catch (err) {
      logAction(username, "error", `Exception: ${err.message}`);
      skipped++;
    }

    const d = randomDelay();
    console.log(`⏳ Waiting ${Math.round(d / 1000)} seconds before next unfollow...`);
    await sleep(d);
  }

  console.log(`%c=== SESSION COMPLETE ===`, "color:#1DA1F2; font-weight:bold;");
  console.log(`Unfollowed: ${count}, Skipped: ${skipped}`);
  console.table(logEntries);

  window.unfollowScriptRunning = false;
})();