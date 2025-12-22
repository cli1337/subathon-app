
const { addEvent } = require("./events");
const { showToast } = require("./toast");
const { saveAllConfig } = require("./config");

const addManualEventBtn = document.getElementById("addManualEventBtn");
const manualEntrySection = document.getElementById("manualEntrySection");
const submitManualEventBtn = document.getElementById("submitManualEventBtn");
const manualEventDesc = document.getElementById("manualEventDesc");
const manualEventPlatform = document.getElementById("manualEventPlatform");
const manualEventValue = document.getElementById("manualEventValue");

if (addManualEventBtn) {
  addManualEventBtn.addEventListener("click", () => {
    manualEntrySection.style.display = manualEntrySection.style.display === "block" ? "none" : "block";
    if (manualEntrySection.style.display === "block") manualEventDesc.focus();
  });
}

if (submitManualEventBtn) {
  submitManualEventBtn.addEventListener("click", () => {
    const desc = manualEventDesc.value.trim();
    const platform = manualEventPlatform.value;
    const rawValue = parseFloat(manualEventValue.value) || 0;
    if (rawValue <= 0) return showToast("Enter a positive value", "error");
    addEvent(desc || `${platform} Manual`, platform, rawValue);
    manualEventDesc.value = "";
    manualEventValue.value = "120";
    manualEntrySection.style.display = "none";
    showToast("Manual event added!", "success");
    saveAllConfig();
  });
}

if (manualEventValue) {
  manualEventValue.addEventListener("keydown", e => e.key === "Enter" && submitManualEventBtn.click());
}
