const { ipcRenderer } = require("electron");
const { state } = require("./state");
const { updateDisplay, updateStats, updateUnitLabels } = require("./display");
const { applyOverlayChanges } = require("./overlay");
const { refreshKickUI } = require("./kick");
const { applyMetricsNow } = require("./metrics");
const { renderEventsList, clearEvents } = require("./events");
const { showToast } = require("./toast");
const { saveAllConfig } = require("./config");

const metricType = document.getElementById("metricType");
const customUnitInput = document.getElementById("customUnit");
const customUnitSection = document.getElementById("customUnitSection");
const reducerEnabledCheckbox = document.getElementById("reducerEnabled");
const reducerAmountInput = document.getElementById("reducerAmount");

const profilesList = document.getElementById("profilesList");
const createProfileBtn = document.getElementById("createProfileBtn");
const createProfileSection = document.getElementById("createProfileSection");
const newProfileName = document.getElementById("newProfileName");
const confirmCreateProfileBtn = document.getElementById("confirmCreateProfileBtn");
const cancelCreateProfileBtn = document.getElementById("cancelCreateProfileBtn");

function canModifyProfiles() {
  return !state.isRunning;
}

function updateProfileButtons() {
  const canModify = canModifyProfiles();
  if (createProfileBtn) createProfileBtn.disabled = !canModify;
  const switchBtns = document.querySelectorAll(".switch-profile-btn");
  const deleteBtns = document.querySelectorAll(".delete-profile-btn");
  switchBtns.forEach(btn => btn.disabled = !canModify);
  deleteBtns.forEach(btn => btn.disabled = !canModify);
}

function renderProfiles() {
  if (!profilesList) return;
  profilesList.innerHTML = "";
  Object.values(state.profiles).forEach(profile => {
    const isActive = profile.id === state.currentProfileId;
    const item = document.createElement("div");
    item.className = "profile-item";
    item.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 12px; background: var(--bg-card); transition: all 0.2s;";
    item.innerHTML = `
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">${profile.name} ${isActive ? '<span style="color: var(--success-color); font-size: 12px;">(Active)</span>' : ''}</div>
        <div style="font-size: 12px; color: var(--text-secondary);">Created: ${new Date(profile.createdAt).toLocaleDateString()}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary switch-profile-btn" data-profile-id="${profile.id}" ${isActive || !canModifyProfiles() ? 'disabled' : ''}>Switch</button>
        <button class="btn btn-danger delete-profile-btn" data-profile-id="${profile.id}" ${isActive || !canModifyProfiles() ? 'disabled' : ''}>Delete</button>
      </div>
    `;
    profilesList.appendChild(item);
  });
  updateProfileButtons();
}

if (createProfileBtn) {
  createProfileBtn.addEventListener("click", () => {
    if (!canModifyProfiles()) {
      showToast("Cannot create profile while subathon is running", "error");
      return;
    }
    createProfileSection.style.display = "block";
    newProfileName.value = "";
    newProfileName.focus();
  });
}

if (cancelCreateProfileBtn) {
  cancelCreateProfileBtn.addEventListener("click", () => {
    createProfileSection.style.display = "none";
  });
}

if (confirmCreateProfileBtn) {
  confirmCreateProfileBtn.addEventListener("click", () => {
    const name = newProfileName.value.trim();
    if (!name) {
      showToast("Please enter a profile name", "error");
      return;
    }
    ipcRenderer.send("create-profile", name);
    createProfileSection.style.display = "none";
    showToast("Profile created!", "success");
  });
}

if (profilesList) {
  profilesList.addEventListener("click", (e) => {
    if (e.target.classList.contains("switch-profile-btn")) {
      if (!canModifyProfiles()) {
        showToast("Cannot switch profile while subathon is running", "error");
        return;
      }
      const profileId = e.target.dataset.profileId;
      if (profileId !== state.currentProfileId) {
        ipcRenderer.send("switch-profile", profileId);
      }
    } else if (e.target.classList.contains("delete-profile-btn")) {
      if (!canModifyProfiles()) {
        showToast("Cannot delete profile while subathon is running", "error");
        return;
      }
      const profileId = e.target.dataset.profileId;
      if (confirm(`Delete profile "${state.profiles[profileId]?.name}"? This cannot be undone.`)) {
        ipcRenderer.send("delete-profile", profileId);
      }
    }
  });
}

ipcRenderer.on("profiles-updated", (event, profiles) => {
  state.profiles = profiles;
  renderProfiles();
});

ipcRenderer.on("profile-switched", (event, { profileId, config: profileConfig }) => {
  state.currentProfileId = profileId;

  if (profileConfig.metricState) {
    state.currentValue = profileConfig.metricState.currentValue ?? 0;
    state.metricType = profileConfig.metricState.metricType ?? "time";
    state.customUnit = profileConfig.metricState.customUnit ?? "";
    state.totalEvents = profileConfig.metricState.totalEvents ?? 0;
    state.valueAdded = profileConfig.metricState.valueAdded ?? 0;
  }
  if (profileConfig.events) state.events = profileConfig.events || [];
  if (profileConfig.reducer) state.reducer = profileConfig.reducer;
  if (profileConfig.overlay) {
    Object.assign(state.overlay, profileConfig.overlay);
    if (!state.overlay.unitPosition) state.overlay.unitPosition = "bottom";
    if (!state.overlay.unitAlignment) state.overlay.unitAlignment = "center";
    if (!state.overlay.pausedText) state.overlay.pausedText = "PAUSED";
    if (!state.overlay.stoppedText) state.overlay.stoppedText = "STOPPED";
    if (!state.overlay.pausedTextSize) state.overlay.pausedTextSize = 48;
    if (!state.overlay.pausedTextColor) state.overlay.pausedTextColor = "#ffaa00";
    if (state.overlay.showValueWhenPaused === undefined) state.overlay.showValueWhenPaused = true;
    if (state.overlay.showValueWhenStopped === undefined) state.overlay.showValueWhenStopped = true;
  }
  if (profileConfig.kick) state.kick = profileConfig.kick;
  if (profileConfig.settings) state.settings = profileConfig.settings;

  metricType.value = state.metricType;
  customUnitInput.value = state.customUnit || "";
  customUnitSection.style.display = state.metricType === "custom" ? "block" : "none";
  const reducerEnabledCheckbox = document.getElementById("reducerEnabled");
  const reducerAmountInput = document.getElementById("reducerAmount");
  if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = state.reducer.enabled;
  if (reducerAmountInput) reducerAmountInput.value = state.reducer.amountPerSecond;
  refreshKickUI();
  applyOverlayChanges();
  applyMetricsNow();
  updateDisplay();
  updateStats();
  renderEventsList();
  renderProfiles();
  showToast("Profile switched!", "success");
});

ipcRenderer.on("profile-error", (event, message) => {
  showToast(message, "error");
});

ipcRenderer.invoke("get-profiles").then(profiles => {
  state.profiles = profiles;
  renderProfiles();
});

ipcRenderer.invoke("get-current-profile").then(profileId => {
  state.currentProfileId = profileId;
});

module.exports = { renderProfiles, updateProfileButtons, canModifyProfiles };