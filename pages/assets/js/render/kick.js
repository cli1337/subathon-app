const { shell } = require("electron");
const { state } = require("./state");
const { saveAllConfig } = require("./config");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");
const { getConnectionStatus, setRefreshUICallback } = require("./kick-socket");

const kickPusherRegion = document.getElementById("kickPusherRegion");
const kickPusherKey = document.getElementById("kickPusherKey");
const kickUsernameInput = document.getElementById("kickUsernameInput");
const kickChatroomIdInput = document.getElementById("kickChatroomIdInput");
const getChatroomIdBtn = document.getElementById("getChatroomIdBtn");
const saveKickBtn = document.getElementById("saveKickBtn");
const resetKickBtn = document.getElementById("resetKickBtn");
const kickStatus = document.getElementById("kickStatus");
const kickConfigDisplay = document.getElementById("kickConfigDisplay");
const kickConnectionIndicator = document.getElementById("kickConnectionIndicator");

function refreshKickUI() {
  const hasConfig = !!state.kick.chatroomId;
  const isConnected = hasConfig && getConnectionStatus();

  if (hasConfig) {
    kickStatus.textContent = "Configured";
    kickStatus.classList.add("connected");
    kickConfigDisplay.textContent = `Region: ${state.kick.pusherRegion} | Key: ${state.kick.pusherKey} | Chatroom: ${state.kick.chatroomId}`;
    kickPusherRegion.disabled = kickPusherKey.disabled = kickUsernameInput.disabled = kickChatroomIdInput.disabled = getChatroomIdBtn.disabled = true;
    saveKickBtn.style.display = "none";
  } else {
    kickStatus.textContent = "Not Configured";
    kickStatus.classList.remove("connected");
    kickConfigDisplay.textContent = "";
    kickPusherRegion.disabled = kickPusherKey.disabled = kickUsernameInput.disabled = kickChatroomIdInput.disabled = getChatroomIdBtn.disabled = false;
    saveKickBtn.style.display = "block";
  }

  // Update connection indicator
  if (kickConnectionIndicator) {
    if (isConnected) {
      kickConnectionIndicator.classList.add("connected");
      kickConnectionIndicator.classList.remove("disconnected", "connecting");
      kickConnectionIndicator.title = "WebSocket Connected";
    } else if (hasConfig) {
      kickConnectionIndicator.classList.add("connecting");
      kickConnectionIndicator.classList.remove("connected", "disconnected");
      kickConnectionIndicator.title = "WebSocket Connecting...";
    } else {
      kickConnectionIndicator.classList.add("disconnected");
      kickConnectionIndicator.classList.remove("connected", "connecting");
      kickConnectionIndicator.title = "WebSocket Disconnected";
    }
  }

  kickPusherRegion.value = state.kick.pusherRegion;
  kickPusherKey.value = state.kick.pusherKey;
  kickUsernameInput.value = state.kick.username || "";
  kickChatroomIdInput.value = state.kick.chatroomId || "";
}

if (getChatroomIdBtn) {
  getChatroomIdBtn.addEventListener("click", () => {
    const username = kickUsernameInput.value.trim();
    if (!username) {
      showToast("Enter your Kick username first", "error");
      return;
    }
    shell.openExternal(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}/chatroom`);
    showToast("Opened Kick API – copy the 'id' field", "info");
  });
}

if (saveKickBtn) {
  saveKickBtn.addEventListener("click", () => {
    const region = kickPusherRegion.value.trim() || "ws-us2";
    const key = kickPusherKey.value.trim() || "32cbd69e4b950bf97679";
    const chatroomId = kickChatroomIdInput.value.trim();

    if (!chatroomId || isNaN(chatroomId)) {
      showToast("Valid numeric Chatroom ID required", "error");
      return;
    }

    state.kick.pusherRegion = region;
    state.kick.pusherKey = key;
    state.kick.chatroomId = chatroomId;
    state.kick.username = kickUsernameInput.value.trim();
    state.kick.configured = true;

    saveAllConfig();
    refreshKickUI();
    updateConnectionStatus();
    showToast("Kick config saved!", "success");
    setTimeout(() => refreshKickUI(), 1000);
  });
}

if (resetKickBtn) {
  resetKickBtn.addEventListener("click", () => {
    if (confirm("Reset Kick configuration? This will clear all settings.")) {
      state.kick.pusherRegion = "ws-us2";
      state.kick.pusherKey = "32cbd69e4b950bf97679";
      state.kick.chatroomId = "";
      state.kick.username = "";
      state.kick.configured = false;
      saveAllConfig();
      refreshKickUI();
      updateConnectionStatus();
      showToast("Kick config reset to defaults", "info");
    }
  });
}

setRefreshUICallback(refreshKickUI);

module.exports = { refreshKickUI };

