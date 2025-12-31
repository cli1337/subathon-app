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
const createProfileModal = document.getElementById("createProfileModal");
const newProfileName = document.getElementById("newProfileName");
const confirmCreateProfileBtn = document.getElementById("confirmCreateProfileBtn");
const cancelCreateProfileBtn = document.getElementById("cancelCreateProfileBtn");
const closeCreateProfileModalBtn = document.getElementById("closeCreateProfileModalBtn");
const deleteProfileModal = document.getElementById("deleteProfileModal");
const deleteProfileMessage = document.getElementById("deleteProfileMessage");
const cancelDeleteProfileBtn = document.getElementById("cancelDeleteProfileBtn");
const confirmDeleteProfileBtn = document.getElementById("confirmDeleteProfileBtn");
const closeDeleteProfileModalBtn = document.getElementById("closeDeleteProfileModalBtn");

let profileToDelete = null;

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
    if (createProfileModal) {
      createProfileModal.classList.add("show");
      if (newProfileName) {
        newProfileName.value = "";
        setTimeout(() => newProfileName.focus(), 100);
      }
    }
  });
}

if (cancelCreateProfileBtn) {
  cancelCreateProfileBtn.addEventListener("click", () => {
    if (createProfileModal) createProfileModal.classList.remove("show");
  });
}

if (closeCreateProfileModalBtn) {
  closeCreateProfileModalBtn.addEventListener("click", () => {
    if (createProfileModal) createProfileModal.classList.remove("show");
  });
}

if (createProfileModal) {
  createProfileModal.addEventListener("click", (e) => {
    if (e.target === createProfileModal) {
      createProfileModal.classList.remove("show");
    }
  });
}

if (confirmCreateProfileBtn) {
  confirmCreateProfileBtn.addEventListener("click", () => {
    if (!newProfileName) return;
    const name = newProfileName.value.trim();
    if (!name) {
      showToast("Please enter a profile name", "error");
      return;
    }
    ipcRenderer.send("create-profile", name);
    if (createProfileModal) createProfileModal.classList.remove("show");
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
      const profile = state.profiles[profileId];
      if (profile) {
        profileToDelete = profileId;
        if (deleteProfileMessage) {
          deleteProfileMessage.textContent = `Are you sure you want to delete profile "${profile.name}"? This cannot be undone.`;
        }
        if (deleteProfileModal) {
          deleteProfileModal.classList.add("show");
        }
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

  if (profileConfig.overlayPort !== undefined) {
    state.overlay.port = profileConfig.overlayPort;
  }

  if (profileConfig.kick) {
    state.kick.pusherRegion = profileConfig.kick.pusherRegion || "ws-us2";
    state.kick.pusherKey = profileConfig.kick.pusherKey || "32cbd69e4b950bf97679";
    state.kick.chatroomId = profileConfig.kick.chatroomId || "";
    state.kick.username = profileConfig.kick.username || "";
    state.kick.configured = !!profileConfig.kick.chatroomId;
  }

  if (profileConfig.twitch) {
    state.twitch.username = profileConfig.twitch.username || "";
    state.twitch.oauth = profileConfig.twitch.oauth || "";
    state.twitch.channel = profileConfig.twitch.channel || "";
    state.twitch.configured = !!(profileConfig.twitch.channel && profileConfig.twitch.oauth && profileConfig.twitch.username);
  }

  if (profileConfig.streamlabs) {
    state.streamlabs.socketToken = profileConfig.streamlabs.socketToken || "";
    state.streamlabs.configured = !!profileConfig.streamlabs.socketToken;
  }

  if (profileConfig.metricState) {
    state.currentValue = profileConfig.metricState.currentValue ?? 0;
    state.startingValue = profileConfig.metricState.startingValue ?? (profileConfig.metricState.currentValue ?? 0);
    state.metricType = profileConfig.metricState.metricType ?? "time";
    state.customUnit = profileConfig.metricState.customUnit ?? "";
    state.totalEvents = profileConfig.metricState.totalEvents ?? 0;
    state.valueAdded = profileConfig.metricState.valueAdded ?? 0;
    state.distanceDisplayMode = profileConfig.metricState.distanceDisplayMode || "meters";
  }

  if (profileConfig.eventValues) {
    state.config.eventValues = JSON.parse(JSON.stringify(profileConfig.eventValues));
  } else if (!state.config.eventValues) {
    state.config.eventValues = {
      kick: { subValue: 120, giftValue: 60, subEnabled: true, giftEnabled: true, platformEnabled: true },
      twitch: { subValue: 120, giftValue: 60, bitsValue: 30, subEnabled: true, giftEnabled: true, bitsEnabled: true, platformEnabled: true },
      streamlabs: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true },
      donationalerts: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true }
    };
  }

  if (profileConfig.platforms) {
    if (profileConfig.platforms.kick) state.platforms.kick.enabled = profileConfig.platforms.kick.enabled !== false;
    if (profileConfig.platforms.twitch) state.platforms.twitch.enabled = profileConfig.platforms.twitch.enabled !== false;
    if (profileConfig.platforms.streamlabs) state.platforms.streamlabs.enabled = profileConfig.platforms.streamlabs.enabled !== false;
    if (profileConfig.platforms.donationalerts) state.platforms.donationalerts.enabled = profileConfig.platforms.donationalerts.enabled !== false;
  }

  if (profileConfig.events) state.events = profileConfig.events || [];
  if (profileConfig.reducer) state.reducer = profileConfig.reducer;
  if (profileConfig.settings) Object.assign(state.settings, profileConfig.settings);
  
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

  metricType.value = state.metricType;
  customUnitInput.value = state.customUnit || "";
  customUnitSection.style.display = state.metricType === "custom" ? "block" : "none";
  const reducerEnabledCheckbox = document.getElementById("reducerEnabled");
  const reducerAmountInput = document.getElementById("reducerAmount");
  if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = state.reducer.enabled;
  if (reducerAmountInput) reducerAmountInput.value = state.reducer.amountPerSecond;

  const { refreshTwitchUI } = require("./twitch");
  const { refreshStreamlabsUI } = require("./streamlabs");
  const { ensureKickSocketRunning } = require("./kick-socket");
  const { ensureTwitchSocketRunning } = require("./twitch-socket");
  const { ensureStreamlabsSocketRunning } = require("./streamlabs-socket");
  const { initializeMetricsUI } = require("./metrics");

  refreshKickUI();
  refreshTwitchUI();
  refreshStreamlabsUI();
  
  applyOverlayChanges();
  initializeMetricsUI();
  
  setTimeout(() => {
    ensureKickSocketRunning();
    ensureTwitchSocketRunning();
    ensureStreamlabsSocketRunning();
    applyMetricsNow();
    updateDisplay();
    updateStats();
    renderEventsList();
    renderProfiles();
    showToast("Profile switched!", "success");
  }, 100);
});

ipcRenderer.on("profile-error", (event, message) => {
  showToast(message, "error");
});

Promise.all([
  ipcRenderer.invoke("get-profiles"),
  ipcRenderer.invoke("get-current-profile")
]).then(([profiles, profileId]) => {
  state.profiles = profiles;
  state.currentProfileId = profileId;
  renderProfiles();
});

if (cancelDeleteProfileBtn) {
  cancelDeleteProfileBtn.addEventListener("click", () => {
    if (deleteProfileModal) deleteProfileModal.classList.remove("show");
    profileToDelete = null;
  });
}

if (closeDeleteProfileModalBtn) {
  closeDeleteProfileModalBtn.addEventListener("click", () => {
    if (deleteProfileModal) deleteProfileModal.classList.remove("show");
    profileToDelete = null;
  });
}

if (deleteProfileModal) {
  deleteProfileModal.addEventListener("click", (e) => {
    if (e.target === deleteProfileModal) {
      deleteProfileModal.classList.remove("show");
      profileToDelete = null;
    }
  });
}

if (confirmDeleteProfileBtn) {
  confirmDeleteProfileBtn.addEventListener("click", () => {
    if (profileToDelete) {
      ipcRenderer.send("delete-profile", profileToDelete);
      if (deleteProfileModal) deleteProfileModal.classList.remove("show");
      profileToDelete = null;
    }
  });
}

module.exports = { renderProfiles, updateProfileButtons, canModifyProfiles };