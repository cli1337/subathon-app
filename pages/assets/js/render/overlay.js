const { ipcRenderer } = require("electron");
const path = require("path");
const { state } = require("./state");
const { updateDisplay } = require("./display");
const { saveAllConfig } = require("./config");
const { formatValue } = require("./utils");
const { getUnitDisplay } = require("./utils");

const scriptDir = __dirname;

const overlayPortInput = document.getElementById("overlayPort");
const fontSize = document.getElementById("fontSize");
const fontSizeValue = document.getElementById("fontSizeValue");
const textColor = document.getElementById("textColor");
const overlayBackground = document.getElementById("overlayBackground");
const bgColor = document.getElementById("bgColor");
const unitPosition = document.getElementById("unitPosition");
const unitAlignment = document.getElementById("unitAlignment");
const unitPrefixInput = document.getElementById("unitPrefix");
const unitSuffixInput = document.getElementById("unitSuffix");
const pausedText = document.getElementById("pausedText");
const stoppedText = document.getElementById("stoppedText");
const pausedTextSize = document.getElementById("pausedTextSize");
const pausedTextSizeValue = document.getElementById("pausedTextSizeValue");
const pausedTextColor = document.getElementById("pausedTextColor");
const showValueWhenPaused = document.getElementById("showValueWhenPaused");
const showValueWhenStopped = document.getElementById("showValueWhenStopped");
const showUnitWhenPaused = document.getElementById("showUnitWhenPaused");
const showUnitWhenStopped = document.getElementById("showUnitWhenStopped");
const enableValueAnimation = document.getElementById("enableValueAnimation");
const animationSpeed = document.getElementById("animationSpeed");
const animationSpeedValue = document.getElementById("animationSpeedValue");
const animationSpeedGroup = document.getElementById("animationSpeedGroup");
const gifterVerticalPosition = document.getElementById("gifterVerticalPosition");
const gifterHorizontalPosition = document.getElementById("gifterHorizontalPosition");
const overlayPreview = document.getElementById("overlayPreview");
const overlayPageBg = document.getElementById("overlayPageBg");
const textShadowX = document.getElementById("textShadowX");
const textShadowY = document.getElementById("textShadowY");
const textShadowBlur = document.getElementById("textShadowBlur");
const textShadowColor = document.getElementById("textShadowColor");
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
const enableTextShadow = document.getElementById("enableTextShadow");
const enableStatusTextShadow = document.getElementById("enableStatusTextShadow");
const statusTextShadowX = document.getElementById("statusTextShadowX");
const statusTextShadowY = document.getElementById("statusTextShadowY");
const statusTextShadowBlur = document.getElementById("statusTextShadowBlur");
const statusTextShadowColor = document.getElementById("statusTextShadowColor");
const unitSize = document.getElementById("unitSize");
const unitSizeValue = document.getElementById("unitSizeValue");
const unitColor = document.getElementById("unitColor");
const textShadowControls = document.getElementById("textShadowControls");
const statusTextShadowControls = document.getElementById("statusTextShadowControls");

function applyOverlayChanges() {
  if (fontSize) state.overlay.fontSize = parseInt(fontSize.value, 10) || 72;
  if (textColor) state.overlay.textColor = textColor.value;
  if (overlayBackground) state.overlay.background = overlayBackground.value;
  if (bgColor) state.overlay.bgColor = bgColor.value;

  if (unitPosition) state.overlay.unitPosition = unitPosition.value || "bottom";
  if (unitAlignment) state.overlay.unitAlignment = unitAlignment.value || "center";
  if (unitPrefixInput) state.overlay.unitPrefix = unitPrefixInput.value || "";
  if (unitSuffixInput) state.overlay.unitSuffix = unitSuffixInput.value || "";
  if (pausedText) state.overlay.pausedText = pausedText.value || "PAUSED";
  if (stoppedText) state.overlay.stoppedText = stoppedText.value || "STOPPED";
  if (pausedTextSize) {
    state.overlay.pausedTextSize = parseInt(pausedTextSize.value, 10) || 48;
    if (pausedTextSizeValue) pausedTextSizeValue.textContent = `${state.overlay.pausedTextSize}px`;
  }
  if (pausedTextColor) state.overlay.pausedTextColor = pausedTextColor.value || "#ffaa00";
  if (showValueWhenPaused) state.overlay.showValueWhenPaused = showValueWhenPaused.checked;
  if (showValueWhenStopped) state.overlay.showValueWhenStopped = showValueWhenStopped.checked;
  if (showUnitWhenPaused) state.overlay.showUnitWhenPaused = showUnitWhenPaused.checked;
  if (showUnitWhenStopped) state.overlay.showUnitWhenStopped = showUnitWhenStopped.checked;
  if (enableValueAnimation) state.overlay.enableValueAnimation = enableValueAnimation.checked;

  if (animationSpeed) {
    state.overlay.animationSpeed = parseInt(animationSpeed.value, 10) || 1000;
    if (animationSpeedValue) animationSpeedValue.textContent = `${state.overlay.animationSpeed}ms`;
  }

  if (overlayPageBg) state.overlay.overlayPageBg = overlayPageBg.value;

  if (!state.overlay.textShadow) state.overlay.textShadow = { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" };
  if (enableTextShadow) {
    state.overlay.textShadow.enabled = enableTextShadow.checked;
  }

  if (textShadowX) state.overlay.textShadow.x = parseInt(textShadowX.value, 10) || 0;
  if (textShadowY) state.overlay.textShadow.y = parseInt(textShadowY.value, 10) || 4;
  if (textShadowBlur) state.overlay.textShadow.blur = parseInt(textShadowBlur.value, 10) || 12;
  if (textShadowColor) state.overlay.textShadow.color = textShadowColor.value || "#000000";

  if (!state.overlay.statusTextShadow) state.overlay.statusTextShadow = { enabled: true, x: 0, y: 4, blur: 12, color: "#000000" };
  if (enableStatusTextShadow) {
    state.overlay.statusTextShadow.enabled = enableStatusTextShadow.checked;
  }

  if (statusTextShadowX) state.overlay.statusTextShadow.x = parseInt(statusTextShadowX.value, 10) || 0;
  if (statusTextShadowY) state.overlay.statusTextShadow.y = parseInt(statusTextShadowY.value, 10) || 4;
  if (statusTextShadowBlur) state.overlay.statusTextShadow.blur = parseInt(statusTextShadowBlur.value, 10) || 12;
  if (statusTextShadowColor) state.overlay.statusTextShadow.color = statusTextShadowColor.value || "#000000";

  if (unitSize) {
    state.overlay.unitSize = parseInt(unitSize.value, 10) || 24;
    if (unitSizeValue) unitSizeValue.textContent = `${state.overlay.unitSize}px`;
  }
  if (unitColor) state.overlay.unitColor = unitColor.value || "#ffffff";

  if (overlayPreview && overlayPreview.tagName === "IFRAME") {
    const port = state.overlay?.port || 55814;
    if (port && !isNaN(port) && port > 0 && port <= 65535) {
      overlayPreview.src = `http://localhost:${port}/overlay`;
    }
  }

  if (fontSizeValue) fontSizeValue.textContent = `${state.overlay.fontSize}px`;

  updateDisplay(); 

  saveAllConfig();
}

if (fontSize) fontSize.addEventListener("input", applyOverlayChanges);
if (textColor) textColor.addEventListener("input", applyOverlayChanges);
if (overlayBackground) overlayBackground.addEventListener("change", applyOverlayChanges);
if (bgColor) bgColor.addEventListener("input", applyOverlayChanges);
if (unitPosition) unitPosition.addEventListener("change", applyOverlayChanges);
if (unitAlignment) unitAlignment.addEventListener("change", applyOverlayChanges);
if (unitPrefixInput) unitPrefixInput.addEventListener("input", applyOverlayChanges);
if (unitSuffixInput) unitSuffixInput.addEventListener("input", applyOverlayChanges);
if (pausedText) pausedText.addEventListener("input", applyOverlayChanges);
if (stoppedText) stoppedText.addEventListener("input", applyOverlayChanges);
if (pausedTextSize) pausedTextSize.addEventListener("input", applyOverlayChanges);
if (pausedTextColor) pausedTextColor.addEventListener("input", applyOverlayChanges);
if (showValueWhenPaused) showValueWhenPaused.addEventListener("change", applyOverlayChanges);
if (showValueWhenStopped) showValueWhenStopped.addEventListener("change", applyOverlayChanges);
if (showUnitWhenPaused) showUnitWhenPaused.addEventListener("change", applyOverlayChanges);
if (showUnitWhenStopped) showUnitWhenStopped.addEventListener("change", applyOverlayChanges);
if (enableValueAnimation) {
  enableValueAnimation.addEventListener("change", () => {
    applyOverlayChanges();

    if (animationSpeedGroup) {
      animationSpeedGroup.style.display = enableValueAnimation.checked ? "block" : "none";
    }
  });
}
if (animationSpeed) animationSpeed.addEventListener("input", applyOverlayChanges);

if (overlayPageBg) overlayPageBg.addEventListener("input", applyOverlayChanges);
if (textShadowX) textShadowX.addEventListener("input", applyOverlayChanges);
if (textShadowY) textShadowY.addEventListener("input", applyOverlayChanges);
if (textShadowBlur) textShadowBlur.addEventListener("input", applyOverlayChanges);
if (textShadowColor) textShadowColor.addEventListener("input", applyOverlayChanges);

if (enableTextShadow) enableTextShadow.addEventListener("change", () => {
  applyOverlayChanges();
  if (textShadowControls) textShadowControls.style.display = enableTextShadow.checked ? "grid" : "none";
});
if (enableStatusTextShadow) enableStatusTextShadow.addEventListener("change", () => {
  applyOverlayChanges();
  if (statusTextShadowControls) statusTextShadowControls.style.display = enableStatusTextShadow.checked ? "grid" : "none";
});
if (statusTextShadowX) statusTextShadowX.addEventListener("input", applyOverlayChanges);
if (statusTextShadowY) statusTextShadowY.addEventListener("input", applyOverlayChanges);
if (statusTextShadowBlur) statusTextShadowBlur.addEventListener("input", applyOverlayChanges);
if (statusTextShadowColor) statusTextShadowColor.addEventListener("input", applyOverlayChanges);
if (unitSize) unitSize.addEventListener("input", applyOverlayChanges);
if (unitColor) unitColor.addEventListener("input", applyOverlayChanges);

const applyPortBtn = document.getElementById("applyPortBtn");

if (overlayPortInput) {

  overlayPortInput.addEventListener("input", () => {

    const newPort = parseInt(overlayPortInput.value, 10) || 55814;
    if (overlayPortInput.value !== String(newPort)) {
      overlayPortInput.value = newPort;
    }
  });
}

if (applyPortBtn) {
  applyPortBtn.addEventListener("click", () => {
    const { ipcRenderer } = require("electron");
    const newPort = parseInt(overlayPortInput.value, 10) || 55814;

    if (newPort < 1 || newPort > 65535) {
      const { showToast } = require(path.join(scriptDir, "render", "toast"));
      showToast("Port must be between 1 and 65535", "error");
      return;
    }

    state.overlay.port = newPort;

    ipcRenderer.send("restart-overlay-server", newPort);

    const { showToast } = require(path.join(scriptDir, "render", "toast"));
    showToast(`Restarting overlay server on port ${newPort}...`, "info");

    saveAllConfig();
  });
}

if (typeof require !== 'undefined') {
  const { ipcRenderer } = require("electron");
  ipcRenderer.on("overlay-server-restarted", (event, data) => {

    if (overlayPreview && overlayPreview.tagName === "IFRAME") {
      const port = data?.port || state.overlay?.port || 55814;
      if (port && !isNaN(port) && port > 0 && port <= 65535) {
        overlayPreview.src = `http://localhost:${port}/overlay`;
      }
    }
    const { showToast } = require(path.join(scriptDir, "render", "toast"));
    const port = data?.port || state.overlay?.port || 55814;
    showToast(`Overlay server restarted on port ${port}`, "success");
  });
}

module.exports.updateTimeout = null;

module.exports = { applyOverlayChanges };