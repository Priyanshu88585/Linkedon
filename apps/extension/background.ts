// ─── Background Service Worker ─────────────────────────────────────────────────
// Manages auth state, communicates with Linkedon API, and coordinates
// between content scripts and popup.

const API_BASE = "https://api.linkedon.io"; // Override in dev

// ─── Message handling ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ENRICH_PROFILE") {
    handleEnrich(message.payload).then(sendResponse).catch((err) => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // async response
  }

  if (message.type === "GET_AUTH") {
    chrome.storage.local.get(["accessToken", "user"], (data) => {
      sendResponse({ accessToken: data.accessToken, user: data.user });
    });
    return true;
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.remove(["accessToken", "refreshToken", "user"], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// ─── Enrich profile ────────────────────────────────────────────────────────────

async function handleEnrich(payload: { input: string; inputType: string }) {
  const { accessToken } = await chrome.storage.local.get("accessToken");
  if (!accessToken) throw new Error("Not authenticated. Please sign in.");

  const res = await fetch(`${API_BASE}/api/v1/enrichment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      input: payload.input,
      inputType: payload.inputType,
      saveContact: true,
    }),
  });

  if (res.status === 401) {
    // Try refresh
    const refreshed = await refreshToken();
    if (!refreshed) throw new Error("Session expired. Please sign in again.");
    return handleEnrich(payload);
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message ?? "Enrichment failed");

  // Poll for result
  const enrichmentId = data.data.enrichmentId;
  return pollEnrichment(enrichmentId, accessToken);
}

async function pollEnrichment(id: string, token: string, attempts = 0): Promise<any> {
  if (attempts > 20) throw new Error("Enrichment timed out");

  await new Promise((r) => setTimeout(r, 1500));

  const res = await fetch(`${API_BASE}/api/v1/enrichment/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const status = data.data?.status;

  if (status === "completed") return { success: true, data: data.data };
  if (status === "no_result") return { success: true, data: data.data, noResult: true };
  if (status === "failed") throw new Error(data.data?.error ?? "Enrichment failed");

  return pollEnrichment(id, token, attempts + 1);
}

// ─── Token refresh ──────────────────────────────────────────────────────────────

async function refreshToken(): Promise<boolean> {
  const { refreshToken } = await chrome.storage.local.get("refreshToken");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (!data.success) return false;

    await chrome.storage.local.set({
      accessToken: data.data.tokens.accessToken,
      refreshToken: data.data.tokens.refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Installation / Update ────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://app.linkedon.io/extension-welcome" });
  }
});

export {};
