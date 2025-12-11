const { ipcRenderer, shell } = require("electron");

// STATE
const state = {
  currentValue: 0,
  isRunning: false,
  isPaused: false,
  metricType: "time",
  customUnit: "",
  events: [],
  totalEvents: 0,
  valueAdded: 0,
  config: {
    subValue: 120,
    giftValue: 60,
    bitsValue: 30,
    donationValue: 60,
    followValue: 0
  },
  platforms: {
    twitch: { connected: false, ws: null },
    kick: { connected: false }
  },
  reducer: {
    enabled: false,
    amountPerSecond: 1
  },
  overlay: {
    port: 55814,
    fontSize: 72,
    textColor: "#ffffff",
    background: "transparent",
    bgColor: "#000000"
  },
  kick: {
    clientId: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: "",
    linkedUser: "",
    appConfigured: false,
    accountLinked: false
  },
  settings: {
    autoSave: false,
    soundAlerts: false,
    startMinimized: false
  }
};

let intervalId = null;
let reducerIntervalId = null;

// DOM Elements
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const mainDisplay = document.getElementById("mainDisplay");
const displayUnit = document.getElementById("displayUnit");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const editValueBtn = document.getElementById("editValueBtn");
const totalEventsEl = document.getElementById("totalEvents");
const valueAddedEl = document.getElementById("valueAdded");
const eventsList = document.getElementById("eventsList");
const connectionStatus = document.getElementById("connectionStatus");

const exportConfigBtn = document.getElementById("exportConfigBtn");
const importConfigBtn = document.getElementById("importConfigBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

const addManualEventBtn = document.getElementById("addManualEventBtn");
const manualEntrySection = document.getElementById("manualEntrySection");
const submitManualEventBtn = document.getElementById("submitManualEventBtn");
const manualEventDesc = document.getElementById("manualEventDesc");
const manualEventPlatform = document.getElementById("manualEventPlatform");
const manualEventValue = document.getElementById("manualEventValue");

const metricType = document.getElementById("metricType");
const customUnitSection = document.getElementById("customUnitSection");
const customUnitInput = document.getElementById("customUnit");
const startingValue = document.getElementById("startingValue");
const saveMetricsBtn = document.getElementById("saveMetricsBtn");

const overlayPortInput = document.getElementById("overlayPort");
const fontSize = document.getElementById("fontSize");
const fontSizeValue = document.getElementById("fontSizeValue");
const textColor = document.getElementById("textColor");
const overlayBackground = document.getElementById("overlayBackground");
const bgColor = document.getElementById("bgColor");
const previewText = document.getElementById("previewText");
const previewUnit = document.getElementById("previewUnit");

const reducerEnabledCheckbox = document.getElementById("reducerEnabled");
const reducerAmountInput = document.getElementById("reducerAmount");
const saveReducerBtn = document.getElementById("saveReducerBtn");
const toggleReducerBtn = document.getElementById("toggleReducerBtn");

const unitLabels = document.querySelectorAll(".unit-label");

const autoSaveCheckbox = document.getElementById("autoSave");
const soundAlertsCheckbox = document.getElementById("soundAlerts");
const startMinimizedCheckbox = document.getElementById("startMinimized");

// Twitch
const twitchConnectBtn = document.getElementById("twitchConnectBtn");
const twitchChannel = document.getElementById("twitchChannel");
const twitchToken = document.getElementById("twitchToken");
const twitchStatus = document.getElementById("twitchStatus");

// Kick
const kickClientIdInput = document.getElementById("kickClientId");
const kickClientSecretInput = document.getElementById("kickClientSecret");
const kickSaveAppBtn = document.getElementById("kickSaveAppBtn");
const kickLinkAccountBtn = document.getElementById("kickLinkAccountBtn");
const kickStatus = document.getElementById("kickStatus");
const kickUsername = document.getElementById("kickUsername");

// Edit Modal
const editModal = document.getElementById("editModal");
const editValueInput = document.getElementById("editValueInput");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");

// Window controls
document.getElementById("minimizeBtn").addEventListener("click", () => ipcRenderer.send("window-minimize"));
document.getElementById("maximizeBtn").addEventListener("click", () => ipcRenderer.send("window-maximize"));
document.getElementById("closeBtn").addEventListener("click", () => ipcRenderer.send("window-close"));

ipcRenderer.on("window-maximized", () => {
  document.querySelector(".max-icon").style.display = "none";
  document.querySelector(".restore-icon").style.display = "block";
});
ipcRenderer.on("window-unmaximized", () => {
  document.querySelector(".max-icon").style.display = "block";
  document.querySelector(".restore-icon").style.display = "none";
});

// NAVIGATION
navItems.forEach(item => {
  item.addEventListener("click", () => {
    const pageId = item.dataset.page;
    navItems.forEach(n => n.classList.remove("active"));
    pages.forEach(p => p.classList.remove("active"));
    item.classList.add("active");
    document.getElementById(pageId).classList.add("active");
    const titleEl = document.getElementById("currentPageTitle");
    if (titleEl) titleEl.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
    window.currentPage = pageId;
  });
});

// UTILS
function getUnitDisplay() {
  if (state.metricType === "time") return "TIME";
  if (state.metricType === "distance") return "KM";
  return state.customUnit.toUpperCase() || "UNITS";
}

function updateUnitLabels() {
  unitLabels.forEach(el => {
    if (state.metricType === "time") el.textContent = "seconds";
    else if (state.metricType === "distance") el.textContent = "meters";
    else el.textContent = state.customUnit || "units";
  });
}

function formatValue(value) {
  if (state.metricType === "time") {
    const abs = Math.abs(Math.round(value));
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    const sign = value < 0 ? "-" : "";
    return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return value.toFixed(2);
}

function updateDisplay() {
  const formatted = formatValue(state.currentValue);
  const unit = getUnitDisplay();
  mainDisplay.textContent = formatted;
  displayUnit.textContent = unit;
  if (previewText) previewText.textContent = formatted;
  if (previewUnit) previewUnit.textContent = unit;
  ipcRenderer.send("overlay-update", { value: formatted, unit });
}

function updateStats() {
  totalEventsEl.textContent = state.totalEvents;
  if (state.metricType === "time") {
    valueAddedEl.textContent = `+${formatValue(state.valueAdded)}`;
  } else {
    valueAddedEl.textContent = `+${state.valueAdded.toFixed(2)}`;
  }
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function clearEvents() {
  eventsList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>No events yet. Connect a platform or add manual events.</p>
    </div>`;
}

// CONFIG SAVE/LOAD
function collectSettingsPayload() {
  const overlayPort = parseInt(overlayPortInput?.value || "55814", 10) || 55814;
  state.overlay.port = overlayPort;

  const overlayCfg = {
    fontSize: parseInt(fontSize?.value || "72", 10),
    textColor: textColor?.value || "#ffffff",
    background: overlayBackground?.value || "transparent",
    bgColor: bgColor?.value || "#000000"
  };

  const settings = {
    autoSave: !!autoSaveCheckbox?.checked,
    soundAlerts: !!soundAlertsCheckbox?.checked,
    startMinimized: !!startMinimizedCheckbox?.checked
  };
  state.settings = settings;

  return {
    overlayPort,
    kick: { ...state.kick },
    state: {
      currentValue: state.currentValue,
      metricType: state.metricType,
      customUnit: state.customUnit,
      config: state.config,
      events: state.events,
      totalEvents: state.totalEvents,
      valueAdded: state.valueAdded,
      reducer: state.reducer
    },
    settings,
    overlay: overlayCfg
  };
}

function saveAllConfig() {
  ipcRenderer.send("save-config", {
    overlayPort: state.overlay.port,
    kick: state.kick,
    metricState: {
      currentValue: state.currentValue,
      metricType: state.metricType,
      customUnit: state.customUnit,
      config: state.config,
      events: state.events,
      totalEvents: state.totalEvents,
      valueAdded: state.valueAdded,
    },
    reducer: state.reducer,
    settings: state.settings,
    overlay: state.overlay
  });
}

saveSettingsBtn.addEventListener("click", () => {
  saveAllConfig();
  showToast("All settings saved!", "success");
});

// TIMER
startBtn.addEventListener("click", () => {
  if (!state.isRunning && state.metricType === "time") {
    state.isRunning = true;
    state.isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    intervalId = setInterval(() => {
      if (!state.isPaused) {
        state.currentValue--;
        if (state.currentValue <= 0) {
          state.currentValue = 0;
          stopTimer();
        }
        updateDisplay();
        saveAllConfig();
      }
    }, 1000);
  }
});

pauseBtn.addEventListener("click", () => {
  state.isPaused = !state.isPaused;
  pauseBtn.textContent = state.isPaused ? "Resume" : "Pause";
  saveAllConfig();
});

resetBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset? This will clear all progress.")) {
    stopTimer();
    state.currentValue = 0;
    state.events = [];
    state.totalEvents = 0;
    state.valueAdded = 0;
    updateDisplay();
    updateStats();
    clearEvents();
    saveAllConfig();
  }
});

function stopTimer() {
  state.isRunning = false;
  state.isPaused = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}

// REDUCER
function startReducer() {
  if (reducerIntervalId || !state.reducer.enabled) return;
  reducerIntervalId = setInterval(() => {
    if (state.currentValue <= 0) {
      state.currentValue = 0;
      updateDisplay();
      return;
    }
    const delta = state.reducer.amountPerSecond || 0;
    if (!delta) return;
    state.currentValue -= delta;
    if (state.currentValue < 0) state.currentValue = 0;
    updateDisplay();
    saveAllConfig();
  }, 1000);
}

function stopReducer() {
  if (reducerIntervalId) clearInterval(reducerIntervalId);
  reducerIntervalId = null;
}

// KICK AUTH HELPERS
async function refreshKickTokenIfNeeded() {
  if (!state.kick.refreshToken || !state.kick.clientId || !state.kick.clientSecret) return false;

  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: state.kick.refreshToken,
      client_id: state.kick.clientId,
      client_secret: state.kick.clientSecret,
    });

    const response = await fetch("https://id.kick.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    // Check for HTTP errors specifically (400+ = bad token)
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        // Client errors: likely invalid/revoked token
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      } else {
        // Server/network errors: don't clear, retry later
        console.warn(`Kick refresh failed (HTTP ${response.status}) - will retry later`);
        return false;
      }
    }

    const data = await response.json();

    state.kick.accessToken = data.access_token;
    state.kick.refreshToken = data.refresh_token || state.kick.refreshToken;
    state.kick.accountLinked = true;

    // Optional: Update username if missing
    if (!state.kick.linkedUser) {
      try {
        // Correct user endpoint (per Kick docs)
        const userRes = await fetch("https://api.kick.com/api/v2/users", {
          headers: { Authorization: `Bearer ${state.kick.accessToken}` }
        });
        if (userRes.ok) {
          const users = await userRes.json();
          // Assumes it returns array with your user; adjust if needed
          state.kick.linkedUser = users.data?.[0]?.slug || "kick_user";
        }
      } catch (_) {
        console.warn("User fetch failed, keeping existing username");
      }
    }

    saveAllConfig();
    refreshKickUI();
    console.log("Kick token refreshed successfully");
    return true;

  } catch (err) {
    // Network/DNS errors: don't clear tokens
    if (err.name === 'TypeError' && err.message.includes('fetch') || err.message.includes('ERR_NAME_NOT_RESOLVED')) {
      console.error("Network/DNS error during Kick refresh - keeping tokens, check your connection:", err.message);
      return false;  // Don't clear!
    }
    // Only clear on actual auth failures
    console.warn("Kick refresh token invalid or revoked – clearing link", err);
    clearKickLinkSilently();
    return false;
  }
}

function clearKickLinkSilently() {
  state.kick.accessToken = "";
  state.kick.refreshToken = "";
  state.kick.linkedUser = "";
  state.kick.accountLinked = false;
  saveAllConfig();
}

function clearKickLink() {
  clearKickLinkSilently();
  refreshKickUI();
  showToast("Kick account unlinked", "info");
}

// KICK UI
document.querySelectorAll(".secret-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (input) input.type = input.type === "password" ? "text" : "password";
  });
});

function refreshKickUI() {
  if (!kickStatus) return;

  const isLinked = !!state.kick.accessToken && state.kick.accountLinked;

  if (isLinked) {
    kickStatus.textContent = "Connected";
    kickStatus.classList.add("connected");
    kickLinkAccountBtn.textContent = "Unlink Account";
    kickLinkAccountBtn.classList.remove("btn-secondary");
    kickLinkAccountBtn.classList.add("btn-danger");
  } else if (state.kick.clientId && state.kick.clientSecret) {
    kickStatus.textContent = "App configured";
    kickStatus.classList.remove("connected");
    kickLinkAccountBtn.textContent = "Link Account";
    kickLinkAccountBtn.classList.remove("btn-danger");
    kickLinkAccountBtn.classList.add("btn-secondary");
  } else {
    kickStatus.textContent = "Not Connected";
    kickStatus.classList.remove("connected");
    kickLinkAccountBtn.textContent = "Link Account";
    kickLinkAccountBtn.classList.remove("btn-danger");
    kickLinkAccountBtn.classList.add("btn-secondary");
  }

  kickUsername.textContent = state.kick.linkedUser ? `Linked as: ${state.kick.linkedUser}` : "";
  if (kickClientIdInput) kickClientIdInput.value = state.kick.clientId || "";
  if (kickClientSecretInput) kickClientSecretInput.value = state.kick.clientSecret || "";
}

kickSaveAppBtn?.addEventListener("click", () => {
  state.kick.clientId = kickClientIdInput.value.trim();
  state.kick.clientSecret = kickClientSecretInput.value.trim();
  if (!state.kick.clientId || !state.kick.clientSecret) {
    showToast("Client ID and Secret required", "error");
    return;
  }
  clearKickLinkSilently();
  saveAllConfig();
  refreshKickUI();
  showToast("Kick app saved. Now link your account.", "success");
});

kickLinkAccountBtn?.addEventListener("click", () => {
  if (state.kick.accessToken && state.kick.accountLinked) {
    if (confirm("Unlink your Kick account?")) clearKickLink();
  } else {
    if (!state.kick.clientId || !state.kick.clientSecret) {
      showToast("Configure Kick app first", "error");
      return;
    }
    const port = state.overlay.port || 55814;
    shell.openExternal(`http://localhost:${port}/kick/auth`);
  }
});

ipcRenderer.on("kick-linked", (event, kickData) => {
  state.kick = { ...state.kick, ...kickData, accountLinked: true };
  saveAllConfig();
  refreshKickUI();
  showToast("Kick account linked!", "success");
});

// EVENTS
function addEvent(type, platform, rawValue) {
  let delta = rawValue;
  if (state.metricType === "distance") delta = rawValue / 1000;
  state.currentValue += delta;
  state.totalEvents++;
  state.valueAdded += delta;

  const event = { type, platform, value: delta, rawValue, timestamp: new Date().toISOString() };
  state.events.unshift(event);
  if (state.events.length > 50) state.events.pop();

  updateDisplay();
  updateStats();
  addEventToList(event);
  saveAllConfig();
}

function addEventToList(event) {
  if (eventsList.querySelector(".empty-state")) eventsList.innerHTML = "";
  const item = document.createElement("div");
  item.className = "event-item";
  const iconBg = event.platform === "Twitch" ? "#9146ff" : "#53fc18";
  const icon = event.platform === "Twitch" ? "TV" : "Lightning";
  item.innerHTML = `
    <div class="event-icon" style="background:${iconBg};">${icon}</div>
    <div class="event-content">
      <div class="event-title">${event.type}</div>
      <div class="event-meta">${event.platform} • ${formatTime(event.timestamp)}</div>
    </div>
    <div class="event-value">+${formatValue(event.value)}</div>
  `;
  eventsList.insertBefore(item, eventsList.firstChild);
}

function renderEventsList() {
  if (!state.events.length) return clearEvents();
  eventsList.innerHTML = "";
  state.events.forEach(addEventToList);
}

function updateConnectionStatus() {
  const connected = state.platforms.twitch.connected || (state.kick.accessToken && state.kick.accountLinked);
  connectionStatus.classList.toggle("connected", connected);
  connectionStatus.nextElementSibling.textContent = connected ? "Connected" : "Disconnected";
}

// CONFIG LOAD + AUTO REFRESH
ipcRenderer.send("load-config");
ipcRenderer.on("config-loaded", async (event, data) => {
  if (data) {
    if (data.overlayPort) state.overlay.port = data.overlayPort;
    if (data.kick) state.kick = { ...state.kick, ...data.kick };
    if (data.metricState) {
      state.currentValue = data.metricState.currentValue ?? 0;
      state.metricType = data.metricState.metricType ?? "time";
      state.customUnit = data.metricState.customUnit ?? "";
      state.config = data.metricState.config ?? state.config;
      state.events = data.metricState.events ?? [];
      state.totalEvents = data.metricState.totalEvents ?? 0;
      state.valueAdded = data.metricState.valueAdded ?? 0;
    }
    if (data.settings) state.settings = { ...state.settings, ...data.settings };
    if (data.overlay) state.overlay = { ...state.overlay, ...data.overlay };
  }

  // ────────────────────────────────
  // APPLY EVERYTHING TO UI (in correct order!)
  // ────────────────────────────────

  // Metric type & custom unit
  if (metricType) metricType.value = state.metricType || "time";
  if (customUnitInput) customUnitInput.value = state.customUnit || "";
  if (customUnitSection) {
    customUnitSection.style.display = state.metricType === "custom" ? "block" : "none";
  }

  // Settings checkboxes
  if (autoSaveCheckbox) autoSaveCheckbox.checked = !!state.settings.autoSave;
  if (soundAlertsCheckbox) soundAlertsCheckbox.checked = !!state.settings.soundAlerts;
  if (startMinimizedCheckbox) startMinimizedCheckbox.checked = !!state.settings.startMinimized;

  // Overlay settings
  if (overlayPortInput) overlayPortInput.value = state.overlay.port;
  if (fontSize) {
    fontSize.value = state.overlay.fontSize;
    fontSizeValue.textContent = `${state.overlay.fontSize}px`;
    if (previewText) previewText.style.fontSize = `${state.overlay.fontSize}px`;
  }
  if (textColor) {
    textColor.value = state.overlay.textColor;
    if (previewText) previewText.style.color = state.overlay.textColor;
    if (previewUnit) previewUnit.style.color = state.overlay.textColor;
  }
  if (overlayBackground) overlayBackground.value = state.overlay.background;
  if (bgColor) bgColor.value = state.overlay.bgColor;

  // Reducer
  if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = !!state.reducer.enabled;
  if (reducerAmountInput) reducerAmountInput.value = state.reducer.amountPerSecond;
  if (state.reducer.enabled) startReducer();

  // Kick
  if (state.kick.refreshToken) await refreshKickTokenIfNeeded();
  refreshKickUI();

  // Final UI refresh
  updateUnitLabels();
  updateDisplay();
  updateStats();
  updateStats();
  renderEventsList();
});

// TOAST
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  if (container.children.length >= 5) container.children[0].remove();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-body"><div class="toast-message">${message}</div><button class="toast-close">×</button></div><div class="toast-progress"><div class="toast-progress-bar"></div></div>`;
  container.appendChild(toast);
  toast.querySelector(".toast-close").onclick = () => toast.remove();
  setTimeout(() => toast.remove(), 5000);
}

// INIT
updateDisplay();
updateStats();
clearEvents();
updateUnitLabels();

// TEST EVENT
window.addTestEvent = () => addEvent(["Sub", "Gift", "Bits", "Donation"][Math.floor(Math.random()*4)], ["Twitch", "KICK"][Math.floor(Math.random()*2)], Math.random()*300 + 30);
document.addEventListener("keydown", e => e.ctrlKey && e.key === "t" && window.addTestEvent());

// OPEN EDIT MODAL
editValueBtn.addEventListener("click", () => {
  editValueInput.value = state.metricType === "time" ? mainDisplay.textContent : state.currentValue;
  editModal.classList.add("show");
  editValueInput.select();
});

// CLOSE MODAL
const closeEditModal = () => editModal.classList.remove("show");
closeModalBtn.onclick = closeEditModal;
cancelEditBtn.onclick = closeEditModal;
editModal.onclick = (e) => e.target === editModal && closeEditModal();

// SAVE EDITED VALUE
saveEditBtn.addEventListener("click", () => {
  const input = editValueInput.value.trim();
  let newVal = 0;

  if (state.metricType === "time") {
    if (/^\d+$/.test(input)) newVal = Number(input);
    else if (/^\d{1,2}:\d{2}:\d{2}$/.test(input)) {
      const [h,m,s] = input.split(":").map(Number);
      newVal = h*3600 + m*60 + s;
    } else {
      showToast("Use HH:MM:SS or seconds", "error");
      return;
    }
  } else {
    newVal = parseFloat(input) || 0;
  }

  state.currentValue = newVal < 0 ? 0 : newVal;
  updateDisplay();
  saveAllConfig();
  showToast("Value updated", "success");
  closeEditModal();
});

// TOGGLE REDUCER BUTTON – Dashboard quick toggle
toggleReducerBtn.addEventListener("click", () => {
  state.reducer.enabled = !state.reducer.enabled;

  // Sync checkbox in Reducer tab
  if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = state.reducer.enabled;

  if (state.reducer.enabled) {
    startReducer();
    toggleReducerBtn.innerHTML = `<i class="fas fa-check-circle" style="color: #53fc18; font-size: 18px;"></i>`;
    toggleReducerBtn.title = "Reducer ACTIVE – Click to disable";
    showToast("Reducer ENABLED", "success");
  } else {
    stopReducer();
    toggleReducerBtn.innerHTML = `<i class="fas fa-ban" style="color: #ff4444; font-size: 18px;"></i>`;
    toggleReducerBtn.title = "Reducer OFF – Click to enable";
    showToast("Reducer DISABLED", "info");
  }

  saveAllConfig();
});

// ================================================
// METRICS TAB – FULLY AUTOMATIC & INSTANT UPDATE
// ================================================

// Auto-save + instantly apply every change (no Save button needed anymore)
function applyMetricsNow() {
  // 1. Metric Type
  const newType = metricType.value;
  state.metricType = newType;

  // 2. Custom Unit
  if (newType === "custom") {
    state.customUnit = customUnitInput.value.trim() || "Units";
    customUnitSection.style.display = "block";
  } else {
    state.customUnit = "";
    customUnitSection.style.display = "none";
  }

  // 3. Event Values – live update
  state.config.subValue      = parseInt(document.getElementById("subValue").value)      || 0;
  state.config.giftValue     = parseInt(document.getElementById("giftValue").value)     || 0;
  state.config.bitsValue     = parseInt(document.getElementById("bitsValue").value)     || 0;
  state.config.donationValue = parseInt(document.getElementById("donationValue").value) || 0;
  state.config.followValue   = parseInt(document.getElementById("followValue").value)   || 0;

  // 4. Update UI instantly
  updateUnitLabels();
  updateDisplay();

  // 5. Auto-save to disk
  saveAllConfig();
}

// Listen to EVERY input change in Metrics tab
metricType.addEventListener("change", applyMetricsNow);

customUnitInput.addEventListener("input", applyMetricsNow);

document.getElementById("subValue").addEventListener("input", applyMetricsNow);
document.getElementById("giftValue").addEventListener("input", applyMetricsNow);
document.getElementById("bitsValue").addEventListener("input", applyMetricsNow);
document.getElementById("donationValue").addEventListener("input", applyMetricsNow);
document.getElementById("followValue").addEventListener("input", applyMetricsNow);

// Optional: Also apply on page load (in case config was loaded)
ipcRenderer.on("config-loaded", () => {
  setTimeout(applyMetricsNow, 100); // tiny delay to make sure DOM is ready
});

// Show/hide custom unit field instantly
metricType.addEventListener("change", () => {
  customUnitSection.style.display = metricType.value === "custom" ? "block" : "none";
});

// Remove the old Save button completely (or just hide it)
if (saveMetricsBtn) {
  saveMetricsBtn.style.display = "none"; // or remove the whole button from HTML
}

// ===================
// MANUAL EVENT BUTTONS
// ===================

// 1. Open the manual entry form
addManualEventBtn?.addEventListener("click", () => {
  manualEntrySection.style.display = 
    manualEntrySection.style.display === "block" ? "none" : "block";
  
  if (manualEntrySection.style.display === "block") {
    manualEventDesc.focus();
  }
});

// 2. Actually add the event when clicking "Add Event"
submitManualEventBtn?.addEventListener("click", () => {
  const desc = manualEventDesc.value.trim();
  const platform = manualEventPlatform.value;
  const rawValue = parseFloat(manualEventValue.value) || 0;

  if (rawValue <= 0) {
    showToast("Enter a positive value", "error");
    return;
  }

  // Use description or fallback to event type
  const type = desc || `${platform} Manual`;

  // Add the event (same function used by Twitch/Kick)
  addEvent(type, platform, rawValue);

  // Reset form + hide it
  manualEventDesc.value = "";
  manualEventValue.value = "120";
  manualEntrySection.style.display = "none";

  showToast("Manual event added!", "success");
});

// Optional: Press Enter to submit
manualEventValue?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitManualEventBtn.click();
});

saveReducerBtn.addEventListener("click", () => {
  state.reducer.enabled = reducerEnabledCheckbox.checked;
  state.reducer.amountPerSecond = parseFloat(reducerAmountInput.value) || 0;

  if (state.reducer.enabled) startReducer();
  else stopReducer();

  saveAllConfig();
  showToast("Reducer saved!", "success");
});