const { shell } = require("electron");
const { state } = require("./state");
const { saveAllConfig } = require("./config");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");
const { getConnectionStatus, setRefreshUICallback } = require("./streamlabs-socket");

const streamlabsSocketTokenInput = document.getElementById("streamlabsSocketTokenInput");
const getStreamlabsTokenBtn = document.getElementById("getStreamlabsTokenBtn");
const saveStreamlabsBtn = document.getElementById("saveStreamlabsBtn");
const resetStreamlabsBtn = document.getElementById("resetStreamlabsBtn");
const streamlabsStatus = document.getElementById("streamlabsStatus");
const streamlabsConfigDisplay = document.getElementById("streamlabsConfigDisplay");
const streamlabsConnectionIndicator = document.getElementById("streamlabsConnectionIndicator");

function refreshStreamlabsUI() {
  const hasConfig = !!state.streamlabs?.socketToken;
  const isConnected = hasConfig && getConnectionStatus();
  const isEnabled = state.platforms?.streamlabs?.enabled !== false;

  if (hasConfig) {
    streamlabsStatus.textContent = "Configured";
    streamlabsStatus.classList.add("connected");
    streamlabsConfigDisplay.textContent = `Socket Token: ${state.streamlabs.socketToken.substring(0, 20)}...`;
    streamlabsSocketTokenInput.disabled = getStreamlabsTokenBtn.disabled = true;
  } else {
    streamlabsStatus.textContent = "Not Configured";
    streamlabsStatus.classList.remove("connected");
    streamlabsConfigDisplay.textContent = "";
    streamlabsSocketTokenInput.disabled = getStreamlabsTokenBtn.disabled = false;
  }

  if (saveStreamlabsBtn) saveStreamlabsBtn.style.display = "block";
  if (resetStreamlabsBtn) resetStreamlabsBtn.style.display = "block";

  if (streamlabsConnectionIndicator) {
    if (isConnected) {
      streamlabsConnectionIndicator.classList.add("connected");
      streamlabsConnectionIndicator.classList.remove("disconnected", "connecting");
      streamlabsConnectionIndicator.title = "Socket Connected";
    } else if (hasConfig) {
      streamlabsConnectionIndicator.classList.add("connecting");
      streamlabsConnectionIndicator.classList.remove("connected", "disconnected");
      streamlabsConnectionIndicator.title = "Socket Connecting...";
    } else {
      streamlabsConnectionIndicator.classList.add("disconnected");
      streamlabsConnectionIndicator.classList.remove("connected", "connecting");
      streamlabsConnectionIndicator.title = "Socket Disconnected";
    }
  }

  if (streamlabsSocketTokenInput) streamlabsSocketTokenInput.value = state.streamlabs?.socketToken || "";

  const streamlabsPlatformEnabledToggle = document.getElementById("streamlabsPlatformEnabled");
  if (streamlabsPlatformEnabledToggle) {
    streamlabsPlatformEnabledToggle.checked = isEnabled;
  }
}

if (getStreamlabsTokenBtn) {
  getStreamlabsTokenBtn.addEventListener("click", () => {
    shell.openExternal("https://streamlabs.com/dashboard#/settings/api-settings");
    showToast("Opened Streamlabs API – get your socket token", "info");
  });
}

if (streamlabsSocketTokenInput) {
  let saveTimeout = null;
  
  function autoSaveToken() {
    const socketToken = streamlabsSocketTokenInput.value.trim();
    
    if (socketToken.length >= 20) {
      if (!state.streamlabs) {
        state.streamlabs = {};
      }
      
      const wasConfigured = state.streamlabs.configured;
      state.streamlabs.socketToken = socketToken;
      state.streamlabs.configured = true;
      
      saveAllConfig();
      refreshStreamlabsUI();
      updateConnectionStatus();
      
      if (!wasConfigured) {
        showToast("Streamlabs token saved automatically", "success");
      }
      
      setTimeout(() => {
        refreshStreamlabsUI();
        const { ensureStreamlabsSocketRunning } = require("./streamlabs-socket");
        ensureStreamlabsSocketRunning();
      }, 500);
    }
  }
  
  streamlabsSocketTokenInput.addEventListener("input", () => {
    clearTimeout(saveTimeout);
    const socketToken = streamlabsSocketTokenInput.value.trim();
    
    if (socketToken.length >= 20) {
      saveTimeout = setTimeout(() => {
        autoSaveToken();
      }, 1500);
    }
  });
  
  streamlabsSocketTokenInput.addEventListener("blur", () => {
    clearTimeout(saveTimeout);
    autoSaveToken();
  });
  
  streamlabsSocketTokenInput.addEventListener("paste", () => {
    setTimeout(() => {
      clearTimeout(saveTimeout);
      autoSaveToken();
    }, 100);
  });
}

if (saveStreamlabsBtn) {
  saveStreamlabsBtn.addEventListener("click", () => {
    const socketToken = streamlabsSocketTokenInput.value.trim();

    if (!socketToken) {
      showToast("Socket token is required", "error");
      return;
    }

    if (!state.streamlabs) {
      state.streamlabs = {};
    }

    state.streamlabs.socketToken = socketToken;
    state.streamlabs.configured = true;

    saveAllConfig();
    refreshStreamlabsUI();
    updateConnectionStatus();
    showToast("Streamlabs config saved!", "success");
    
    setTimeout(() => {
      refreshStreamlabsUI();
      const { ensureStreamlabsSocketRunning } = require("./streamlabs-socket");
      ensureStreamlabsSocketRunning();
    }, 1000);
  });
}

if (resetStreamlabsBtn) {
  resetStreamlabsBtn.addEventListener("click", () => {
    const resetModal = document.getElementById("resetPlatformModal");
    const resetMessage = document.getElementById("resetPlatformMessage");
    
    if (resetModal && resetMessage) {
      resetMessage.textContent = "Are you sure you want to reset Streamlabs configuration? This will clear all settings.";
      
      resetModal.dataset.resetFunction = "streamlabs";
      
      resetModal.classList.add("show");
    }
  });
}

function initStreamlabsPlatformToggle() {
  const streamlabsPlatformEnabledToggle = document.getElementById("streamlabsPlatformEnabled");
  if (streamlabsPlatformEnabledToggle) {
    streamlabsPlatformEnabledToggle.checked = state.platforms?.streamlabs?.enabled !== false;
    streamlabsPlatformEnabledToggle.onchange = null;
    streamlabsPlatformEnabledToggle.addEventListener("change", () => {
      state.platforms.streamlabs.enabled = streamlabsPlatformEnabledToggle.checked;
      saveAllConfig();
      const { cleanupStreamlabsSocket } = require("./streamlabs-socket");
      if (!streamlabsPlatformEnabledToggle.checked) {
        cleanupStreamlabsSocket();
      } else if (state.streamlabs.configured) {
        const { ensureStreamlabsSocketRunning } = require("./streamlabs-socket");
        ensureStreamlabsSocketRunning();
      }
      refreshStreamlabsUI();
    });
  }
}

initStreamlabsPlatformToggle();
setRefreshUICallback(refreshStreamlabsUI);

module.exports = { refreshStreamlabsUI };

