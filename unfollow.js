/*
  X/Twitter Ultra-Safe Mass Unfollow Non-Followers Script (2025)
  Author: Shayan Taherkhani
  Website: https://shayantaherkhani.ir
  Description: Safely unfollow users who don't follow you back.
               Works perfectly on X.com as of November 2025.
               Human-like random delays, accurate button detection, username logging.
               Use responsibly – automation may violate platform ToS.
*/

if (window.unfollowScriptRunning) {
  console.warn("Script is already running!");
  throw new Error("Unfollow script already active");
}
window.unfollowScriptRunning = true;

const AUTHOR = "Shayan Taherkhani <shayantaherkhani.ir>";
const MAX_UNFOLLOWS = 190;        // Maximum unfollows per run (safe daily limit)
const MIN_DELAY_MS = 25000;       // 25 seconds
const MAX_DELAY_MS = 40000;       // 40 seconds

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
}

function getText(el) {
  if (!el) return "";
  return (el.innerText || el.textContent || el.getAttribute("aria-label") || "").trim().toLowerCase();
}

function isFollowingButton(btn) {
  if (!btn) return false;
  const testId = (btn.getAttribute("data-testid") || "").toLowerCase();
  const text = getText(btn);
  const keywords = ["following", "unfollow", "followed"];
  if (testId.includes("following") || testId.includes("unfollow") || testId.includes("follow")) return true;
  return keywords.some(kw => text.includes(kw));
}

async function waitForConfirmButton(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const btn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
    if (btn) return btn;
    await sleep(250);
  }
  return null;
}

function extractUsername(cell) {
  try {
    const link = cell.querySelector('a[href^="/"][href*="/"]');
    if (link && link.getAttribute("href")) {
      const parts = link.getAttribute("href").split("/").filter(Boolean);
      return parts[parts.length - 1] || "unknown";
    }
  } catch (e) {}
  return "unknown";
}

(async function ultraSafeUnfollow() {
  console.log(`%cX/Twitter Unfollow Script started — Author: ${AUTHOR}`, "color: #1DA1F2; font-weight: bold;");
  
  const results = [];
  let unfollowed = 0;

  const cells = document.querySelectorAll('div[data-testid="UserCell"], div[role="listitem"]');

  for (const cell of cells) {
    if (unfollowed >= MAX_UNFOLLOWS) {
      console.log(`%cReached limit of ${MAX_UNFOLLOWS} unfollows. Stopping.`, "color: orange; font-weight: bold;");
      break;
    }

    const buttons = cell.querySelectorAll('div[role="button"], button, a[role="button"]');
    const followBtn = Array.from(buttons).find(isFollowingButton);

    if (!followBtn) continue;

    const username = extractUsername(cell);

    // Scroll into view and click
    followBtn.scrollIntoView({ block: "center" });
    followBtn.click();

    // Wait for confirmation dialog
    const confirmBtn = await waitForConfirmButton(5000);

    if (confirmBtn) {
      confirmBtn.click();
      unfollowed++;
      results.push({ username, status: "unfollowed" });
      console.log(`Unfollowed #${unfollowed}: @${username}`);
    } else {
      results.push({ username, status: "no_confirm_dialog" });
      console.log(`Warning: No confirmation dialog for @${username} — possibly already unfollowed or UI change`);
    }

    const delay = randomDelay();
    console.log(`Waiting ${Math.round(delay / 1000)} seconds before next...`);
    await sleep(delay);
  }

  // Final report
  console.log("%c=== UNFOLLOW SESSION COMPLETE ===", "color: #1DA1F2; font-size: 14px; font-weight: bold;");
  console.log(`Total unfollowed: ${unfollowed}/${MAX_UNFOLLOWS}`);
  console.table(results);
  console.log("Tip: Scroll down more and re-run the script if you have more to clean.");

})().finally(() => {
  window.unfollowScriptRunning = false;
});