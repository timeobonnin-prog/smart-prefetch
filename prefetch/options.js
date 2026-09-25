const $ = (id) => document.getElementById(id);

let current = null;

async function load() {
  const s = await chrome.runtime.sendMessage({ type: "get-settings" });
  current = s;
  $("enabled").checked = !!s.enabled;
  $("showIconBadge").checked = !!s.showIconBadge;
  $("showHoverBadge").checked = !!s.showHoverBadge;
  $("hoverDelay").value = s.hoverDelay;
  $("viewportMargin").value = s.viewportMargin;
  $("maxPrefetch").value = s.maxPrefetch;
  $("markovMinHits").value = s.markovMinHits;
  $("blockSlowConn").checked = !!s.blockSlowConn;
  $("blocklist").value = (s.blocklist || []).join("\n");
  $("whitelist").value = (s.whitelist || []).join("\n");
  await loadStats();
}

async function loadStats() {
  const stats = await chrome.runtime.sendMessage({ type: "get-stats" });
  $("s-prefetched").textContent = stats.prefetched || 0;
  $("s-hits").textContent = stats.hits || 0;
  const sec = Math.round((stats.timeSavedMs || 0) / 1000);
  $("s-saved").textContent = sec >= 60 ? Math.round(sec / 60) + " min" : sec + " s";
  $("s-measures").textContent = stats.measures || 0;

  const ul = $("hosts-list");
  ul.innerHTML = "";
  const entries = Object.entries(stats.byHost || {}).sort((a, b) => b[1] - a[1]).slice(0, 15);
  entries.forEach(([host, count]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${host}</span><span class="count">${count}</span>`;
    ul.appendChild(li);
  });
}

$("save").addEventListener("click", async () => {
  const s = {
    ...current,
    enabled: $("enabled").checked,
    showIconBadge: $("showIconBadge").checked,
    showHoverBadge: $("showHoverBadge").checked,
    hoverDelay: Number($("hoverDelay").value) || 80,
    viewportMargin: Number($("viewportMargin").value) || 400,
    maxPrefetch: Number($("maxPrefetch").value) || 999,
    markovMinHits: Number($("markovMinHits").value) || 2,
    blockSlowConn: $("blockSlowConn").checked,
    blocklist: $("blocklist").value.split("\n").map(x => x.trim()).filter(Boolean),
    whitelist: $("whitelist").value.split("\n").map(x => x.trim()).filter(Boolean)
  };
  await chrome.storage.local.set({ settings: s });
  $("status").textContent = "✓ Enregistre";
  setTimeout(() => $("status").textContent = "", 2000);
});

$("reset-stats").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "reset-stats" });
  await chrome.runtime.sendMessage({ type: "reset-badges" });
  await loadStats();
  $("status").textContent = "✓ Stats reinitialisees";
  setTimeout(() => $("status").textContent = "", 2000);
});

load();
