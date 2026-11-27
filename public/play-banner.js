/*
 * "Get it on Google Play" banner for Android browsers.
 * iPhone uses Apple's built-in Smart App Banner (meta apple-itunes-app in index.html).
 * Never shows inside the EXPal Android app, on iOS or on desktop.
 * Closing it hides it for 14 days on that browser.
 */
(function () {
  var PLAY_URL = "https://play.google.com/store/apps/details?id=com.yourbrand.expal";
  var KEY = "expal_play_banner_closed_at";
  var HIDE_DAYS = 14;

  try {
    var ua = navigator.userAgent || "";
    if (!/Android/i.test(ua)) return; // Android browsers only
    if (/; wv\)/.test(ua)) return; // Android WebView (our app and in-app browsers)
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return;
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return;

    var closedAt = 0;
    try { closedAt = Number(localStorage.getItem(KEY)) || 0; } catch (e) {}
    if (closedAt && Date.now() - closedAt < HIDE_DAYS * 864e5) return;
  } catch (e) {
    return;
  }

  function show() {
    if (document.getElementById("expal-play-banner")) return;

    var css =
      "#expal-play-banner{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;" +
      "display:flex;align-items:center;gap:12px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));" +
      "background:#fff;border-top:1px solid #eee;box-shadow:0 -4px 18px rgba(0,0,0,.08);" +
      "font-family:'DM Sans',system-ui,-apple-system,sans-serif;color:#1d1d1f}" +
      "#expal-play-banner img{width:44px;height:44px;border-radius:11px;flex:none}" +
      "#expal-play-banner .epb-text{flex:1;min-width:0;line-height:1.25}" +
      "#expal-play-banner .epb-title{font-weight:700;font-size:15px}" +
      "#expal-play-banner .epb-sub{font-size:13px;color:#6b6b70;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#expal-play-banner .epb-get{flex:none;background:#F25C54;color:#fff;text-decoration:none;font-weight:700;" +
      "font-size:14px;padding:9px 16px;border-radius:999px}" +
      "#expal-play-banner .epb-close{flex:none;background:none;border:0;font-size:22px;line-height:1;color:#8e8e93;" +
      "padding:4px 6px;cursor:pointer}";

    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.id = "expal-play-banner";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Get the EXPal app");
    bar.innerHTML =
      '<button type="button" class="epb-close" aria-label="Close">&times;</button>' +
      '<img src="/logo192.png" alt="" />' +
      '<div class="epb-text"><div class="epb-title">EXPal</div>' +
      '<div class="epb-sub">Free on Android</div></div>' +
      '<a class="epb-get" href="' + PLAY_URL + '" target="_blank" rel="noopener">Open in Play Store</a>';
    document.body.appendChild(bar);
    // Keep page content from hiding behind the bar.
    var prevPad = document.body.style.paddingBottom;
    document.body.style.paddingBottom = bar.offsetHeight + "px";

    bar.querySelector(".epb-close").addEventListener("click", function () {
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
      bar.parentNode && bar.parentNode.removeChild(bar);
      document.body.style.paddingBottom = prevPad;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", show);
  } else {
    show();
  }
})();
