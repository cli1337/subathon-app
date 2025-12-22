const { state } = require("./state");

function getUnitDisplay() {
  if (state.metricType === "time") return "TIME";
  if (state.metricType === "distance") return "KM";
  return state.customUnit.toUpperCase() || "UNITS";
}

function formatValue(value) {
  if (state.metricType === "time") {
    const abs = Math.abs(Math.round(value));
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    const sign = value < 0 ? "-" : "";
    return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return value.toFixed(2);
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

module.exports = { getUnitDisplay, formatValue, formatTime };