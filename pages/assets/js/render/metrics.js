const { state } = require("./state");
const { updateUnitLabels, updateDisplay } = require("./display");
const { saveAllConfig } = require("./config");

const metricType = document.getElementById("metricType");
const customUnitSection = document.getElementById("customUnitSection");
const customUnitInput = document.getElementById("customUnit");

function applyMetricsNow() {
  state.metricType = metricType.value;
  state.customUnit = state.metricType === "custom" ? (customUnitInput.value.trim() || "Units") : "";
  customUnitSection.style.display = state.metricType === "custom" ? "block" : "none";

  state.config.subValue = parseInt(document.getElementById("subValue").value) || 0;
  state.config.giftValue = parseInt(document.getElementById("giftValue").value) || 0;
  state.config.bitsValue = parseInt(document.getElementById("bitsValue").value) || 0;
  state.config.donationValue = parseInt(document.getElementById("donationValue").value) || 0;
  state.config.followValue = parseInt(document.getElementById("followValue").value) || 0;

  updateUnitLabels();
  updateDisplay();
  saveAllConfig();
}

if (metricType) metricType.addEventListener("change", applyMetricsNow);
if (customUnitInput) customUnitInput.addEventListener("input", applyMetricsNow);
["subValue", "giftValue", "bitsValue", "donationValue", "followValue"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", applyMetricsNow);
});

module.exports = { applyMetricsNow };