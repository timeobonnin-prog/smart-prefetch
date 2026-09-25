const DEFAULT_SETTINGS = {
  enabled: true,
  hoverDelay: 80,
  viewportMargin: 400,
  maxPrefetch: 999,
  markovMinHits: 2,
  blockSlowConn: true,
  respectSaveData: true,
  showHoverBadge: true,
  showIconBadge: true,
  blocklist: [
    "youtube.com", "youtu.be",
    "twitter.com", "x.com",
    "facebook.com", "instagram.com", "tiktok.com",
    "linkedin.com",
    "netflix.com", "twitch.tv",
    "accounts.google.com", "login.microsoftonline.com",
    "bank", "banque", "bnpparibas", "credit-agricole", "societegenerale",
    "paypal.com", "stripe.com"
  ],
  whitelist: [],
  stats: { prefetched: 0, hits: 0, byHost: {}, timeSavedMs: 0, measures: 0 }
};

const DEFAULT_STATS = { prefetched: 0, hits: 0, byHost: {}, timeSavedMs: 0, measures: 0 };

// --- tab counters ---
const tabCounts = new Map();

async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

async function setBadge(tabId, count) {
  const s = await getSettings();
  if (!s.showIconBadge) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }
  const text = count > 0 ? String(Math.min(count, 999)) : "";
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#6ea8fe" });
  if (text) chrome.action.setBadgeTextColor?.({ tabId, color: "#0f1115" });
}

function clearBadges() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(t => {
      chrome.action.setBadgeText({ tabId: t.id, text: "" }).catch(() => {});
    });
  });
}

// --- init ---
chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.local.get("settings");
  if (!settings) await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  const { stats } = await chrome.storage.local.get("stats");
  if (!stats) await chrome.storage.local.set({ stats: DEFAULT_STATS });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "prefetch-all-page",
      title: "Smart Prefetch : precharger tous les liens",
      contexts: ["page"]
    });
    chrome.contextMenus.create({
      id: "prefetch-this-link",
      title: "Smart Prefetch : precharger ce lien",
      contexts: ["link"]
    });
    chrome.contextMenus.create({
      id: "open-options",
      title: "Smart Prefetch : options",
      contexts: ["action"]
    });
  });
});

// --- messages from content scripts ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === "prefetch-stats") {
    (async () => {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        const cur = (tabCounts.get(tabId) || 0) + (msg.count || 0);
        tabCounts.set(tabId, cur);
        await setBadge(tabId, cur);
      }
      const { stats = DEFAULT_STATS } = await chrome.storage.local.get("stats");
      stats.prefetched += msg.count || 0;
      try {
        const host = new URL(msg.url).host;
        stats.byHost[host] = (stats.byHost[host] || 0) + (msg.count || 0);
      } catch {}
      await chrome.storage.local.set({ stats });
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (msg.type === "prefetch-hit") {
    (async () => {
      const { stats = DEFAULT_STATS } = await chrome.storage.local.get("stats");
      stats.hits += 1;
      if (msg.timeSavedMs) {
        stats.timeSavedMs += msg.timeSavedMs;
        stats.measures += 1;
      }
      await chrome.storage.local.set({ stats });
    })();
    return true;
  }

  if (msg.type === "get-stats") {
    (async () => {
      const { stats = DEFAULT_STATS } = await chrome.storage.local.get("stats");
      sendResponse(stats);
    })();
    return true;
  }

  if (msg.type === "get-settings") {
    (async () => sendResponse(await getSettings()))();
    return true;
  }

  if (msg.type === "reset-stats") {
    chrome.storage.local.set({ stats: DEFAULT_STATS }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "reset-badges") {
    tabCounts.clear();
    clearBadges();
    sendResponse({ ok: true });
    return;
  }
});

// --- tab lifecycle ---
chrome.tabs.onRemoved.addListener((tabId) => tabCounts.delete(tabId));
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading" && info.url) {
    tabCounts.set(tabId, 0);
    setBadge(tabId, 0);
  }
});

// --- context menu ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === "prefetch-all-page") {
    chrome.tabs.sendMessage(tab.id, { type: "cmd-prefetch-all" }).catch(() => {});
  } else if (info.menuItemId === "prefetch-this-link") {
    chrome.tabs.sendMessage(tab.id, { type: "cmd-prefetch-link", url: info.linkUrl }).catch(() => {});
  } else if (info.menuItemId === "open-options") {
    chrome.runtime.openOptionsPage();
  }
});

// --- keyboard commands ---
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  if (command === "prefetch-next") {
    chrome.tabs.sendMessage(tab.id, { type: "cmd-prefetch-next" }).catch(() => {});
  } else if (command === "prefetch-all") {
    chrome.tabs.sendMessage(tab.id, { type: "cmd-prefetch-all" }).catch(() => {});
  }
});
