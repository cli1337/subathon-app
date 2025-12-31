const { ipcRenderer, shell } = require("electron");
const path = require("path");

const scriptDir = path.join(__dirname, "assets", "js");

const { state } = require(path.join(scriptDir, "render", "state"));
const { updateDisplay, updateStats, updateConnectionStatus, updateUnitLabels } = require(path.join(scriptDir, "render", "display"));
const { startTimer, stopTimer, pauseTimer, startReducer, stopReducer } = require(path.join(scriptDir, "render", "timer"));
const { saveAllConfig } = require(path.join(scriptDir, "render", "config"));
const { addEvent, renderEventsList, clearEvents } = require(path.join(scriptDir, "render", "events"));

function initNumberInputs() {
  const numberInputs = document.querySelectorAll('input[type="number"]');
  
  numberInputs.forEach(input => {
    if (input.closest('.number-input-wrapper')) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'number-input-wrapper';
    
    const controls = document.createElement('div');
    controls.className = 'number-input-controls';
    
    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'number-input-btn up';
    upBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>';
    
    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'number-input-btn down';
    downBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    
    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    wrapper.appendChild(controls);
    
    const step = parseFloat(input.step) || 1;
    const min = input.min !== '' ? parseFloat(input.min) : null;
    const max = input.max !== '' ? parseFloat(input.max) : null;
    
    upBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let value = parseFloat(input.value) || 0;
      value += step;
      if (max !== null && value > max) value = max;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    downBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let value = parseFloat(input.value) || 0;
      value -= step;
      if (min !== null && value < min) value = min;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

const { initVersionCheck } = require(path.join(scriptDir, "render", "version-check"));

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initVersionCheck();
    setTimeout(initNumberInputs, 50);
  });
} else {
  initVersionCheck();
  setTimeout(initNumberInputs, 50);
}

const mainContent = document.getElementById('mainContent');
if (mainContent) {
  const observer = new MutationObserver((mutations) => {
    let shouldInit = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.tagName === 'INPUT' && node.type === 'number') {
              shouldInit = true;
            } else if (node.querySelectorAll) {
              const numberInputs = node.querySelectorAll('input[type="number"]');
              if (numberInputs.length > 0) {
                shouldInit = true;
              }
            }
          }
        });
      }
    });
    
    if (shouldInit) {
      setTimeout(initNumberInputs, 10);
    }
  });

  observer.observe(mainContent, {
    childList: true,
    subtree: true
  });
}

window.initNumberInputs = initNumberInputs;
const { showToast } = require(path.join(scriptDir, "render", "toast"));
const { applyOverlayChanges } = require(path.join(scriptDir, "render", "overlay"));
const { refreshKickUI } = require(path.join(scriptDir, "render", "kick"));
const { ensureKickSocketRunning } = require(path.join(scriptDir, "render", "kick-socket"));
const { refreshTwitchUI } = require(path.join(scriptDir, "render", "twitch"));
const { ensureTwitchSocketRunning } = require(path.join(scriptDir, "render", "twitch-socket"));
const { refreshStreamlabsUI } = require(path.join(scriptDir, "render", "streamlabs"));
const { ensureStreamlabsSocketRunning } = require(path.join(scriptDir, "render", "streamlabs-socket"));
const { refreshDonationalertsUI } = require(path.join(scriptDir, "render", "donationalerts"));
const { ensureDonationalertsSocketRunning } = require(path.join(scriptDir, "render", "donationalerts-socket"));
require(path.join(scriptDir, "render", "platform-switcher"));
require(path.join(scriptDir, "render", "event-switcher"));
const { applyMetricsNow } = require(path.join(scriptDir, "render", "metrics"));
require(path.join(scriptDir, "render", "manual-events"));
const { renderProfiles, updateProfileButtons } = require(path.join(scriptDir, "render", "profiles"));


const navItems = document.querySelectorAll(".nav-item");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const editValueBtn = document.getElementById("editValueBtn");
const increaseValueBtn = document.getElementById("increaseValueBtn");
const decreaseValueBtn = document.getElementById("decreaseValueBtn");
const toggleReducerBtn = document.getElementById("toggleReducerBtn");
const reducerEnabledCheckbox = document.getElementById("reducerEnabled");
const reducerAmountInput = document.getElementById("reducerAmount");
const saveReducerBtn = document.getElementById("saveReducerBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const autoSaveCheckbox = document.getElementById("autoSave");
const soundAlertsCheckbox = document.getElementById("soundAlerts");
const startMinimizedCheckbox = document.getElementById("startMinimized");
const editModal = document.getElementById("editModal");
const editValueInput = document.getElementById("editValueInput");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const adjustValueModal = document.getElementById("adjustValueModal");
const adjustValueInput = document.getElementById("adjustValueInput");
const adjustValueModalTitle = document.getElementById("adjustValueModalTitle");
const adjustValueLabel = document.getElementById("adjustValueLabel");
const adjustValueHint = document.getElementById("adjustValueHint");
const closeAdjustModalBtn = document.getElementById("closeAdjustModalBtn");
const cancelAdjustBtn = document.getElementById("cancelAdjustBtn");
const confirmAdjustBtn = document.getElementById("confirmAdjustBtn");
const resetModal = document.getElementById("resetModal");
const closeResetModalBtn = document.getElementById("closeResetModalBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");
const confirmResetBtn = document.getElementById("confirmResetBtn");
const clearEventsModal = document.getElementById("clearEventsModal");
const closeClearEventsModalBtn = document.getElementById("closeClearEventsModalBtn");
const cancelClearEventsBtn = document.getElementById("cancelClearEventsBtn");
const confirmClearEventsBtn = document.getElementById("confirmClearEventsBtn");
const deleteEventModal = document.getElementById("deleteEventModal");
let eventToDelete = null;
const closeDeleteEventModalBtn = document.getElementById("closeDeleteEventModalBtn");
const cancelDeleteEventBtn = document.getElementById("cancelDeleteEventBtn");
const confirmDeleteEventBtn = document.getElementById("confirmDeleteEventBtn");
const clearValueAddedBtn = document.getElementById("clearValueAddedBtn");
const clearValueAddedModal = document.getElementById("clearValueAddedModal");
const closeClearValueAddedModalBtn = document.getElementById("closeClearValueAddedModalBtn");
const cancelClearValueAddedBtn = document.getElementById("cancelClearValueAddedBtn");
const confirmClearValueAddedBtn = document.getElementById("confirmClearValueAddedBtn");
const metricType = document.getElementById("metricType");
const customUnitSection = document.getElementById("customUnitSection");
const customUnitInput = document.getElementById("customUnit");
const overlayPortInput = document.getElementById("overlayPort");
const fontSize = document.getElementById("fontSize");
const fontSizeValue = document.getElementById("fontSizeValue");
const textColor = document.getElementById("textColor");
const overlayBackground = document.getElementById("overlayBackground");
const bgColor = document.getElementById("bgColor");
const unitPosition = document.getElementById("unitPosition");
const unitAlignment = document.getElementById("unitAlignment");
const pausedText = document.getElementById("pausedText");
const stoppedText = document.getElementById("stoppedText");
const pausedTextSize = document.getElementById("pausedTextSize");
const pausedTextSizeValue = document.getElementById("pausedTextSizeValue");
const pausedTextColor = document.getElementById("pausedTextColor");
const showValueWhenPaused = document.getElementById("showValueWhenPaused");
const showValueWhenStopped = document.getElementById("showValueWhenStopped");
const clearEventsBtn = document.getElementById("clearEventsBtn");
const toggleEventsBtn = document.getElementById("toggleEventsBtn");
const recentEventsCard = document.getElementById("recentEventsCard");

document.getElementById("minimizeBtn")?.addEventListener("click", () => ipcRenderer.send("window-minimize"));
document.getElementById("maximizeBtn")?.addEventListener("click", () => ipcRenderer.send("window-maximize"));
document.getElementById("closeBtn")?.addEventListener("click", () => ipcRenderer.send("window-close"));

ipcRenderer.on("window-maximized", () => {
  document.querySelector(".max-icon").style.display = "none";
  document.querySelector(".restore-icon").style.display = "block";
});
ipcRenderer.on("window-unmaximized", () => {
  document.querySelector(".max-icon").style.display = "block";
  document.querySelector(".restore-icon").style.display = "none";
});

function switchToPage(pageId) {
  navItems.forEach(n => {
    n.classList.remove("active");
  });
  
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => {
    p.classList.remove("active");
  });
  
  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) {
    navItem.classList.add("active");
  }
  
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add("active");
  }
  
  const titleEl = document.getElementById("currentPageTitle");
  if (titleEl) {
    titleEl.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
  }
  
  if (pageId === "platforms") {
    const { refreshKickUI } = require(path.join(scriptDir, "render", "kick"));
    const { refreshTwitchUI } = require(path.join(scriptDir, "render", "twitch"));
    const { refreshStreamlabsUI } = require(path.join(scriptDir, "render", "streamlabs"));
    const { refreshDonationalertsUI } = require(path.join(scriptDir, "render", "donationalerts"));
    refreshKickUI();
    refreshTwitchUI();
    refreshStreamlabsUI();
    refreshDonationalertsUI();
  }
  
  localStorage.setItem("lastActivePage", pageId);
}

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const pageId = item.dataset.page;
    switchToPage(pageId);
  });
});

const overlaySectionBtns = document.querySelectorAll(".overlay-section-btn");
const overlaySectionContents = document.querySelectorAll(".overlay-section-content");

overlaySectionBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const section = btn.dataset.section;
    
    if (section === "gifter" || btn.disabled) {
      return;
    }
    
    overlaySectionBtns.forEach(b => b.classList.remove("active"));
    overlaySectionContents.forEach(c => c.style.display = "none");
    
    btn.classList.add("active");
    const content = document.getElementById(`section-${section}`);
    if (content) {
      content.style.display = "block";
    }
  });
});

if (overlaySectionBtns.length > 0) {
  let firstBtn = null;
  for (let btn of overlaySectionBtns) {
    if (!btn.disabled && btn.dataset.section !== "gifter") {
      firstBtn = btn;
      break;
    }
  }
  if (firstBtn) {
    firstBtn.classList.add("active");
    const firstSection = firstBtn.dataset.section;
    const firstContent = document.getElementById(`section-${firstSection}`);
    if (firstContent) {
      firstContent.style.display = "block";
    }
  }
}

if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (!state.isRunning) {
      startTimer();
    } else {
      stopTimer();
    }
    updateProfileButtons();
  });
}

if (pauseBtn) {
  pauseBtn.addEventListener("click", () => {
    pauseTimer();
    updateProfileButtons();
  });
}

function performReset() {
  stopTimer();
  state.currentValue = state.startingValue || 0;
  state.events = [];
  state.totalEvents = 0;
  state.valueAdded = 0;
  updateDisplay();
  updateStats();
  clearEvents();
  saveAllConfig();
  if (resetModal) resetModal.classList.remove("show");
  showToast("Values reset!", "success");
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (resetModal) {
      resetModal.classList.add("show");
    } else {
      if (confirm("Are you sure you want to reset? This will clear all progress.")) {
        performReset();
      }
    }
  });
}

if (toggleReducerBtn) {
  toggleReducerBtn.disabled = !state.isRunning;

  toggleReducerBtn.addEventListener("click", () => {
    if (!state.isRunning) {
      showToast("Start subathon first to enable reducer", "error");
      return;
    }
    
    state.reducer.enabled = !state.reducer.enabled;
    if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = state.reducer.enabled;
    
    if (state.reducer.enabled && state.isRunning && !state.isPaused) {
      startReducer();
    } else {
      stopReducer();
    }
    
    const reducerBtnIcon = document.getElementById("reducerBtnIcon");
    let svg = reducerBtnIcon || toggleReducerBtn.querySelector("svg");
    
    if (!svg) {
      svg = document.createElement("svg");
      svg.id = "reducerBtnIcon";
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.style.cssText = "width: 18px; height: 18px; transition: all 0.3s; display: block;";
      svg.innerHTML = '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>';
      toggleReducerBtn.appendChild(svg);
    }
    
    if (svg) {
      svg.style.display = "block";
      svg.style.opacity = "1";
      
      if (state.reducer.enabled) {
        svg.style.color = "#53fc18";
        svg.style.filter = "drop-shadow(0 0 6px #53fc18)";
        toggleReducerBtn.style.background = "rgba(83, 252, 24, 0.15)";
        toggleReducerBtn.style.border = "1px solid rgba(83, 252, 24, 0.4)";
        toggleReducerBtn.style.transform = "scale(1.05)";
        toggleReducerBtn.style.transition = "all 0.2s ease";
        setTimeout(() => {
          toggleReducerBtn.style.transform = "";
        }, 200);
      } else {
        svg.style.color = "var(--text-secondary)";
        svg.style.filter = "none";
        toggleReducerBtn.style.background = "";
        toggleReducerBtn.style.border = "";
        toggleReducerBtn.style.transform = "scale(0.95)";
        setTimeout(() => {
          toggleReducerBtn.style.transform = "";
        }, 200);
      }
    }
    
    toggleReducerBtn.title = state.reducer.enabled ? "Reducer ON – Click to disable" : "Reducer OFF – Click to enable";
    updateStats();
    saveAllConfig();
    showToast(state.reducer.enabled ? "Reducer ENABLED" : "Reducer DISABLED", state.reducer.enabled ? "success" : "info");
  });
}

if (reducerAmountInput) {
  reducerAmountInput.addEventListener("keydown", (e) => {
    if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
      e.preventDefault();
    }
  });
  
  reducerAmountInput.addEventListener("input", (e) => {
    let value = e.target.value;
    value = value.replace(/[eE\+\-]/g, "");
    if (value && parseFloat(value) < 0) {
      value = "0";
    }
    if (e.target.value !== value) {
      e.target.value = value;
    }
  });
}

if (saveReducerBtn) {
  saveReducerBtn.addEventListener("click", () => {
    state.reducer.enabled = reducerEnabledCheckbox.checked;
    state.reducer.amountPerSecond = parseFloat(reducerAmountInput.value) || 1;
    if (state.reducer.enabled && state.isRunning && !state.isPaused) {
      startReducer();
    } else if (!state.reducer.enabled) {
      stopReducer();
    }
    updateStats();
    saveAllConfig();
    showToast("Reducer settings saved!", "success");
  });
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", () => {
    state.settings.autoSave = !!autoSaveCheckbox.checked;
    state.settings.soundAlerts = !!soundAlertsCheckbox.checked;
    state.settings.startMinimized = !!startMinimizedCheckbox.checked;
    saveAllConfig();
    showToast("General settings saved!", "success");
  });
}

if (clearEventsBtn) {
  clearEventsBtn.addEventListener("click", () => {
    if (clearEventsModal) {
      clearEventsModal.classList.add("show");
    } else {
      if (confirm("Are you sure you want to clear all events? This action cannot be undone.")) {
        state.events = [];
        clearEvents();
        saveAllConfig();
        showToast("Recent events cleared", "info");
      }
    }
  });
}

if (closeClearEventsModalBtn) {
  closeClearEventsModalBtn.addEventListener("click", () => {
    if (clearEventsModal) clearEventsModal.classList.remove("show");
  });
}

if (cancelClearEventsBtn) {
  cancelClearEventsBtn.addEventListener("click", () => {
    if (clearEventsModal) clearEventsModal.classList.remove("show");
  });
}

if (confirmClearEventsBtn) {
  confirmClearEventsBtn.addEventListener("click", () => {
    state.events = [];
    state.totalEvents = 0;
    state.valueAdded = 0;
    clearEvents();
    updateStats();
    saveAllConfig();
    showToast("Recent events cleared", "info");
    if (clearEventsModal) clearEventsModal.classList.remove("show");
  });
}

if (closeDeleteEventModalBtn) {
  closeDeleteEventModalBtn.addEventListener("click", () => {
    if (deleteEventModal) deleteEventModal.classList.remove("show");
    eventToDelete = null;
  });
}

if (cancelDeleteEventBtn) {
  cancelDeleteEventBtn.addEventListener("click", () => {
    if (deleteEventModal) deleteEventModal.classList.remove("show");
    eventToDelete = null;
  });
}

if (deleteEventModal) {
  deleteEventModal.addEventListener("click", (e) => {
    if (e.target === deleteEventModal) {
      deleteEventModal.classList.remove("show");
      eventToDelete = null;
    }
  });
}

if (confirmDeleteEventBtn) {
  confirmDeleteEventBtn.addEventListener("click", () => {
    if (eventToDelete) {
      const { deleteEventById } = require(path.join(scriptDir, "render", "events"));
      deleteEventById(eventToDelete);
      showToast("Event deleted", "info");
      if (deleteEventModal) deleteEventModal.classList.remove("show");
      eventToDelete = null;
    }
  });
}

if (clearValueAddedBtn) {
  clearValueAddedBtn.addEventListener("click", () => {
    if (clearValueAddedModal) {
      clearValueAddedModal.classList.add("show");
    }
  });
}

if (closeClearValueAddedModalBtn) {
  closeClearValueAddedModalBtn.addEventListener("click", () => {
    if (clearValueAddedModal) clearValueAddedModal.classList.remove("show");
  });
}

if (cancelClearValueAddedBtn) {
  cancelClearValueAddedBtn.addEventListener("click", () => {
    if (clearValueAddedModal) clearValueAddedModal.classList.remove("show");
  });
}

if (clearValueAddedModal) {
  clearValueAddedModal.addEventListener("click", (e) => {
    if (e.target === clearValueAddedModal) {
      clearValueAddedModal.classList.remove("show");
    }
  });
}

if (confirmClearValueAddedBtn) {
  confirmClearValueAddedBtn.addEventListener("click", () => {
    state.valueAdded = 0;
    updateStats();
    saveAllConfig();
    showToast("Value Added cleared", "info");
    if (clearValueAddedModal) clearValueAddedModal.classList.remove("show");
  });
}

if (toggleEventsBtn && recentEventsCard) {
  toggleEventsBtn.addEventListener("click", () => {
    recentEventsCard.classList.toggle("collapsed");
    const isCollapsed = recentEventsCard.classList.contains("collapsed");
    toggleEventsBtn.title = isCollapsed ? "Show events" : "Hide events";

    const icon = toggleEventsBtn.querySelector("svg");
    if (icon) {
      icon.style.transition = "transform 0.2s ease";
      icon.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
    }
  });
}

if (editValueBtn) {
  editValueBtn.addEventListener("click", () => {
    const { formatValue } = require(path.join(scriptDir, "render", "utils"));
    editValueInput.value = state.metricType === "time" ? formatValue(state.currentValue) : state.currentValue;
    editModal.classList.add("show");
    editValueInput.select();
  });
}

let adjustValueMode = "increase";

if (increaseValueBtn) {
  increaseValueBtn.addEventListener("click", () => {
    adjustValueMode = "increase";
    adjustValueModalTitle.textContent = "Increase Value";
    adjustValueLabel.textContent = "Amount to Increase";
    adjustValueHint.textContent = state.metricType === "time" 
      ? "Enter time (DD:HH:MM:SS, HH:MM:SS or seconds)" 
      : `Enter amount in ${state.customUnit || "units"}`;
    adjustValueInput.value = "";
    adjustValueInput.placeholder = state.metricType === "time" ? "00:01:00" : "1";
    adjustValueModal.classList.add("show");
    adjustValueInput.focus();
    adjustValueInput.select();
  });
}

if (decreaseValueBtn) {
  decreaseValueBtn.addEventListener("click", () => {
    adjustValueMode = "decrease";
    adjustValueModalTitle.textContent = "Decrease Value";
    adjustValueLabel.textContent = "Amount to Decrease";
    adjustValueHint.textContent = state.metricType === "time" 
      ? "Enter time (DD:HH:MM:SS, HH:MM:SS or seconds)" 
      : `Enter amount in ${state.customUnit || "units"}`;
    adjustValueInput.value = "";
    adjustValueInput.placeholder = state.metricType === "time" ? "00:01:00" : "1";
    adjustValueModal.classList.add("show");
    adjustValueInput.focus();
    adjustValueInput.select();
  });
}

const closeEditModal = () => editModal?.classList.remove("show");
const closeAdjustModal = () => adjustValueModal?.classList.remove("show");
if (closeModalBtn) closeModalBtn.onclick = closeEditModal;
if (cancelEditBtn) cancelEditBtn.onclick = closeEditModal;
if (editModal) editModal.onclick = e => e.target === editModal && closeEditModal();
if (closeAdjustModalBtn) closeAdjustModalBtn.onclick = closeAdjustModal;
if (cancelAdjustBtn) cancelAdjustBtn.onclick = closeAdjustModal;
if (adjustValueModal) adjustValueModal.onclick = e => e.target === adjustValueModal && closeAdjustModal();

if (closeResetModalBtn) closeResetModalBtn.onclick = () => resetModal?.classList.remove("show");
if (cancelResetBtn) cancelResetBtn.onclick = () => resetModal?.classList.remove("show");
if (confirmResetBtn) confirmResetBtn.onclick = performReset;
if (resetModal) resetModal.onclick = e => e.target === resetModal && resetModal.classList.remove("show");

const resetPlatformModal = document.getElementById("resetPlatformModal");
const closeResetPlatformModalBtn = document.getElementById("closeResetPlatformModalBtn");
const cancelResetPlatformBtn = document.getElementById("cancelResetPlatformBtn");
const confirmResetPlatformBtn = document.getElementById("confirmResetPlatformBtn");

if (closeResetPlatformModalBtn) {
  closeResetPlatformModalBtn.addEventListener("click", () => {
    if (resetPlatformModal) resetPlatformModal.classList.remove("show");
  });
}

if (cancelResetPlatformBtn) {
  cancelResetPlatformBtn.addEventListener("click", () => {
    if (resetPlatformModal) resetPlatformModal.classList.remove("show");
  });
}

if (resetPlatformModal) {
  resetPlatformModal.addEventListener("click", (e) => {
    if (e.target === resetPlatformModal) {
      resetPlatformModal.classList.remove("show");
    }
  });
}

if (confirmResetPlatformBtn) {
  confirmResetPlatformBtn.addEventListener("click", () => {
    if (!resetPlatformModal) return;
    
    const platform = resetPlatformModal.dataset.resetFunction;
    const { state } = require(path.join(scriptDir, "render", "state"));
    const { saveAllConfig } = require(path.join(scriptDir, "render", "config"));
    const { showToast } = require(path.join(scriptDir, "render", "toast"));
    const { updateConnectionStatus } = require(path.join(scriptDir, "render", "display"));
    
    if (platform === "kick") {
      const { refreshKickUI } = require(path.join(scriptDir, "render", "kick"));
      state.kick.pusherRegion = "ws-us2";
      state.kick.pusherKey = "32cbd69e4b950bf97679";
      state.kick.chatroomId = "";
      state.kick.username = "";
      state.kick.configured = false;
      saveAllConfig();
      refreshKickUI();
      updateConnectionStatus();
      showToast("Kick config reset to defaults", "info");
    } else if (platform === "twitch") {
      const { refreshTwitchUI } = require(path.join(scriptDir, "render", "twitch"));
      state.twitch.username = "";
      state.twitch.oauth = "";
      state.twitch.channel = "";
      state.twitch.configured = false;
      saveAllConfig();
      refreshTwitchUI();
      updateConnectionStatus();
      showToast("Twitch config reset to defaults", "info");
    } else if (platform === "streamlabs") {
      const { refreshStreamlabsUI } = require(path.join(scriptDir, "render", "streamlabs"));
      const { cleanupStreamlabsSocket } = require(path.join(scriptDir, "render", "streamlabs-socket"));
      if (!state.streamlabs) {
        state.streamlabs = {};
      }
      state.streamlabs.socketToken = "";
      state.streamlabs.configured = false;
      cleanupStreamlabsSocket();
      saveAllConfig();
      refreshStreamlabsUI();
      updateConnectionStatus();
      showToast("Streamlabs config reset to defaults", "info");
    } else if (platform === "donationalerts") {
      const { refreshDonationalertsUI } = require(path.join(scriptDir, "render", "donationalerts"));
      const { cleanupDonationalertsSocket } = require(path.join(scriptDir, "render", "donationalerts-socket"));
      if (!state.donationalerts) {
        state.donationalerts = {};
      }
      state.donationalerts.accessToken = "";
      state.donationalerts.configured = false;
      cleanupDonationalertsSocket();
      saveAllConfig();
      refreshDonationalertsUI();
      updateConnectionStatus();
      showToast("DonationAlerts config reset to defaults", "info");
    }
    
    resetPlatformModal.classList.remove("show");
  });
}

if (saveEditBtn) {
  saveEditBtn.addEventListener("click", () => {
    const { formatValue } = require(path.join(scriptDir, "render", "utils"));
    const input = editValueInput.value.trim();
    let newVal = 0;

    if (state.metricType === "time") {
      if (/^\d+$/.test(input)) {
        newVal = Number(input);
      } else if (/^\d+:\d{2}:\d{2}:\d{2}$/.test(input)) {
        const [d, h, m, s] = input.split(":").map(Number);
        newVal = d * 86400 + h * 3600 + m * 60 + s;
      } else if (/^\d{1,2}:\d{2}:\d{2}$/.test(input)) {
        const [h, m, s] = input.split(":").map(Number);
        newVal = h * 3600 + m * 60 + s;
      } else {
        showToast("Use DD:HH:MM:SS, HH:MM:SS or seconds", "error");
        return;
      }
    } else {
      newVal = parseFloat(input) || 0;
    }

    state.currentValue = Math.max(0, newVal);
    updateDisplay();
    saveAllConfig();
    showToast("Value updated", "success");
    closeEditModal();
  });
}

if (confirmAdjustBtn) {
  confirmAdjustBtn.addEventListener("click", () => {
    const { formatValue } = require(path.join(scriptDir, "render", "utils"));
    const input = adjustValueInput.value.trim();
    let adjustAmount = 0;

    if (state.metricType === "time") {
      if (/^\d+$/.test(input)) {
        adjustAmount = Number(input);
      } else if (/^\d+:\d{2}:\d{2}:\d{2}$/.test(input)) {
        const [d, h, m, s] = input.split(":").map(Number);
        adjustAmount = d * 86400 + h * 3600 + m * 60 + s;
      } else if (/^\d{1,2}:\d{2}:\d{2}$/.test(input)) {
        const [h, m, s] = input.split(":").map(Number);
        adjustAmount = h * 3600 + m * 60 + s;
      } else {
        showToast("Use DD:HH:MM:SS, HH:MM:SS or seconds", "error");
        return;
      }
    } else {
      adjustAmount = parseFloat(input) || 0;
    }

    if (adjustAmount <= 0) {
      showToast("Please enter a positive amount", "error");
      return;
    }

    if (adjustValueMode === "increase") {
      state.currentValue = Math.max(0, state.currentValue + adjustAmount);
      const displayAmount = state.metricType === "time" 
        ? formatValue(adjustAmount) 
        : adjustAmount + (state.customUnit ? ` ${state.customUnit}` : "");
      showToast(`Value increased by ${displayAmount}`, "success");
    } else {
      state.currentValue = Math.max(0, state.currentValue - adjustAmount);
      const displayAmount = state.metricType === "time" 
        ? formatValue(adjustAmount) 
        : adjustAmount + (state.customUnit ? ` ${state.customUnit}` : "");
      showToast(`Value decreased by ${displayAmount}`, "success");
    }

    updateDisplay();
    saveAllConfig();
    closeAdjustModal();
  });
}

if (adjustValueInput) {
  adjustValueInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (confirmAdjustBtn) confirmAdjustBtn.click();
    }
  });
}

ipcRenderer.invoke("load-config").then(data => {
  if (data) {
    if (data.overlayPort) state.overlay.port = data.overlayPort;
    if (data.kick) {
      state.kick.pusherRegion = data.kick.pusherRegion || "ws-us2";
      state.kick.pusherKey = data.kick.pusherKey || "32cbd69e4b950bf97679";
      state.kick.chatroomId = data.kick.chatroomId || "";
      state.kick.username = data.kick.username || "";
      state.kick.configured = !!data.kick.chatroomId;
    }
    if (data.twitch) {
      state.twitch.username = data.twitch.username || "";
      state.twitch.oauth = data.twitch.oauth || "";
      state.twitch.channel = data.twitch.channel || "";
      state.twitch.configured = !!(data.twitch.channel && data.twitch.oauth && data.twitch.username);
    }
    if (data.streamlabs) {
      state.streamlabs.socketToken = data.streamlabs.socketToken || "";
      state.streamlabs.configured = !!data.streamlabs.socketToken;
      if (data.donationalerts) {
        if (!state.donationalerts) state.donationalerts = {};
        state.donationalerts.accessToken = data.donationalerts.accessToken || "";
        state.donationalerts.configured = !!data.donationalerts.accessToken;
      }
    }
    if (data.metricState) {
      state.currentValue = data.metricState.currentValue ?? 0;
      state.startingValue = data.metricState.startingValue ?? (data.metricState.currentValue ?? 0);
      state.metricType = data.metricState.metricType ?? "time";
      state.customUnit = data.metricState.customUnit ?? "";
      state.totalEvents = data.metricState.totalEvents ?? 0;
      state.valueAdded = data.metricState.valueAdded ?? 0;
      state.distanceDisplayMode = data.metricState.distanceDisplayMode || "meters";
    }
    if (data.eventValues) {
      if (!state.config.eventValues) {
        state.config.eventValues = {};
      }
      if (data.eventValues.kick) {
        state.config.eventValues.kick = { ...state.config.eventValues.kick, ...data.eventValues.kick };
      }
      if (data.eventValues.twitch) {
        state.config.eventValues.twitch = { ...state.config.eventValues.twitch, ...data.eventValues.twitch };
      }
      if (data.eventValues.streamlabs) {
        state.config.eventValues.streamlabs = {
          donationCurrencies: { ...(state.config.eventValues.streamlabs?.donationCurrencies || {}), ...(data.eventValues.streamlabs.donationCurrencies || {}) },
          donationEnabled: data.eventValues.streamlabs.donationEnabled !== undefined ? data.eventValues.streamlabs.donationEnabled : (state.config.eventValues.streamlabs?.donationEnabled !== false),
          platformEnabled: data.eventValues.streamlabs.platformEnabled !== undefined ? data.eventValues.streamlabs.platformEnabled : (state.config.eventValues.streamlabs?.platformEnabled !== false)
        };
      }
      if (data.eventValues.donationalerts) {
        state.config.eventValues.donationalerts = {
          donationCurrencies: { ...(state.config.eventValues.donationalerts?.donationCurrencies || {}), ...(data.eventValues.donationalerts.donationCurrencies || {}) },
          donationEnabled: data.eventValues.donationalerts.donationEnabled !== undefined ? data.eventValues.donationalerts.donationEnabled : (state.config.eventValues.donationalerts?.donationEnabled !== false),
          platformEnabled: data.eventValues.donationalerts.platformEnabled !== undefined ? data.eventValues.donationalerts.platformEnabled : (state.config.eventValues.donationalerts?.platformEnabled !== false)
        };
      }
    } else if (!state.config.eventValues) {
      state.config.eventValues = {
        kick: { subValue: 120, giftValue: 60, subEnabled: true, giftEnabled: true, platformEnabled: true },
        twitch: { subValue: 120, giftValue: 60, bitsValue: 30, subEnabled: true, giftEnabled: true, bitsEnabled: true, platformEnabled: true },
        streamlabs: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true },
        donationalerts: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true }
      };
    }
    if (data.events) state.events = data.events || [];
    if (data.settings) Object.assign(state.settings, data.settings);
    if (data.platforms) {
      if (data.platforms.kick) state.platforms.kick.enabled = data.platforms.kick.enabled !== false;
      if (data.platforms.twitch) state.platforms.twitch.enabled = data.platforms.twitch.enabled !== false;
      if (data.platforms.streamlabs) state.platforms.streamlabs.enabled = data.platforms.streamlabs.enabled !== false;
      if (data.platforms.donationalerts) state.platforms.donationalerts.enabled = data.platforms.donationalerts.enabled !== false;
    }
    if (data.overlay) {
      Object.assign(state.overlay, data.overlay);
      if (!state.overlay.port && data.overlayPort) state.overlay.port = data.overlayPort;
      if (!state.overlay.port) state.overlay.port = 55814;
      if (!state.overlay.fontSize) state.overlay.fontSize = 72;
      if (!state.overlay.textColor) state.overlay.textColor = "#ffffff";
      if (!state.overlay.background) state.overlay.background = "transparent";
      if (!state.overlay.bgColor) state.overlay.bgColor = "#000000";
      if (!state.overlay.unitPosition) state.overlay.unitPosition = "bottom";
      if (!state.overlay.unitAlignment) state.overlay.unitAlignment = "center";
      if (!state.overlay.pausedText) state.overlay.pausedText = "PAUSED";
      if (!state.overlay.stoppedText) state.overlay.stoppedText = "STOPPED";
      if (!state.overlay.pausedTextSize) state.overlay.pausedTextSize = 48;
      if (!state.overlay.pausedTextColor) state.overlay.pausedTextColor = "#ffaa00";
      if (state.overlay.showValueWhenPaused === undefined) state.overlay.showValueWhenPaused = true;
      if (state.overlay.showValueWhenStopped === undefined) state.overlay.showValueWhenStopped = true;
      if (state.overlay.showUnitWhenPaused === undefined) state.overlay.showUnitWhenPaused = true;
      if (state.overlay.showUnitWhenStopped === undefined) state.overlay.showUnitWhenStopped = true;
      if (state.overlay.enableValueAnimation === undefined) state.overlay.enableValueAnimation = true;
      if (!state.overlay.animationSpeed) state.overlay.animationSpeed = 1000;
      if (!state.overlay.gifterPosition) state.overlay.gifterPosition = "bottom-left";
      if (!state.overlay.overlayPageBg) state.overlay.overlayPageBg = "#000000";
      if (!state.overlay.textShadow) state.overlay.textShadow = { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" };
      if (!state.overlay.statusTextShadow) state.overlay.statusTextShadow = { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" };
      if (!state.overlay.unitSize) state.overlay.unitSize = 24;
      if (!state.overlay.unitColor) state.overlay.unitColor = "#ffffff";
      if (!state.overlay.gifterCard) state.overlay.gifterCard = {
        animation: "slideUp",
        size: 100,
        bgColor: "#000000",
        borderColor: "#ffffff",
        nameSize: 12,
        nameColor: "#ffffff",
        amountSize: 13,
        amountColor: "#22c55e",
        unitSize: 8
      };
    } else {
      state.overlay = {
        port: data.overlayPort || 55814,
        fontSize: 72,
        textColor: "#ffffff",
        background: "transparent",
        bgColor: "#000000",
        unitPosition: "bottom",
        unitAlignment: "center",
        pausedText: "PAUSED",
        stoppedText: "STOPPED",
        pausedTextSize: 48,
        pausedTextColor: "#ffaa00",
        showValueWhenPaused: true,
        showValueWhenStopped: true,
        showUnitWhenPaused: true,
        showUnitWhenStopped: true,
        enableValueAnimation: true,
        animationSpeed: 1000,
        gifterPosition: "bottom-left",
        overlayPageBg: "#000000",
        textShadow: { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" },
        statusTextShadow: { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" },
        unitSize: 24,
        unitColor: "#ffffff",
        gifterCard: {
          animation: "slideUp",
          size: 100,
          bgColor: "#000000",
          borderColor: "#ffffff",
          nameSize: 12,
          nameColor: "#ffffff",
          amountSize: 13,
          amountColor: "#22c55e",
          unitSize: 8
        }
      };
    }
    if (data.reducer) {
      Object.assign(state.reducer, data.reducer);
    }

    if (metricType) metricType.value = state.metricType;
    if (customUnitInput) customUnitInput.value = state.customUnit || "";
    if (customUnitSection) customUnitSection.style.display = state.metricType === "custom" ? "block" : "none";
    
    const { initializeMetricsUI } = require(path.join(scriptDir, "render", "metrics"));
    if (initializeMetricsUI) initializeMetricsUI();

    if (overlayPortInput) overlayPortInput.value = state.overlay.port || 55814;
    if (fontSize) fontSize.value = state.overlay.fontSize || 72;
    if (fontSizeValue) fontSizeValue.textContent = `${state.overlay.fontSize || 72}px`;
    if (textColor) textColor.value = state.overlay.textColor || "#ffffff";
    if (overlayBackground) overlayBackground.value = state.overlay.background || "transparent";
    if (bgColor) bgColor.value = state.overlay.bgColor || "#000000";
    
    if (unitPosition) unitPosition.value = state.overlay.unitPosition || "bottom";
    if (unitAlignment) unitAlignment.value = state.overlay.unitAlignment || "center";
    if (pausedText) pausedText.value = state.overlay.pausedText || "PAUSED";
    if (stoppedText) stoppedText.value = state.overlay.stoppedText || "STOPPED";
    if (pausedTextSize) {
      pausedTextSize.value = state.overlay.pausedTextSize || 48;
      if (pausedTextSizeValue) pausedTextSizeValue.textContent = `${state.overlay.pausedTextSize || 48}px`;
    }
    if (pausedTextColor) pausedTextColor.value = state.overlay.pausedTextColor || "#ffaa00";
    if (showValueWhenPaused) showValueWhenPaused.checked = state.overlay.showValueWhenPaused !== false;
    if (showValueWhenStopped) showValueWhenStopped.checked = state.overlay.showValueWhenStopped !== false;
    
    const showUnitWhenPaused = document.getElementById("showUnitWhenPaused");
    const showUnitWhenStopped = document.getElementById("showUnitWhenStopped");
    if (showUnitWhenPaused) showUnitWhenPaused.checked = state.overlay.showUnitWhenPaused !== false;
    if (showUnitWhenStopped) showUnitWhenStopped.checked = state.overlay.showUnitWhenStopped !== false;
    
    const enableValueAnimation = document.getElementById("enableValueAnimation");
    const animationSpeed = document.getElementById("animationSpeed");
    const animationSpeedValue = document.getElementById("animationSpeedValue");
    const animationSpeedGroup = document.getElementById("animationSpeedGroup");
    if (enableValueAnimation) {
      enableValueAnimation.checked = state.overlay.enableValueAnimation !== false;
      if (animationSpeedGroup) {
        animationSpeedGroup.style.display = enableValueAnimation.checked ? "block" : "none";
      }
    }
    if (animationSpeed) {
      animationSpeed.value = state.overlay.animationSpeed || 1000;
      if (animationSpeedValue) animationSpeedValue.textContent = `${state.overlay.animationSpeed || 1000}ms`;
    }
    
    const gifterVerticalPosition = document.getElementById("gifterVerticalPosition");
    const gifterHorizontalPosition = document.getElementById("gifterHorizontalPosition");
    if (gifterVerticalPosition && gifterHorizontalPosition && state.overlay.gifterPosition) {
      const [vertical, horizontal] = state.overlay.gifterPosition.split('-');
      if (vertical) gifterVerticalPosition.value = vertical;
      if (horizontal) gifterHorizontalPosition.value = horizontal;
    }
    
    const overlayPageBg = document.getElementById("overlayPageBg");
    if (overlayPageBg) overlayPageBg.value = state.overlay.overlayPageBg || "#000000";
    
    const enableTextShadow = document.getElementById("enableTextShadow");
    const textShadowControls = document.getElementById("textShadowControls");
    const textShadowX = document.getElementById("textShadowX");
    const textShadowY = document.getElementById("textShadowY");
    const textShadowBlur = document.getElementById("textShadowBlur");
    const textShadowColor = document.getElementById("textShadowColor");
    if (enableTextShadow) {
      enableTextShadow.checked = state.overlay.textShadow?.enabled !== false;
      if (textShadowControls) textShadowControls.style.display = enableTextShadow.checked ? "grid" : "none";
    }
    if (textShadowX && state.overlay.textShadow) textShadowX.value = state.overlay.textShadow.x || 0;
    if (textShadowY && state.overlay.textShadow) textShadowY.value = state.overlay.textShadow.y || 4;
    if (textShadowBlur && state.overlay.textShadow) textShadowBlur.value = state.overlay.textShadow.blur || 12;
    if (textShadowColor && state.overlay.textShadow) textShadowColor.value = state.overlay.textShadow.color || "#000000";
    
    const enableStatusTextShadow = document.getElementById("enableStatusTextShadow");
    const statusTextShadowControls = document.getElementById("statusTextShadowControls");
    const statusTextShadowX = document.getElementById("statusTextShadowX");
    const statusTextShadowY = document.getElementById("statusTextShadowY");
    const statusTextShadowBlur = document.getElementById("statusTextShadowBlur");
    const statusTextShadowColor = document.getElementById("statusTextShadowColor");
    if (enableStatusTextShadow) {
      enableStatusTextShadow.checked = state.overlay.statusTextShadow?.enabled !== false;
      if (statusTextShadowControls) statusTextShadowControls.style.display = enableStatusTextShadow.checked ? "grid" : "none";
    }
    if (statusTextShadowX && state.overlay.statusTextShadow) statusTextShadowX.value = state.overlay.statusTextShadow.x || 0;
    if (statusTextShadowY && state.overlay.statusTextShadow) statusTextShadowY.value = state.overlay.statusTextShadow.y || 4;
    if (statusTextShadowBlur && state.overlay.statusTextShadow) statusTextShadowBlur.value = state.overlay.statusTextShadow.blur || 12;
    if (statusTextShadowColor && state.overlay.statusTextShadow) statusTextShadowColor.value = state.overlay.statusTextShadow.color || "#000000";
    
    const unitSize = document.getElementById("unitSize");
    const unitSizeValue = document.getElementById("unitSizeValue");
    const unitColor = document.getElementById("unitColor");
    if (unitSize) {
      unitSize.value = state.overlay.unitSize || 24;
      if (unitSizeValue) unitSizeValue.textContent = `${state.overlay.unitSize || 24}px`;
    }
    if (unitColor) unitColor.value = state.overlay.unitColor || "#ffffff";
    
    const gifterAnimation = document.getElementById("gifterAnimation");
    const gifterCardSize = document.getElementById("gifterCardSize");
    const gifterCardSizeValue = document.getElementById("gifterCardSizeValue");
    const gifterCardBg = document.getElementById("gifterCardBg");
    const gifterCardBorder = document.getElementById("gifterCardBorder");
    const gifterNameSize = document.getElementById("gifterNameSize");
    const gifterNameSizeValue = document.getElementById("gifterNameSizeValue");
    const gifterNameColor = document.getElementById("gifterNameColor");
    const gifterAmountSize = document.getElementById("gifterAmountSize");
    const gifterAmountSizeValue = document.getElementById("gifterAmountSizeValue");
    const gifterAmountColor = document.getElementById("gifterAmountColor");
    const gifterUnitSize = document.getElementById("gifterUnitSize");
    const gifterUnitSizeValue = document.getElementById("gifterUnitSizeValue");
    
    if (state.overlay.gifterCard) {
      if (gifterAnimation) gifterAnimation.value = state.overlay.gifterCard.animation || "slideUp";
      if (gifterCardSize) {
        gifterCardSize.value = state.overlay.gifterCard.size || 100;
        if (gifterCardSizeValue) gifterCardSizeValue.textContent = `${state.overlay.gifterCard.size || 100}%`;
      }
      if (gifterCardBg) gifterCardBg.value = state.overlay.gifterCard.bgColor || "#000000";
      if (gifterCardBorder) gifterCardBorder.value = state.overlay.gifterCard.borderColor || "#ffffff";
      if (gifterNameSize) {
        gifterNameSize.value = state.overlay.gifterCard.nameSize || 12;
        if (gifterNameSizeValue) gifterNameSizeValue.textContent = `${state.overlay.gifterCard.nameSize || 12}px`;
      }
      if (gifterNameColor) gifterNameColor.value = state.overlay.gifterCard.nameColor || "#ffffff";
      if (gifterAmountSize) {
        gifterAmountSize.value = state.overlay.gifterCard.amountSize || 13;
        if (gifterAmountSizeValue) gifterAmountSizeValue.textContent = `${state.overlay.gifterCard.amountSize || 13}px`;
      }
      if (gifterAmountColor) gifterAmountColor.value = state.overlay.gifterCard.amountColor || "#22c55e";
      if (gifterUnitSize) {
        gifterUnitSize.value = state.overlay.gifterCard.unitSize || 8;
        if (gifterUnitSizeValue) gifterUnitSizeValue.textContent = `${state.overlay.gifterCard.unitSize || 8}px`;
      }
    }

    if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = state.reducer.enabled;
    if (reducerAmountInput) reducerAmountInput.value = state.reducer.amountPerSecond;

    if (autoSaveCheckbox) autoSaveCheckbox.checked = state.settings.autoSave;
    if (soundAlertsCheckbox) soundAlertsCheckbox.checked = state.settings.soundAlerts;
    if (startMinimizedCheckbox) startMinimizedCheckbox.checked = state.settings.startMinimized;

    refreshKickUI();
    refreshTwitchUI();
    refreshStreamlabsUI();
    refreshDonationalertsUI();
    ensureKickSocketRunning();
    ensureTwitchSocketRunning();
    ensureStreamlabsSocketRunning();
    ensureDonationalertsSocketRunning();
    applyOverlayChanges();
    applyMetricsNow();
    updateDisplay();
    updateStats();
    renderEventsList();
    updateConnectionStatus();
  }
});

ipcRenderer.on("config-loaded", (event, data) => {
  if (data) {
    if (data.overlayPort) state.overlay.port = data.overlayPort;
    if (data.kick) {
      state.kick.pusherRegion = data.kick.pusherRegion || "ws-us2";
      state.kick.pusherKey = data.kick.pusherKey || "32cbd69e4b950bf97679";
      state.kick.chatroomId = data.kick.chatroomId || "";
      state.kick.username = data.kick.username || "";
      state.kick.configured = !!data.kick.chatroomId;
    }
    if (data.twitch) {
      state.twitch.username = data.twitch.username || "";
      state.twitch.oauth = data.twitch.oauth || "";
      state.twitch.channel = data.twitch.channel || "";
      state.twitch.configured = !!(data.twitch.channel && data.twitch.oauth && data.twitch.username);
    }
    if (data.streamlabs) {
      state.streamlabs.socketToken = data.streamlabs.socketToken || "";
      state.streamlabs.configured = !!data.streamlabs.socketToken;
      if (data.donationalerts) {
        if (!state.donationalerts) state.donationalerts = {};
        state.donationalerts.accessToken = data.donationalerts.accessToken || "";
        state.donationalerts.configured = !!data.donationalerts.accessToken;
      }
    }
    if (data.metricState) {
      state.currentValue = data.metricState.currentValue ?? 0;
      state.startingValue = data.metricState.startingValue ?? (data.metricState.currentValue ?? 0);
      state.metricType = data.metricState.metricType ?? "time";
      state.customUnit = data.metricState.customUnit ?? "";
      state.totalEvents = data.metricState.totalEvents ?? 0;
      state.valueAdded = data.metricState.valueAdded ?? 0;
      state.distanceDisplayMode = data.metricState.distanceDisplayMode || "meters";
    }
    if (data.eventValues) {
      if (!state.config.eventValues) {
        state.config.eventValues = {};
      }
      if (data.eventValues.kick) {
        state.config.eventValues.kick = { ...state.config.eventValues.kick, ...data.eventValues.kick };
      }
      if (data.eventValues.twitch) {
        state.config.eventValues.twitch = { ...state.config.eventValues.twitch, ...data.eventValues.twitch };
      }
      if (data.eventValues.streamlabs) {
        state.config.eventValues.streamlabs = {
          donationCurrencies: { ...(state.config.eventValues.streamlabs?.donationCurrencies || {}), ...(data.eventValues.streamlabs.donationCurrencies || {}) },
          donationEnabled: data.eventValues.streamlabs.donationEnabled !== undefined ? data.eventValues.streamlabs.donationEnabled : (state.config.eventValues.streamlabs?.donationEnabled !== false),
          platformEnabled: data.eventValues.streamlabs.platformEnabled !== undefined ? data.eventValues.streamlabs.platformEnabled : (state.config.eventValues.streamlabs?.platformEnabled !== false)
        };
      }
      if (data.eventValues.donationalerts) {
        state.config.eventValues.donationalerts = {
          donationCurrencies: { ...(state.config.eventValues.donationalerts?.donationCurrencies || {}), ...(data.eventValues.donationalerts.donationCurrencies || {}) },
          donationEnabled: data.eventValues.donationalerts.donationEnabled !== undefined ? data.eventValues.donationalerts.donationEnabled : (state.config.eventValues.donationalerts?.donationEnabled !== false),
          platformEnabled: data.eventValues.donationalerts.platformEnabled !== undefined ? data.eventValues.donationalerts.platformEnabled : (state.config.eventValues.donationalerts?.platformEnabled !== false)
        };
      }
    } else if (!state.config.eventValues) {
      state.config.eventValues = {
        kick: { subValue: 120, giftValue: 60, subEnabled: true, giftEnabled: true, platformEnabled: true },
        twitch: { subValue: 120, giftValue: 60, bitsValue: 30, subEnabled: true, giftEnabled: true, bitsEnabled: true, platformEnabled: true },
        streamlabs: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true },
        donationalerts: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true }
      };
    }
    if (data.events) state.events = data.events || [];
    if (data.settings) Object.assign(state.settings, data.settings);
    if (data.platforms) {
      if (data.platforms.kick) state.platforms.kick.enabled = data.platforms.kick.enabled !== false;
      if (data.platforms.twitch) state.platforms.twitch.enabled = data.platforms.twitch.enabled !== false;
      if (data.platforms.streamlabs) state.platforms.streamlabs.enabled = data.platforms.streamlabs.enabled !== false;
      if (data.platforms.donationalerts) state.platforms.donationalerts.enabled = data.platforms.donationalerts.enabled !== false;
    }
    if (data.overlay) {
      Object.assign(state.overlay, data.overlay);
      if (!state.overlay.port && data.overlayPort) state.overlay.port = data.overlayPort;
      if (!state.overlay.port) state.overlay.port = 55814;
      if (!state.overlay.fontSize) state.overlay.fontSize = 72;
      if (!state.overlay.textColor) state.overlay.textColor = "#ffffff";
      if (!state.overlay.background) state.overlay.background = "transparent";
      if (!state.overlay.bgColor) state.overlay.bgColor = "#000000";
      if (!state.overlay.unitPosition) state.overlay.unitPosition = "bottom";
      if (!state.overlay.unitAlignment) state.overlay.unitAlignment = "center";
      if (!state.overlay.pausedText) state.overlay.pausedText = "PAUSED";
      if (!state.overlay.stoppedText) state.overlay.stoppedText = "STOPPED";
      if (!state.overlay.pausedTextSize) state.overlay.pausedTextSize = 48;
      if (!state.overlay.pausedTextColor) state.overlay.pausedTextColor = "#ffaa00";
      if (state.overlay.showValueWhenPaused === undefined) state.overlay.showValueWhenPaused = true;
      if (state.overlay.showValueWhenStopped === undefined) state.overlay.showValueWhenStopped = true;
      if (state.overlay.showUnitWhenPaused === undefined) state.overlay.showUnitWhenPaused = true;
      if (state.overlay.showUnitWhenStopped === undefined) state.overlay.showUnitWhenStopped = true;
      if (state.overlay.enableValueAnimation === undefined) state.overlay.enableValueAnimation = true;
      if (!state.overlay.animationSpeed) state.overlay.animationSpeed = 1000;
      if (!state.overlay.gifterPosition) state.overlay.gifterPosition = "bottom-left";
      if (!state.overlay.overlayPageBg) state.overlay.overlayPageBg = "#000000";
      if (!state.overlay.textShadow) state.overlay.textShadow = { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" };
      if (!state.overlay.statusTextShadow) state.overlay.statusTextShadow = { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" };
      if (!state.overlay.unitSize) state.overlay.unitSize = 24;
      if (!state.overlay.unitColor) state.overlay.unitColor = "#ffffff";
      if (!state.overlay.gifterCard) state.overlay.gifterCard = {
        animation: "slideUp",
        size: 100,
        bgColor: "#000000",
        borderColor: "#ffffff",
        nameSize: 12,
        nameColor: "#ffffff",
        amountSize: 13,
        amountColor: "#22c55e",
        unitSize: 8
      };
    } else {
      state.overlay = {
        port: data.overlayPort || 55814,
        fontSize: 72,
        textColor: "#ffffff",
        background: "transparent",
        bgColor: "#000000",
        unitPosition: "bottom",
        unitAlignment: "center",
        pausedText: "PAUSED",
        stoppedText: "STOPPED",
        pausedTextSize: 48,
        pausedTextColor: "#ffaa00",
        showValueWhenPaused: true,
        showValueWhenStopped: true,
        showUnitWhenPaused: true,
        showUnitWhenStopped: true,
        enableValueAnimation: true,
        animationSpeed: 1000,
        gifterPosition: "bottom-left",
        overlayPageBg: "#000000",
        textShadow: { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" },
        statusTextShadow: { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" },
        unitSize: 24,
        unitColor: "#ffffff",
        gifterCard: {
          animation: "slideUp",
          size: 100,
          bgColor: "#000000",
          borderColor: "#ffffff",
          nameSize: 12,
          nameColor: "#ffffff",
          amountSize: 13,
          amountColor: "#22c55e",
          unitSize: 8
        }
      };
    }
    if (data.reducer) {
      Object.assign(state.reducer, data.reducer);
    }

    if (metricType) metricType.value = state.metricType;
    if (customUnitInput) customUnitInput.value = state.customUnit || "";
    if (customUnitSection) customUnitSection.style.display = state.metricType === "custom" ? "block" : "none";
    
    const { initializeMetricsUI } = require(path.join(scriptDir, "render", "metrics"));
    if (initializeMetricsUI) initializeMetricsUI();

    if (overlayPortInput) overlayPortInput.value = state.overlay.port || 55814;
    if (fontSize) fontSize.value = state.overlay.fontSize || 72;
    if (fontSizeValue) fontSizeValue.textContent = `${state.overlay.fontSize || 72}px`;
    if (textColor) textColor.value = state.overlay.textColor || "#ffffff";
    if (overlayBackground) overlayBackground.value = state.overlay.background || "transparent";
    if (bgColor) bgColor.value = state.overlay.bgColor || "#000000";
    
    if (unitPosition) unitPosition.value = state.overlay.unitPosition || "bottom";
    if (unitAlignment) unitAlignment.value = state.overlay.unitAlignment || "center";
    if (pausedText) pausedText.value = state.overlay.pausedText || "PAUSED";
    if (stoppedText) stoppedText.value = state.overlay.stoppedText || "STOPPED";
    if (pausedTextSize) {
      pausedTextSize.value = state.overlay.pausedTextSize || 48;
      if (pausedTextSizeValue) pausedTextSizeValue.textContent = `${state.overlay.pausedTextSize || 48}px`;
    }
    if (pausedTextColor) pausedTextColor.value = state.overlay.pausedTextColor || "#ffaa00";
    if (showValueWhenPaused) showValueWhenPaused.checked = state.overlay.showValueWhenPaused !== false;
    if (showValueWhenStopped) showValueWhenStopped.checked = state.overlay.showValueWhenStopped !== false;
    
    const showUnitWhenPaused = document.getElementById("showUnitWhenPaused");
    const showUnitWhenStopped = document.getElementById("showUnitWhenStopped");
    if (showUnitWhenPaused) showUnitWhenPaused.checked = state.overlay.showUnitWhenPaused !== false;
    if (showUnitWhenStopped) showUnitWhenStopped.checked = state.overlay.showUnitWhenStopped !== false;
    
    const enableValueAnimation = document.getElementById("enableValueAnimation");
    const animationSpeed = document.getElementById("animationSpeed");
    const animationSpeedValue = document.getElementById("animationSpeedValue");
    const animationSpeedGroup = document.getElementById("animationSpeedGroup");
    if (enableValueAnimation) {
      enableValueAnimation.checked = state.overlay.enableValueAnimation !== false;
      if (animationSpeedGroup) {
        animationSpeedGroup.style.display = enableValueAnimation.checked ? "block" : "none";
      }
    }
    if (animationSpeed) {
      animationSpeed.value = state.overlay.animationSpeed || 1000;
      if (animationSpeedValue) animationSpeedValue.textContent = `${state.overlay.animationSpeed || 1000}ms`;
    }
    
    const gifterVerticalPosition = document.getElementById("gifterVerticalPosition");
    const gifterHorizontalPosition = document.getElementById("gifterHorizontalPosition");
    if (gifterVerticalPosition && gifterHorizontalPosition && state.overlay.gifterPosition) {
      const [vertical, horizontal] = state.overlay.gifterPosition.split('-');
      if (vertical) gifterVerticalPosition.value = vertical;
      if (horizontal) gifterHorizontalPosition.value = horizontal;
    }
    
    const overlayPageBg = document.getElementById("overlayPageBg");
    if (overlayPageBg) overlayPageBg.value = state.overlay.overlayPageBg || "#000000";
    
    const enableTextShadow = document.getElementById("enableTextShadow");
    const textShadowControls = document.getElementById("textShadowControls");
    const textShadowX = document.getElementById("textShadowX");
    const textShadowY = document.getElementById("textShadowY");
    const textShadowBlur = document.getElementById("textShadowBlur");
    const textShadowColor = document.getElementById("textShadowColor");
    if (enableTextShadow) {
      enableTextShadow.checked = state.overlay.textShadow?.enabled !== false;
      if (textShadowControls) textShadowControls.style.display = enableTextShadow.checked ? "grid" : "none";
    }
    if (textShadowX && state.overlay.textShadow) textShadowX.value = state.overlay.textShadow.x || 0;
    if (textShadowY && state.overlay.textShadow) textShadowY.value = state.overlay.textShadow.y || 4;
    if (textShadowBlur && state.overlay.textShadow) textShadowBlur.value = state.overlay.textShadow.blur || 12;
    if (textShadowColor && state.overlay.textShadow) textShadowColor.value = state.overlay.textShadow.color || "#000000";
    
    const enableStatusTextShadow = document.getElementById("enableStatusTextShadow");
    const statusTextShadowControls = document.getElementById("statusTextShadowControls");
    const statusTextShadowX = document.getElementById("statusTextShadowX");
    const statusTextShadowY = document.getElementById("statusTextShadowY");
    const statusTextShadowBlur = document.getElementById("statusTextShadowBlur");
    const statusTextShadowColor = document.getElementById("statusTextShadowColor");
    if (enableStatusTextShadow) {
      enableStatusTextShadow.checked = state.overlay.statusTextShadow?.enabled !== false;
      if (statusTextShadowControls) statusTextShadowControls.style.display = enableStatusTextShadow.checked ? "grid" : "none";
    }
    if (statusTextShadowX && state.overlay.statusTextShadow) statusTextShadowX.value = state.overlay.statusTextShadow.x || 0;
    if (statusTextShadowY && state.overlay.statusTextShadow) statusTextShadowY.value = state.overlay.statusTextShadow.y || 4;
    if (statusTextShadowBlur && state.overlay.statusTextShadow) statusTextShadowBlur.value = state.overlay.statusTextShadow.blur || 12;
    if (statusTextShadowColor && state.overlay.statusTextShadow) statusTextShadowColor.value = state.overlay.statusTextShadow.color || "#000000";
    
    const unitSize = document.getElementById("unitSize");
    const unitSizeValue = document.getElementById("unitSizeValue");
    const unitColor = document.getElementById("unitColor");
    if (unitSize) {
      unitSize.value = state.overlay.unitSize || 24;
      if (unitSizeValue) unitSizeValue.textContent = `${state.overlay.unitSize || 24}px`;
    }
    if (unitColor) unitColor.value = state.overlay.unitColor || "#ffffff";
    
    const gifterAnimation = document.getElementById("gifterAnimation");
    const gifterCardSize = document.getElementById("gifterCardSize");
    const gifterCardSizeValue = document.getElementById("gifterCardSizeValue");
    const gifterCardBg = document.getElementById("gifterCardBg");
    const gifterCardBorder = document.getElementById("gifterCardBorder");
    const gifterNameSize = document.getElementById("gifterNameSize");
    const gifterNameSizeValue = document.getElementById("gifterNameSizeValue");
    const gifterNameColor = document.getElementById("gifterNameColor");
    const gifterAmountSize = document.getElementById("gifterAmountSize");
    const gifterAmountSizeValue = document.getElementById("gifterAmountSizeValue");
    const gifterAmountColor = document.getElementById("gifterAmountColor");
    const gifterUnitSize = document.getElementById("gifterUnitSize");
    const gifterUnitSizeValue = document.getElementById("gifterUnitSizeValue");
    
    if (state.overlay.gifterCard) {
      if (gifterAnimation) gifterAnimation.value = state.overlay.gifterCard.animation || "slideUp";
      if (gifterCardSize) {
        gifterCardSize.value = state.overlay.gifterCard.size || 100;
        if (gifterCardSizeValue) gifterCardSizeValue.textContent = `${state.overlay.gifterCard.size || 100}%`;
      }
      if (gifterCardBg) gifterCardBg.value = state.overlay.gifterCard.bgColor || "#000000";
      if (gifterCardBorder) gifterCardBorder.value = state.overlay.gifterCard.borderColor || "#ffffff";
      if (gifterNameSize) {
        gifterNameSize.value = state.overlay.gifterCard.nameSize || 12;
        if (gifterNameSizeValue) gifterNameSizeValue.textContent = `${state.overlay.gifterCard.nameSize || 12}px`;
      }
      if (gifterNameColor) gifterNameColor.value = state.overlay.gifterCard.nameColor || "#ffffff";
      if (gifterAmountSize) {
        gifterAmountSize.value = state.overlay.gifterCard.amountSize || 13;
        if (gifterAmountSizeValue) gifterAmountSizeValue.textContent = `${state.overlay.gifterCard.amountSize || 13}px`;
      }
      if (gifterAmountColor) gifterAmountColor.value = state.overlay.gifterCard.amountColor || "#22c55e";
      if (gifterUnitSize) {
        gifterUnitSize.value = state.overlay.gifterCard.unitSize || 8;
        if (gifterUnitSizeValue) gifterUnitSizeValue.textContent = `${state.overlay.gifterCard.unitSize || 8}px`;
      }
    }

    if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = state.reducer.enabled;
    if (reducerAmountInput) reducerAmountInput.value = state.reducer.amountPerSecond;

    if (autoSaveCheckbox) autoSaveCheckbox.checked = state.settings.autoSave;
    if (soundAlertsCheckbox) soundAlertsCheckbox.checked = state.settings.soundAlerts;
    if (startMinimizedCheckbox) startMinimizedCheckbox.checked = state.settings.startMinimized;

    refreshKickUI();
    refreshStreamlabsUI();
    refreshDonationalertsUI();
    ensureKickSocketRunning();
    ensureStreamlabsSocketRunning();
    ensureDonationalertsSocketRunning();
    applyOverlayChanges();
    applyMetricsNow();
    updateDisplay();
    updateStats();
    renderEventsList();
    updateConnectionStatus();
    
    setTimeout(() => {
      const overlayPreview = document.getElementById("overlayPreview");
      if (overlayPreview && overlayPreview.tagName === "IFRAME") {
        const port = state.overlay?.port || 55814;
        if (port && !isNaN(port) && port > 0 && port <= 65535) {
          overlayPreview.src = `http://localhost:${port}/overlay`;
        }
      }
    }, 1000);
    
    ipcRenderer.on("overlay-server-restarted", (event, data) => {
      const overlayPreview = document.getElementById("overlayPreview");
      if (overlayPreview && overlayPreview.tagName === "IFRAME") {
        const port = data?.port || state.overlay?.port || 55814;
        if (port && !isNaN(port) && port > 0 && port <= 65535) {
          overlayPreview.src = `http://localhost:${port}/overlay`;
        }
      }
      const { showToast } = require(path.join(scriptDir, "render", "toast"));
      const port = data?.port || state.overlay?.port || 55814;
      showToast(`Overlay server restarted on port ${port}`, "success");
      
      const { refreshKickUI } = require(path.join(scriptDir, "render", "kick"));
      refreshKickUI();
    });
    
    if (toggleReducerBtn) {
      const reducerBtnIcon = document.getElementById("reducerBtnIcon");
      let svg = reducerBtnIcon || toggleReducerBtn.querySelector("svg");
      if (!svg) {
        svg = document.createElement("svg");
        svg.id = "reducerBtnIcon";
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.style.cssText = "width: 18px; height: 18px; transition: all 0.3s; display: block;";
        svg.innerHTML = '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>';
        toggleReducerBtn.appendChild(svg);
      }
      svg.style.display = "block";
      svg.style.opacity = "1";
      if (state.reducer.enabled) {
        svg.style.color = "#53fc18";
        svg.style.filter = "drop-shadow(0 0 6px #53fc18)";
        toggleReducerBtn.style.background = "rgba(83, 252, 24, 0.15)";
        toggleReducerBtn.style.border = "1px solid rgba(83, 252, 24, 0.4)";
      } else {
        svg.style.color = "var(--text-secondary)";
        svg.style.filter = "none";
        toggleReducerBtn.style.background = "";
        toggleReducerBtn.style.border = "";
      }
    }
  }
});

window.addTestEvent = () => addEvent("Test Event", "KICK", 120);
document.addEventListener("keydown", e => e.ctrlKey && e.key === "t" && window.addTestEvent());

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey) {
    return true;
  }
  
  if (e.key === "Insert") {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  if (e.key === "PageUp" || e.key === "PageDown") {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  if (e.key === "Tab" && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    
    const navItemsArray = Array.from(navItems);
    const currentActive = navItemsArray.findIndex(item => item.classList.contains("active"));
    const nextIndex = (currentActive + 1) % navItemsArray.length;
    const nextItem = navItemsArray[nextIndex];
    
    if (nextItem) {
      nextItem.click();
    }
    
    return false;
  }
  
  if (e.key === "Tab" && e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    
    const navItemsArray = Array.from(navItems);
    const currentActive = navItemsArray.findIndex(item => item.classList.contains("active"));
    const prevIndex = currentActive <= 0 ? navItemsArray.length - 1 : currentActive - 1;
    const prevItem = navItemsArray[prevIndex];
    
    if (prevItem) {
      prevItem.click();
    }
    
    return false;
  }
  
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    const allowedSystemKeys = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];
    const isSystemShortcut = allowedSystemKeys.includes(e.key) || e.shiftKey;
    
    if (!isSystemShortcut) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
});

const demoTestBtn = document.getElementById("demoTestBtn");
if (demoTestBtn) {
  demoTestBtn.addEventListener("click", () => {
    const testNames = ["TestUser123", "DemoGifter", "StreamFan", "Supporter", "Viewer", "Subscriber"];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomValue = Math.floor(Math.random() * 300) + 60;
    
    addEvent("Test Subscription", "Manual", randomValue, randomName);
    
    const { showToast } = require(path.join(scriptDir, "render", "toast"));
    showToast(`Demo event: ${randomName} added ${randomValue} units`, "success");
  });
}

const openOverlayBtn = document.getElementById("openOverlayBtn");
if (openOverlayBtn) {
  openOverlayBtn.addEventListener("click", () => {
    const port = state.overlay?.port || 55814;
    if (port && !isNaN(port) && port > 0 && port <= 65535) {
      const url = `http://localhost:${port}/overlay`;
      ipcRenderer.invoke("open-external", url);
    }
  });
}

setTimeout(() => {
  const savedPage = localStorage.getItem("lastActivePage") || "dashboard";
  switchToPage(savedPage);
}, 10);

updateDisplay();
updateStats();
clearEvents();
updateUnitLabels();
updateConnectionStatus();

document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (link && link.href) {
    const url = link.href;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      e.preventDefault();
      e.stopPropagation();
      shell.openExternal(url);
      return false;
    }
  }
});

const iconButtons = document.querySelectorAll(".btn-icon[title]");
let tooltipElement = null;
let tooltipTimeout = null;
let hideTimeout = null;

iconButtons.forEach(btn => {
  btn.addEventListener("mouseenter", (e) => {
    const title = btn.getAttribute("title");
    if (!title) return;
    
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    
    if (tooltipElement) {
      tooltipElement.textContent = title;
      const rect = btn.getBoundingClientRect();
      tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
      tooltipElement.style.top = `${rect.bottom + 12}px`;
      tooltipElement.classList.add("show");
      tooltipElement.style.transform = "translateX(-50%) translateY(0)";
      return;
    }
    
    tooltipElement = document.createElement("div");
    tooltipElement.className = "btn-tooltip";
    tooltipElement.textContent = title;
    document.body.appendChild(tooltipElement);
    
    const rect = btn.getBoundingClientRect();
    tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
    tooltipElement.style.top = `${rect.bottom + 12}px`;
    tooltipElement.style.transform = "translateX(-50%) translateY(-12px)";
    
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    
    tooltipTimeout = setTimeout(() => {
      if (tooltipElement) {
        tooltipElement.classList.add("show");
        tooltipElement.style.transform = "translateX(-50%) translateY(0)";
      }
      tooltipTimeout = null;
    }, 10);
  });
  
  btn.addEventListener("mouseleave", () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }
    
    if (tooltipElement) {
      tooltipElement.classList.remove("show");
      hideTimeout = setTimeout(() => {
        if (tooltipElement) {
          tooltipElement.remove();
          tooltipElement = null;
        }
        hideTimeout = null;
      }, 200);
    }
  });
});

if (toggleReducerBtn) {
  const reducerBtnIcon = document.getElementById("reducerBtnIcon");
  const svg = reducerBtnIcon || toggleReducerBtn.querySelector("svg");
  if (svg) {
    svg.style.display = "block";
    svg.style.opacity = "1";
    
    if (state.reducer.enabled) {
      svg.style.color = "#53fc18";
      svg.style.filter = "drop-shadow(0 0 6px #53fc18)";
      toggleReducerBtn.style.background = "rgba(83, 252, 24, 0.15)";
      toggleReducerBtn.style.border = "1px solid rgba(83, 252, 24, 0.4)";
    } else {
      svg.style.color = "var(--text-secondary)";
      svg.style.filter = "none";
      toggleReducerBtn.style.background = "";
      toggleReducerBtn.style.border = "";
    }
  } else {
    const icon = document.createElement("svg");
    icon.id = "reducerBtnIcon";
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.style.cssText = "width: 18px; height: 18px; transition: all 0.3s; display: block;";
    icon.innerHTML = '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>';
    toggleReducerBtn.appendChild(icon);
    icon.style.color = "var(--text-secondary)";
  }
}
