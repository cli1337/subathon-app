const { ipcRenderer } = require("electron");
const { state } = require("./state");
const { getUnitDisplay, formatValue } = require("./utils");

module.exports.overlayUpdateTimeout = null;

let mainDisplay, displayUnit, totalEventsEl, valueAddedEl, connectionStatus, statusText;
let reducerStatus, reducerIcon, cornerValueDisplay, previewText, previewUnit;

function initDisplayElements() {
  mainDisplay = document.getElementById("mainDisplay");
  displayUnit = document.getElementById("displayUnit");
  totalEventsEl = document.getElementById("totalEvents");
  valueAddedEl = document.getElementById("valueAdded");
  connectionStatus = document.getElementById("connectionStatus");
  statusText = document.getElementById("statusText");
  reducerStatus = document.getElementById("reducerStatus");
  reducerIcon = document.getElementById("reducerIcon");
  cornerValueDisplay = document.getElementById("cornerValueDisplay");
  previewText = document.getElementById("previewText");
  previewUnit = document.getElementById("previewUnit");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDisplayElements);
} else {
  initDisplayElements();
}

function updateDisplay() {
  if (!mainDisplay) initDisplayElements();

  const formatted = formatValue(state.currentValue);
  const unit = getUnitDisplay();

  if (mainDisplay) {
    const statusLabel = state.isPaused
      ? (state.overlay.pausedText || "PAUSED")
      : (!state.isRunning ? (state.overlay.stoppedText || "STOPPED") : "");

    if (statusLabel) {
      mainDisplay.innerHTML = `
        <div class="display-value-main">${formatted}</div>
        <div class="display-status">${statusLabel}</div>
      `;
    } else {
      mainDisplay.innerHTML = `
        <div class="display-value-main">${formatted}</div>
      `;
    }

    if (cornerValueDisplay) {
      cornerValueDisplay.style.display = "none";
    }
  }

  if (displayUnit) {
    const prefix = state.overlay.unitPrefix || "";
    const suffix = state.overlay.unitSuffix || "";

    if (state.isPaused) {
      displayUnit.style.display = state.overlay.showUnitWhenPaused !== false ? "block" : "none";
    } else if (!state.isRunning) {
      displayUnit.style.display = state.overlay.showUnitWhenStopped !== false ? "block" : "none";
    } else {
      displayUnit.style.display = "block";
    }

    const parts = [];
    if (prefix.trim()) parts.push(prefix.trim());
    parts.push(unit);
    if (suffix.trim()) parts.push(suffix.trim());
    displayUnit.textContent = parts.join(" ");
  }

  ipcRenderer.send("overlay-update", { 
    value: formatted, 
    unit,
    unitPrefix: state.overlay.unitPrefix || "",
    unitSuffix: state.overlay.unitSuffix || "",
    status: state.isPaused ? "paused" : (!state.isRunning ? "stopped" : "running"),
    pausedText: state.overlay.pausedText || "PAUSED",
    stoppedText: state.overlay.stoppedText || "STOPPED",
    pausedTextSize: state.overlay.pausedTextSize || 48,
    pausedTextColor: state.overlay.pausedTextColor || "#ffaa00",
    showValueWhenPaused: state.overlay.showValueWhenPaused !== false,
    showValueWhenStopped: state.overlay.showValueWhenStopped !== false,
    showUnitWhenPaused: state.overlay.showUnitWhenPaused !== false,
    showUnitWhenStopped: state.overlay.showUnitWhenStopped !== false,
    enableValueAnimation: state.overlay.enableValueAnimation !== false,
    animationSpeed: state.overlay.animationSpeed || 1000,
    gifterPosition: state.overlay.gifterPosition || "bottom-left",
    overlayPageBg: state.overlay.overlayPageBg || "#000000",
    textShadow: state.overlay.textShadow || { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" },
    statusTextShadow: state.overlay.statusTextShadow || { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" },
    unitSize: state.overlay.unitSize || 24,
    unitColor: state.overlay.unitColor || "#ffffff",
    gifterCard: state.overlay.gifterCard || {
      animation: "slideUp",
      size: 100,
      bgColor: "#000000",
      borderColor: "#ffffff",
      nameSize: 12,
      nameColor: "#ffffff",
      amountSize: 13,
      amountColor: "#22c55e",
      unitSize: 8
    },
    unitPosition: state.overlay.unitPosition || "bottom",
    unitAlignment: state.overlay.unitAlignment || "center",
    textColor: state.overlay.textColor || "#ffffff",
    fontSize: state.overlay.fontSize || 72,
    background: state.overlay.background || "transparent",
    bgColor: state.overlay.bgColor || "#000000"
  });
}

module.exports.overlayUpdateTimeout = null;

function updateStats() {
  if (!totalEventsEl) initDisplayElements();

  if (totalEventsEl) totalEventsEl.textContent = state.totalEvents;
  if (valueAddedEl) {
    if (state.metricType === "time") {
      const formatted = formatValue(state.valueAdded);
      valueAddedEl.textContent = formatted.startsWith("-") ? formatted : `+${formatted}`;
    } else {
      const { getUnitDisplay } = require("./utils");
      const val = Math.round(state.valueAdded * 100) / 100;
      const unit = getUnitDisplay();
      valueAddedEl.textContent = val >= 0 ? `+${val.toFixed(2)} ${unit}` : `${val.toFixed(2)} ${unit}`;
    }
  }

  if (reducerStatus && reducerIcon) {
    if (state.reducer.enabled) {
      reducerStatus.textContent = "ON";
      reducerStatus.style.color = "var(--success-color)";
      reducerIcon.style.background = "var(--success-color)";
      const svg = reducerIcon.querySelector("svg");
      if (svg) svg.style.color = "#fff";
    } else {
      reducerStatus.textContent = "OFF";
      reducerStatus.style.color = "var(--text-secondary)";
      reducerIcon.style.background = "var(--bg-tertiary)";
      const svg = reducerIcon.querySelector("svg");
      if (svg) svg.style.color = "var(--text-muted)";
    }
  }
}

function updateConnectionStatus() {
  if (!connectionStatus) initDisplayElements();

  const isActive = state.isRunning && !state.isPaused;
  const isPaused = state.isRunning && state.isPaused;

  if (connectionStatus) {
    if (isActive) {
      connectionStatus.classList.add("connected", "pulse");
      connectionStatus.classList.remove("disconnected", "pulse-red");
      if (statusText) statusText.textContent = "Active";
    } else if (isPaused) {
      connectionStatus.classList.remove("connected", "pulse", "disconnected", "pulse-red");
      if (statusText) statusText.textContent = "Inactive";
    } else {
      connectionStatus.classList.add("disconnected", "pulse-red");
      connectionStatus.classList.remove("connected", "pulse");
      if (statusText) statusText.textContent = "Inactive";
    }
  }
}

function updateUnitLabels() {
  const unitLabels = document.querySelectorAll(".unit-label");
  const inlineUnitLabels = document.querySelectorAll(".unit-label-inline");
  let unitText = "units";
  if (state.metricType === "time") {
    unitText = "seconds";
  } else if (state.metricType === "distance") {
    unitText = "meters";
  } else {
    unitText = state.customUnit || "units";
  }
  
  unitLabels.forEach(el => {
    el.textContent = unitText;
  });
  
  inlineUnitLabels.forEach(el => {
    const inputWrapper = el.parentElement;
    if (!inputWrapper) {
      el.textContent = unitText;
      return;
    }
    
    let input = inputWrapper.querySelector("input");
    if (!input && inputWrapper.querySelector(".number-input-wrapper")) {
      input = inputWrapper.querySelector(".number-input-wrapper input");
    }

    const currencySplit = inputWrapper.closest(".currency-input-split");
    if (!input && currencySplit) {
      input = currencySplit.querySelector(".number-input-wrapper input") || currencySplit.querySelector("input");
    }
    
    if (!input && inputWrapper.classList.contains("currency-input-split")) {
      input = inputWrapper.querySelector(".number-input-wrapper input") || inputWrapper.querySelector("input");
    }
    
    if (!input || !input.id) {
      if (inputWrapper.classList.contains("currency-input-split") || inputWrapper.closest(".currency-input-split")) {
        el.textContent = unitText;
        return;
      }
      el.textContent = unitText;
      return;
    }
    
    const inputId = input.id;
    const isSubOrGift = inputId.includes("SubValue") || inputId.includes("GiftValue");
    const isCurrencyMultiplier = inputId.includes("streamlabsMultiplier_") || inputId.includes("donationalertsMultiplier_");
    const isCurrencyTier = inputId.includes("TierValue_");
    
    if (isSubOrGift) {
      el.textContent = "seconds";
    } else if (isCurrencyMultiplier || isCurrencyTier) {
      el.textContent = unitText;
    } else {
      el.textContent = unitText;
    }
  });
}

module.exports = { updateDisplay, updateStats, updateConnectionStatus, updateUnitLabels };

