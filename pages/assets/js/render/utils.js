const { state } = require("./state");

function getUnitDisplay() {
  if (state.metricType === "time") return "TIME";
  if (state.metricType === "distance") {
    return state.distanceDisplayMode === "km" ? "KM" : "M";
  }
  return state.customUnit.toUpperCase() || "UNITS";
}

function formatValue(value) {
  if (state.metricType === "time") {
    const abs = Math.abs(Math.round(value));
    const days = Math.floor(abs / 86400);
    const hours = Math.floor((abs % 86400) / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    const seconds = abs % 60;
    const sign = value < 0 ? "-" : "";
    
    if (days > 0) {
      return `${sign}${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  if (state.metricType === "distance") {
    const displayValue = state.distanceDisplayMode === "km" ? value / 1000 : value;
    return displayValue.toFixed(2);
  }
  return value.toFixed(2);
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function calculateDonationValue(amount, currencyConfig) {
  if (!currencyConfig) return 0;
  
  const mode = currencyConfig.mode || "multiplier";
  
  if (mode === "multiplier") {
    const multiplier = currencyConfig.multiplier || 0;
    return amount * multiplier;
  } else if (mode === "tiered" || mode === "fixed") {
    const tiers = currencyConfig.tiers || [];
    if (tiers.length === 0) return 0;
    
    const sortedTiers = [...tiers].sort((a, b) => {
      if (mode === "tiered") {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });
    
    if (mode === "tiered") {
      for (const tier of sortedTiers) {
        if (amount >= tier.amount) {
          return tier.value;
        }
      }
      return sortedTiers[sortedTiers.length - 1]?.value || 0;
    } else {
      const roundedAmount = Math.floor(amount);
      for (const tier of sortedTiers) {
        if (roundedAmount === tier.amount) {
          return tier.value;
        }
      }
      const matchingTier = sortedTiers.find(tier => Math.floor(tier.amount) === roundedAmount);
      if (matchingTier) {
        return matchingTier.value;
      }
      for (let i = sortedTiers.length - 1; i >= 0; i--) {
        if (roundedAmount >= sortedTiers[i].amount) {
          return sortedTiers[i].value;
        }
      }
      return 0;
    }
  }
  
  return 0;
}

module.exports = { getUnitDisplay, formatValue, formatTime, calculateDonationValue };