const { shell } = require("electron");
const { state } = require("./state");
const { saveAllConfig } = require("./config");
const { showToast } = require("./toast");
const { updateConnectionStatus } = require("./display");
const { getConnectionStatus, setRefreshUICallback } = require("./donationalerts-socket");

const donationalertsAccessTokenInput = document.getElementById("donationalertsAccessTokenInput");
const getDonationalertsTokenBtn = document.getElementById("getDonationalertsTokenBtn");
const saveDonationalertsBtn = document.getElementById("saveDonationalertsBtn");
const resetDonationalertsBtn = document.getElementById("resetDonationalertsBtn");
const donationalertsStatus = document.getElementById("donationalertsStatus");
const donationalertsConfigDisplay = document.getElementById("donationalertsConfigDisplay");
const donationalertsConnectionIndicator = document.getElementById("donationalertsConnectionIndicator");

function refreshDonationalertsUI() {
  const hasConfig = !!state.donationalerts?.accessToken;
  const isConnected = hasConfig && getConnectionStatus();
  const isEnabled = state.platforms?.donationalerts?.enabled !== false;

  if (hasConfig) {
    donationalertsStatus.textContent = "Configured";
    donationalertsStatus.classList.add("connected");
    donationalertsConfigDisplay.textContent = `Widget Token: ${state.donationalerts.accessToken.substring(0, 20)}...`;
    donationalertsAccessTokenInput.disabled = getDonationalertsTokenBtn.disabled = true;
  } else {
    donationalertsStatus.textContent = "Not Configured";
    donationalertsStatus.classList.remove("connected");
    donationalertsConfigDisplay.textContent = "";
    donationalertsAccessTokenInput.disabled = getDonationalertsTokenBtn.disabled = false;
  }

  if (saveDonationalertsBtn) saveDonationalertsBtn.style.display = "block";
  if (resetDonationalertsBtn) resetDonationalertsBtn.style.display = "block";

  if (donationalertsConnectionIndicator) {
    if (isConnected) {
      donationalertsConnectionIndicator.classList.add("connected");
      donationalertsConnectionIndicator.classList.remove("disconnected", "connecting");
      donationalertsConnectionIndicator.title = "Socket Connected";
    } else if (hasConfig) {
      donationalertsConnectionIndicator.classList.add("connecting");
      donationalertsConnectionIndicator.classList.remove("connected", "disconnected");
      donationalertsConnectionIndicator.title = "Socket Connecting...";
    } else {
      donationalertsConnectionIndicator.classList.add("disconnected");
      donationalertsConnectionIndicator.classList.remove("connected", "connecting");
      donationalertsConnectionIndicator.title = "Socket Disconnected";
    }
  }

  if (donationalertsAccessTokenInput) donationalertsAccessTokenInput.value = state.donationalerts?.accessToken || "";

  const donationalertsPlatformEnabledToggle = document.getElementById("donationalertsPlatformEnabled");
  if (donationalertsPlatformEnabledToggle) {
    donationalertsPlatformEnabledToggle.checked = isEnabled;
  }
}

if (getDonationalertsTokenBtn) {
  getDonationalertsTokenBtn.addEventListener("click", () => {
    shell.openExternal("https://www.donationalerts.com/dashboard/general-settings/account");
    showToast("Opened DonationAlerts Account Settings – copy the widget token from your alerts widget page", "info");
  });
}

if (donationalertsAccessTokenInput) {
  let saveTimeout = null;
  
  function autoSaveToken() {
    const accessToken = donationalertsAccessTokenInput.value.trim();
    
    if (accessToken.length >= 20) {
      if (!state.donationalerts) {
        state.donationalerts = {};
      }
      
      const wasConfigured = state.donationalerts.configured;
      state.donationalerts.accessToken = accessToken;
      state.donationalerts.configured = true;
      
      saveAllConfig();
      refreshDonationalertsUI();
      updateConnectionStatus();
      
      if (!wasConfigured) {
        showToast("DonationAlerts token saved automatically", "success");
      }
      
      setTimeout(() => {
        refreshDonationalertsUI();
        const { ensureDonationalertsSocketRunning } = require("./donationalerts-socket");
        ensureDonationalertsSocketRunning();
      }, 500);
    }
  }
  
  donationalertsAccessTokenInput.addEventListener("input", () => {
    clearTimeout(saveTimeout);
    const accessToken = donationalertsAccessTokenInput.value.trim();
    
    if (accessToken.length >= 20) {
      saveTimeout = setTimeout(() => {
        autoSaveToken();
      }, 1500);
    }
  });
  
  donationalertsAccessTokenInput.addEventListener("blur", () => {
    clearTimeout(saveTimeout);
    autoSaveToken();
  });
  
  donationalertsAccessTokenInput.addEventListener("paste", () => {
    setTimeout(() => {
      clearTimeout(saveTimeout);
      autoSaveToken();
    }, 100);
  });
}

if (saveDonationalertsBtn) {
  saveDonationalertsBtn.addEventListener("click", () => {
    const accessToken = donationalertsAccessTokenInput.value.trim();

    if (!accessToken) {
      showToast("Widget token is required", "error");
      return;
    }

    if (!state.donationalerts) {
      state.donationalerts = {};
    }

    state.donationalerts.accessToken = accessToken;
    state.donationalerts.configured = true;

    saveAllConfig();
    refreshDonationalertsUI();
    updateConnectionStatus();
    showToast("DonationAlerts config saved!", "success");
    
    setTimeout(() => {
      refreshDonationalertsUI();
      const { ensureDonationalertsSocketRunning } = require("./donationalerts-socket");
      ensureDonationalertsSocketRunning();
    }, 1000);
  });
}

if (resetDonationalertsBtn) {
  resetDonationalertsBtn.addEventListener("click", () => {
    const resetModal = document.getElementById("resetPlatformModal");
    const resetMessage = document.getElementById("resetPlatformMessage");
    
    if (resetModal && resetMessage) {
      resetMessage.textContent = "Are you sure you want to reset DonationAlerts configuration? This will clear all settings.";
      
      resetModal.dataset.resetFunction = "donationalerts";
      
      resetModal.classList.add("show");
    }
  });
}

function initDonationalertsPlatformToggle() {
  const donationalertsPlatformEnabledToggle = document.getElementById("donationalertsPlatformEnabled");
  if (donationalertsPlatformEnabledToggle) {
    donationalertsPlatformEnabledToggle.checked = state.platforms?.donationalerts?.enabled !== false;
    donationalertsPlatformEnabledToggle.onchange = null;
    donationalertsPlatformEnabledToggle.addEventListener("change", () => {
      state.platforms.donationalerts.enabled = donationalertsPlatformEnabledToggle.checked;
      saveAllConfig();
      const { cleanupDonationalertsSocket } = require("./donationalerts-socket");
      if (!donationalertsPlatformEnabledToggle.checked) {
        cleanupDonationalertsSocket();
      } else if (state.donationalerts.configured) {
        const { ensureDonationalertsSocketRunning } = require("./donationalerts-socket");
        ensureDonationalertsSocketRunning();
      }
      refreshDonationalertsUI();
    });
  }
}

initDonationalertsPlatformToggle();
setRefreshUICallback(refreshDonationalertsUI);

module.exports = { refreshDonationalertsUI };
