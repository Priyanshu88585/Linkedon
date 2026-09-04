// ─── Extension Popup Script ────────────────────────────────────────────────────
// Renders the popup UI and orchestrates enrichment from the active tab

const APP_URL = "https://app.linkedon.io";

interface AuthState {
  accessToken?: string;
  user?: { name: string; email: string };
  credits?: number;
}

interface EnrichResult {
  category: string;
  value: string;
  confidence: number;
  source: string;
  verified: boolean;
}

// ─── State ────────────────────────────────────────────────────────────────────

let auth: AuthState = {};
let currentTab: chrome.tabs.Tab | null = null;
let currentProfile: { url: string; name?: string; title?: string; inputType: string } | null = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // Get auth state
  auth = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_AUTH" }, (response) => {
      resolve(response ?? {});
    });
  });

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Detect profile from URL
  currentProfile = detectProfile(tab?.url ?? "");

  // Get credits
  if (auth.accessToken) {
    try {
      const res = await fetch(
        `${chrome.runtime.getURL("").replace(/\/$/, "").replace("chrome-extension://", "https://api.linkedon.io").split("/")[0]}/api/v1/credits`,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      const d = await res.json();
      auth.credits = d?.data?.balance;
    } catch {}
  }

  render();
}

// ─── Profile Detection ────────────────────────────────────────────────────────

function detectProfile(url: string): { url: string; inputType: string; name?: string } | null {
  if (url.includes("linkedin.com/in/")) {
    return { url, inputType: "linkedin_url" };
  }
  if (url.includes("github.com/") && !url.includes("github.com/features")) {
    return { url, inputType: "github_url" };
  }
  return null;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render(state: "idle" | "loading" | "results" | "no_result" | "error" = "idle", data?: any) {
  const root = document.getElementById("root")!;
  root.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "popup-header";
  header.innerHTML = `
    <div class="logo">L</div>
    <span class="popup-title">Linkedon</span>
    ${auth.accessToken && auth.credits !== undefined ? `<span class="credits-badge">${auth.credits} credits</span>` : ""}
  `;
  root.appendChild(header);

  if (!auth.accessToken) {
    renderAuth(root);
  } else if (state === "loading") {
    renderLoading(root);
  } else if (state === "results") {
    renderResults(root, data);
  } else if (state === "no_result") {
    renderNoResult(root);
  } else if (state === "error") {
    renderError(root, data?.message);
  } else {
    renderIdle(root);
  }

  renderFooter(root);
}

function renderAuth(root: HTMLElement) {
  const div = document.createElement("div");
  div.className = "auth-screen";
  div.innerHTML = `
    <p>Sign in to Linkedon to start enriching professional profiles.</p>
    <button class="btn-primary" id="signin-btn">Sign in to Linkedon</button>
  `;
  root.appendChild(div);
  document.getElementById("signin-btn")!.addEventListener("click", () => {
    chrome.tabs.create({ url: `${APP_URL}/login` });
    window.close();
  });
}

function renderIdle(root: HTMLElement) {
  const div = document.createElement("div");
  div.className = "enrich-area";

  if (!currentProfile) {
    div.innerHTML = `
      <div class="no-result">
        <p>Navigate to a LinkedIn or GitHub profile to enrich contact data.</p>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="enrich-url">${currentProfile.url}</div>
      <button class="btn-primary" id="enrich-btn">⚡ Enrich this profile (1 credit)</button>
    `;
    root.appendChild(div);
    document.getElementById("enrich-btn")!.addEventListener("click", startEnrich);
    return;
  }

  root.appendChild(div);
}

function renderLoading(root: HTMLElement) {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="spinner"></div>
    <p style="text-align:center;color:#666;font-size:12px;padding-bottom:16px;">
      Querying authorized data sources...
    </p>
  `;
  root.appendChild(div);
}

function renderResults(root: HTMLElement, results: EnrichResult[]) {
  const div = document.createElement("div");
  div.className = "enrich-area";
  div.innerHTML = `<div style="color:#22c55e;font-size:12px;font-weight:600;margin-bottom:12px;">✓ Contact enriched</div>`;
  results.forEach((r) => {
    const item = document.createElement("div");
    item.className = "result-item";
    item.innerHTML = `
      <div class="result-icon">${r.category === "email" ? "✉" : "📞"}</div>
      <div style="flex:1;min-width:0;">
        <div class="result-value">${r.value}</div>
        <div class="result-meta">Confidence ${Math.round(r.confidence * 100)}% · ${r.source}</div>
      </div>
      ${r.verified ? `<span class="verified-badge">Verified</span>` : ""}
      <button class="copy-btn" data-value="${r.value}" title="Copy">⎘</button>
    `;
    div.appendChild(item);
  });
  root.appendChild(div);

  // Copy buttons
  div.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = (btn as HTMLElement).dataset.value ?? "";
      navigator.clipboard.writeText(value).catch(() => {});
      (btn as HTMLElement).textContent = "✓";
      setTimeout(() => { (btn as HTMLElement).textContent = "⎘"; }, 1500);
    });
  });
}

function renderNoResult(root: HTMLElement) {
  const div = document.createElement("div");
  div.className = "no-result";
  div.innerHTML = `<p>No contact data found for this profile.<br>Try another profile or contact us.</p>`;
  root.appendChild(div);
}

function renderError(root: HTMLElement, message?: string) {
  const div = document.createElement("div");
  div.className = "error-msg";
  div.textContent = message ?? "Something went wrong. Please try again.";
  root.appendChild(div);
  renderIdle(root);
}

function renderFooter(root: HTMLElement) {
  const footer = document.createElement("div");
  footer.className = "popup-footer";
  if (auth.user) {
    footer.innerHTML = `
      <span class="footer-link">${auth.user.email}</span>
      <button class="footer-link" id="logout-btn">Sign out</button>
    `;
    root.appendChild(footer);
    document.getElementById("logout-btn")!.addEventListener("click", async () => {
      await chrome.storage.local.remove(["accessToken", "refreshToken", "user"]);
      auth = {};
      render();
    });
  } else {
    footer.innerHTML = `<span class="footer-link">Linkedon v1.0.0</span>`;
    root.appendChild(footer);
  }
}

// ─── Enrich ───────────────────────────────────────────────────────────────────

async function startEnrich() {
  if (!currentProfile) return;
  render("loading");
  try {
    const result = await chrome.runtime.sendMessage({
      type: "ENRICH_PROFILE",
      payload: { input: currentProfile.url, inputType: currentProfile.inputType },
    });
    if (!result?.success) throw new Error(result?.error ?? "Enrichment failed");
    if (result?.noResult || !result.data?.results?.length) {
      render("no_result");
    } else {
      render("results", result.data.results);
    }
  } catch (err) {
    render("error", { message: err instanceof Error ? err.message : "Enrichment failed" });
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

init().catch(console.error);
