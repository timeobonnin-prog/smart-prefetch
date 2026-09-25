(() => {
  "use strict";
  if (window.top !== window.self) return;

  let SETTINGS = {
    enabled: true,
    maxPrefetch: 99999,
    blockSlowConn: true,
    respectSaveData: true,
    showHoverBadge: true,
    blocklist: [],
    whitelist: []
  };

  const prefetched = new Set();
  const inFlight = new Set();
  let prefetchCount = 0;
  let pendingReport = 0;

  // ---------- Bulle fixe en haut à droite, minuscule ----------
  let badge = null;
  let badgeTimer = null;

  function ensureBadge() {
    if (badge) return badge;
    badge = document.createElement("div");
    badge.id = "sp-badge";
    badge.style.cssText = `
      position: fixed;
      top: 6px;
      right: 6px;
      z-index: 2147483647;
      pointer-events: none;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #7cd4ff 0%, #3ea6ff 60%, #0d6efd 100%);
      border: 0.5px solid rgba(255,255,255,.6);
      box-shadow:
        0 0 4px rgba(62,166,255,.6),
        0 1px 2px rgba(0,0,0,.2);
      opacity: 0;
      transition: opacity .15s ease, transform .15s ease;
      transform: scale(.4);
      will-change: transform, opacity;
    `;
    document.documentElement.appendChild(badge);
    return badge;
  }

  function showBadge(state) {
    if (!SETTINGS.showHoverBadge) return;
    const b = ensureBadge();
    const styles = {
      load: "radial-gradient(circle at 35% 30%, #ffd97a 0%, #ffb340 60%, #d97706 100%)",
      done: "radial-gradient(circle at 35% 30%, #7cd4ff 0%, #3ea6ff 60%, #0d6efd 100%)",
      hit:  "radial-gradient(circle at 35% 30%, #9fe7c2 0%, #34c77b 60%, #0e7a45 100%)",
      err:  "radial-gradient(circle at 35% 30%, #ff9a9a 0%, #ef4444 60%, #991b1b 100%)"
    };
    b.style.background = styles[state] || styles.done;
    b.style.opacity = "1";
    b.style.transform = "scale(1)";

    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      if (badge) {
        badge.style.opacity = "0";
        badge.style.transform = "scale(.4)";
      }
    }, 550);
  }

  // ---------- Utils ----------
  function isSameOrigin(url) {
    try { return new URL(url, location.href).origin === location.origin; }
    catch { return false; }
  }

  function hostBlocked() {
    const host = location.hostname.replace(/^www\./, "");
    if (SETTINGS.whitelist?.length) {
      return !SETTINGS.whitelist.some(w => host.endsWith(w.replace(/^www\./, "")));
    }
    return (SETTINGS.blocklist || []).some(b => host.includes(b));
  }

  function canPrefetch() {
    if (!SETTINGS.enabled || hostBlocked()) return false;
    const c = navigator.connection;
    if (SETTINGS.respectSaveData && c?.saveData) return false;
    if (SETTINGS.blockSlowConn && /(^|-)2g$/.test(c?.effectiveType || "")) return false;
    return true;
  }

  function isSensitive(url) {
    try {
      return /\/(panier|cart|checkout|paiement|payment|compte|account|login|logout|signin|signup|admin)/i
        .test(new URL(url, location.href).pathname);
    } catch { return true; }
  }

  // ---------- Prefetch ----------
  function prefetch(url, priority = "low", showUI = false) {
    if (!url || prefetched.has(url) || inFlight.has(url)) return;
    if (!canPrefetch() || !isSameOrigin(url) || isSensitive(url)) return;

    prefetched.add(url);
    inFlight.add(url);
    prefetchCount++;
    pendingReport++;

    if (showUI) showBadge("load");

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "document";
    if (priority === "high") link.setAttribute("fetchpriority", "high");

    link.onload = () => {
      inFlight.delete(url);
      if (showUI) showBadge("done");
    };
    link.onerror = () => {
      inFlight.delete(url);
      if (showUI) showBadge("err");
    };

    document.head.appendChild(link);

    if (pendingReport >= 5) {
      const n = pendingReport;
      pendingReport = 0;
      try {
        chrome.runtime?.sendMessage?.({ type: "prefetch-stats", count: n, url: location.href });
      } catch {}
    }
  }

  // ---------- TOUS les liens automatiquement (silencieux) ----------
  function prefetchAllLinks() {
    const links = document.querySelectorAll("a[href]");
    const queue = [];
    links.forEach(a => {
      if (!isSameOrigin(a.href) || isSensitive(a.href)) return;
      if (prefetched.has(a.href)) return;
      queue.push(a.href);
    });
    let i = 0;
    function next() {
      if (i >= queue.length) return;
      prefetch(queue[i++], "low", false);
      setTimeout(next, 20);
    }
    next();
  }

  // ---------- Survol : bulle discrète en haut à droite ----------
  function installHoverBadge() {
    document.addEventListener("pointerover", (e) => {
      const a = e.target.closest?.("a[href]");
      if (!a || !isSameOrigin(a.href) || isSensitive(a.href)) return;
      if (prefetched.has(a.href)) {
        showBadge("hit");
      } else {
        prefetch(a.href, "high", true);
      }
    }, { passive: true });
  }

  // ---------- Speculation Rules ----------
  function installSpeculationRules() {
    if (!HTMLScriptElement.supports?.("speculationrules")) return;
    const rules = {
      prerender: [{
        where: { and: [
          { href_matches: "/*" },
          { not: { href_matches: "/*logout*" } },
          { not: { href_matches: "/*admin*" } },
          { not: { href_matches: "/*checkout*" } }
        ]},
        eagerness: "moderate"
      }]
    };
    const s = document.createElement("script");
    s.type = "speculationrules";
    s.textContent = JSON.stringify(rules);
    document.head.appendChild(s);
  }

  // ---------- Nouveaux liens dynamiques ----------
  function watchNewLinks() {
    new MutationObserver((ms) => {
      let hasNew = false;
      ms.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches?.("a[href]") || n.querySelector?.("a[href]")) hasNew = true;
      }));
      if (hasNew) setTimeout(prefetchAllLinks, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }

  // ---------- Commandes background ----------
  function installCommands() {
    chrome.runtime?.onMessage?.addListener((msg) => {
      if (msg.type === "cmd-prefetch-all") prefetchAllLinks();
      if (msg.type === "cmd-prefetch-next") {
        const next = document.querySelector('a[rel="next"]')?.href
          || document.querySelector(".pagination a.next")?.href
          || document.querySelector("a.next")?.href;
        if (next) prefetch(next, "high", true);
      }
      if (msg.type === "cmd-prefetch-link" && msg.url) prefetch(msg.url, "high", true);
    });
  }

  // ---------- Mesure de vitesse ----------
  function installSpeedMeasure() {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) return;
      const fromCache = nav.transferSize === 0 && nav.decodedBodySize > 0;
      if (!fromCache) return;
      const saved = Math.max(0, 400 - nav.duration);
      chrome.runtime?.sendMessage?.({ type: "prefetch-hit", timeSavedMs: Math.round(saved) });
    } catch {}
  }

  // ---------- Boot ----------
  function boot() {
    const run = () => {
      installSpeculationRules();
      installHoverBadge();
      installCommands();
      installSpeedMeasure();
      watchNewLinks();

      if ("requestIdleCallback" in window) {
        requestIdleCallback(prefetchAllLinks, { timeout: 1000 });
      } else {
        setTimeout(prefetchAllLinks, 200);
      }
      setInterval(prefetchAllLinks, 3000);
    };

    try {
      chrome.runtime?.sendMessage?.({ type: "get-settings" }, (s) => {
        if (chrome.runtime.lastError) { run(); return; }
        SETTINGS = { ...SETTINGS, ...s };
        if (SETTINGS.enabled && !hostBlocked()) run();
      });
    } catch { run(); }
  }

  chrome.storage?.onChanged?.addListener((changes) => {
    if (changes.settings) SETTINGS = { ...SETTINGS, ...changes.settings.newValue };
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
