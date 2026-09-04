// ─── LinkedIn Content Script ───────────────────────────────────────────────────
// Injects a subtle "Enrich with Linkedon" button on LinkedIn profile pages.
// Does NOT read or extract page data automatically — only activates on user click.

const BUTTON_ID = "linkedon-enrich-btn";

function injectButton() {
  if (document.getElementById(BUTTON_ID)) return;

  // Find the action buttons area on profile pages
  const actionsContainer =
    document.querySelector(".pvs-profile-actions") ??
    document.querySelector('[data-member-id]') ??
    document.querySelector(".pv-top-card--list");

  if (!actionsContainer) return;

  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;color:#fff;background:#7c3aed;border:none;border-radius:20px;padding:6px 14px;cursor:pointer;transition:opacity 0.15s;">
      ⚡ Enrich with Linkedon
    </span>
  `;
  btn.style.cssText = "border:none;background:none;padding:0;margin-left:8px;cursor:pointer;";
  btn.setAttribute("aria-label", "Enrich this profile with Linkedon");

  btn.addEventListener("click", () => {
    // Open popup instead of doing anything inline
    chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
  });

  btn.addEventListener("mouseenter", () => {
    const inner = btn.querySelector("span");
    if (inner) inner.style.opacity = "0.85";
  });

  btn.addEventListener("mouseleave", () => {
    const inner = btn.querySelector("span");
    if (inner) inner.style.opacity = "1";
  });

  actionsContainer.appendChild(btn);
}

// Observe DOM changes for SPA navigation
const observer = new MutationObserver(() => {
  if (window.location.pathname.startsWith("/in/")) {
    setTimeout(injectButton, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial inject
if (window.location.pathname.startsWith("/in/")) {
  setTimeout(injectButton, 2000);
}
