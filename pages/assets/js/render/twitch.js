const { shell } = require("electron");
const { state } = require("./state");
const { saveAllConfig } = require("./config");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");
const { getConnectionStatus, setRefreshUICallback } = require("./twitch-socket");

const twitchUsernameInput = document.getElementById("twitchUsernameInput");
const twitchOAuthInput = document.getElementById("twitchOAuthInput");
const twitchChannelInput = document.getElementById("twitchChannelInput");
const getTwitchOAuthBtn = document.getElementById("getTwitchOAuthBtn");
const saveTwitchBtn = document.getElementById("saveTwitchBtn");
const resetTwitchBtn = document.getElementById("resetTwitchBtn");
const twitchStatus = document.getElementById("twitchStatus");
const twitchConfigDisplay = document.getElementById("twitchConfigDisplay");
const twitchLockedSection = document.getElementById("twitchLockedSection");
const twitchConfigStatus = document.getElementById("twitchConfigStatus");
const twitchConnectionIndicator = document.getElementById("twitchConnectionIndicator");

function refreshTwitchUI() {
  const hasConfig = !!(state.twitch?.channel && state.twitch?.oauth && state.twitch?.username);
  const isConnected = hasConfig && getConnectionStatus();

  if (hasConfig) {
    twitchStatus.textContent = "Configured";
    twitchStatus.classList.add("connected");
    twitchConfigDisplay.textContent = `Channel: ${state.twitch.channel} | Username: ${state.twitch.username}`;
    twitchLockedSection.style.display = "block";
    if (twitchConfigStatus) {
      twitchConfigStatus.value = `Connected to #${state.twitch.channel}`;
    }
    twitchUsernameInput.disabled = twitchOAuthInput.disabled = twitchChannelInput.disabled = getTwitchOAuthBtn.disabled = true;
    saveTwitchBtn.style.display = "none";
  } else {
    twitchStatus.textContent = "Not Configured";
    twitchStatus.classList.remove("connected");
    twitchConfigDisplay.textContent = "";
    twitchLockedSection.style.display = "none";
    twitchUsernameInput.disabled = twitchOAuthInput.disabled = twitchChannelInput.disabled = getTwitchOAuthBtn.disabled = false;
    saveTwitchBtn.style.display = "block";
  }

  if (twitchConnectionIndicator) {
    if (isConnected) {
      twitchConnectionIndicator.classList.add("connected");
      twitchConnectionIndicator.classList.remove("disconnected", "connecting");
      twitchConnectionIndicator.title = "WebSocket Connected";
    } else if (hasConfig) {
      twitchConnectionIndicator.classList.add("connecting");
      twitchConnectionIndicator.classList.remove("connected", "disconnected");
      twitchConnectionIndicator.title = "WebSocket Connecting...";
    } else {
      twitchConnectionIndicator.classList.add("disconnected");
      twitchConnectionIndicator.classList.remove("connected", "connecting");
      twitchConnectionIndicator.title = "WebSocket Disconnected";
    }
  }

  if (twitchUsernameInput) twitchUsernameInput.value = state.twitch?.username || "";
  if (twitchOAuthInput) twitchOAuthInput.value = state.twitch?.oauth || "";
  if (twitchChannelInput) twitchChannelInput.value = state.twitch?.channel || "";
}

if (getTwitchOAuthBtn) {
  getTwitchOAuthBtn.addEventListener("click", () => {
    shell.openExternal("https://twitchtokengenerator.com/");
    showToast("Opened Twitch Token Generator – generate token with chat:read scope", "info");
  });
}

if (saveTwitchBtn) {
  saveTwitchBtn.addEventListener("click", () => {
    const username = twitchUsernameInput.value.trim().toLowerCase();
    const oauth = twitchOAuthInput.value.trim();
    const channel = twitchChannelInput.value.trim().toLowerCase() || username;

    if (!username) {
      showToast("Twitch username is required", "error");
      return;
    }

    if (!oauth) {
      showToast("OAuth token is required", "error");
      return;
    }

    if (!oauth.startsWith("oauth:")) {
      showToast("OAuth token must start with 'oauth:'", "error");
      return;
    }

    state.twitch.username = username;
    state.twitch.oauth = oauth;
    state.twitch.channel = channel;
    state.twitch.configured = true;

    saveAllConfig();
    refreshTwitchUI();
    updateConnectionStatus();
    showToast("Twitch config saved!", "success");
    setTimeout(() => refreshTwitchUI(), 1000);
  });
}

if (resetTwitchBtn) {
  resetTwitchBtn.addEventListener("click", () => {
    if (confirm("Reset Twitch configuration? This will clear all settings.")) {
      state.twitch.username = "";
      state.twitch.oauth = "";
      state.twitch.channel = "";
      state.twitch.configured = false;
      saveAllConfig();
      refreshTwitchUI();
      updateConnectionStatus();
      showToast("Twitch config reset to defaults", "info");
    }
  });
}

setRefreshUICallback(refreshTwitchUI);

module.exports = { refreshTwitchUI };

