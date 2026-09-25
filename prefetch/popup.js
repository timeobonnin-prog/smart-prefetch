async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function loadStats() {
  const stats = await chrome.runtime.sendMessage({ type: "get-stats" });
  document.getElementById("prefetched").textContent = stats.prefetched || 0;
  document.getElementById("hits").textContent = stats.hits || 0;
  const seconds = Math.round((stats.timeSavedMs || 0) / 1000);
  document.getElementById("saved").textContent = seconds >= 60
    ? Math.round(seconds / 60) + " min"
    : seconds + " s";
  document.getElementById("measures").textContent = stats.measures || 0;

  const list = document.getElementById("hosts-list");
  list.innerHTML = "";
  const entries = Object.entries(stats.byHost || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!entries.length) {
    const li = document.createElement("li");
    li.textContent = "Aucune donnee";
    li.className = "empty";
    list.appendChild(li);
    return;
  }
  entries.forEach(([host, count]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${host}</span><span class="count">${count}</span>`;
    list.appendChild(li);
  });
}

async function syncToggle() {
  const settings = await chrome.runtime.sendMessage({ type: "get-settings" });
  const tab = await getActiveTab();
  if (!tab?.url) return;
  try {
    const host = new URL(tab.url).hostname.replace(/^www\./, "");
    const blocked = (settings.blocklist || []).some(b => host.includes(b));
    const whitelisted = (settings.whitelist || []).some(w => host.includes(w));
    const enabled = settings.enabled && !blocked || whitelisted;
    document.getElementById("enabled-toggle").checked = enabled;
  } catch {}
}

document.getElementById("enabled-toggle").addEventListener("change", async (e) => {
  const tab = await getActiveTab();
  if (!tab?.url) return;
  const settings = await chrome.runtime.sendMessage({ type: "get-settings" });
  try {
    const host = new URL(tab.url).hostname.replace(/^www\./, "");
    let wl = new Set(settings.whitelist || []);
    let bl = new Set(settings.blocklist || []);
    if (e.target.checked) {
      wl.add(host);
      bl.delete(host);
    } else {
      bl.add(host);
      wl.delete(host);
    }
    settings.whitelist = [...wl];
    settings.blocklist = [...bl];
    await chrome.storage.local.set({ settings });
    chrome.tabs.reload(tab.id);
  } catch {}
});

document.getElementById("prefetch-all").addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "cmd-prefetch-all" }).catch(() => {});
  window.close();
});

document.getElementById("open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("reset").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "reset-stats" });
  await chrome.runtime.sendMessage({ type: "reset-badges" });
  loadStats();
});

loadStats();
syncToggle();
