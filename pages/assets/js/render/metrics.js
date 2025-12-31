const { state } = require("./state");
const { updateUnitLabels, updateDisplay } = require("./display");
const { saveAllConfig } = require("./config");
const { formatValue } = require("./utils");

const STREAMLABS_CURRENCIES = [
  { code: "AUD", name: "Australian Dollar" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DKK", name: "Danish Krone" },
  { code: "EUR", name: "Euro" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "ILS", name: "Israeli New Sheqel" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "GBP", name: "Pound Sterling" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "THB", name: "Thai Baht" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "USD", name: "US Dollar" }
];

const DONATIONALERTS_CURRENCIES = [
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "US Dollar" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "KZT", name: "Tenge" },
  { code: "UAH", name: "Hryvnia" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "TRY", name: "Turkish Lira" }
];

const metricType = document.getElementById("metricType");
const distanceDisplaySection = document.getElementById("distanceDisplaySection");
const distanceDisplayMode = document.getElementById("distanceDisplayMode");
const customUnitSection = document.getElementById("customUnitSection");
const customUnitInput = document.getElementById("customUnit");
const metricTypeHint = document.getElementById("metricTypeHint");
const timeInputContainer = document.getElementById("timeInputContainer");
const startingValue = document.getElementById("startingValue");
const startingValueHint = document.getElementById("startingValueHint");
const startingValueContainer = document.getElementById("startingValueContainer");
const startingValueError = document.getElementById("startingValueError");
const timeDays = document.getElementById("timeDays");
const timeHours = document.getElementById("timeHours");
const timeMinutes = document.getElementById("timeMinutes");
const timeSeconds = document.getElementById("timeSeconds");

function parseTimeInput(input) {
  if (!input || !input.trim()) return 0;
  
  if (/^\d+:\d{2}:\d{2}:\d{2}$/.test(input)) {
    const [d, h, m, s] = input.split(":").map(Number);
    return d * 86400 + h * 3600 + m * 60 + s;
  }
  
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(input)) {
    const [h, m, s] = input.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  }
  
  if (/^\d+$/.test(input)) {
    return Number(input);
  }
  
  return 0;
}

function updateTimeInputsFromValue(value) {
  if (!timeDays || !timeHours || !timeMinutes || !timeSeconds) return;
  
  const abs = Math.abs(Math.round(value));
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;
  
  timeDays.value = days;
  timeHours.value = hours;
  timeMinutes.value = minutes;
  timeSeconds.value = seconds;
}

function updateTimeValueFromInputs() {
  if (!timeDays || !timeHours || !timeMinutes || !timeSeconds) return 0;
  
  const days = parseInt(timeDays.value) || 0;
  const hours = parseInt(timeHours.value) || 0;
  const minutes = parseInt(timeMinutes.value) || 0;
  const seconds = parseInt(timeSeconds.value) || 0;
  
  const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  
  if (startingValue) {
    startingValue.value = formatValue(totalSeconds);
  }
  
  return totalSeconds;
}

function updateMetricTypeUI() {
  const type = metricType.value;
  
  if (distanceDisplaySection) {
    distanceDisplaySection.style.display = type === "distance" ? "block" : "none";
  }
  
  if (customUnitSection) {
    customUnitSection.style.display = type === "custom" ? "block" : "none";
  }
  
  if (timeInputContainer) {
    timeInputContainer.style.display = type === "time" ? "block" : "none";
  }
  
  const customUnitValue = customUnitInput ? customUnitInput.value.trim() : "";
  const hasCustomUnit = customUnitValue && customUnitValue !== "Units" && customUnitValue !== "";
  
  if (startingValueContainer) {
    if (type === "time") {
      startingValueContainer.style.display = "none";
    } else if (type === "custom" && !hasCustomUnit) {
      startingValueContainer.style.display = "none";
    } else {
      startingValueContainer.style.display = "block";
    }
  }
  
  if (startingValue) {
    if (type === "time") {
      startingValue.placeholder = "DD:HH:MM:SS or HH:MM:SS or seconds";
      if (startingValueHint) {
        startingValueHint.style.display = "none";
      }
    } else if (type === "distance") {
      startingValue.placeholder = "0.0";
      if (startingValueHint) {
        startingValueHint.style.display = "block";
        startingValueHint.textContent = 'Enter value in meters (e.g., 1000 for 1km)';
      }
    } else {
      if (hasCustomUnit) {
        startingValue.placeholder = "0.0";
        if (startingValueHint) {
          startingValueHint.style.display = "block";
          startingValueHint.textContent = `Enter starting value in ${customUnitValue}`;
        }
      } else {
        if (startingValueHint) {
          startingValueHint.style.display = "block";
          startingValueHint.textContent = 'Please enter a custom unit name first';
        }
      }
    }
  }
  
  if (metricTypeHint) {
    if (type === "time") {
      metricTypeHint.style.display = "block";
      metricTypeHint.textContent = 'Track duration in days, hours, minutes, and seconds. Example: 1 day 2 hours = 01:02:00:00';
    } else if (type === "distance") {
      metricTypeHint.style.display = "block";
      metricTypeHint.textContent = 'Track distance in kilometers or meters. Example: 5.5 km, 1000 m';
    } else {
      metricTypeHint.style.display = "block";
      metricTypeHint.textContent = 'Define your own unit (e.g., Points, Stars, Coins)';
    }
  }
}

function applyMetricsNow() {
  state.metricType = metricType.value;
  const customUnitValue = customUnitInput ? customUnitInput.value.trim() : "";
  state.customUnit = state.metricType === "custom" ? (customUnitValue || "Units") : "";
  
  updateMetricTypeUI();
  
  if (startingValue) {
    const input = startingValue.value.trim();
    if (state.metricType === "time") {
      const timeValue = parseTimeInput(input);
      if (timeValue > 0 || input === "0") {
        state.startingValue = timeValue;
        updateTimeInputsFromValue(timeValue);
      }
    } else if (state.metricType === "distance") {
      const numValue = parseFloat(input) || 0;
      state.startingValue = Math.max(0, numValue);
    } else {
      const numValue = parseFloat(input) || 0;
      state.startingValue = Math.max(0, numValue);
    }
  }

  if (!state.config.eventValues) {
    state.config.eventValues = {
      kick: { subValue: 120, giftValue: 60, subEnabled: true, giftEnabled: true, platformEnabled: true },
      twitch: { subValue: 120, giftValue: 60, bitsValue: 30, subEnabled: true, giftEnabled: true, bitsEnabled: true, platformEnabled: true },
      streamlabs: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true },
      donationalerts: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true }
    };
  }

  if (!state.config.eventValues.kick) {
    state.config.eventValues.kick = { subValue: 120, giftValue: 60, subEnabled: true, giftEnabled: true, platformEnabled: true };
  }
  const kickSubValueEl = document.getElementById("kickSubValue");
  const kickGiftValueEl = document.getElementById("kickGiftValue");
  const kickSubEnabledEl = document.getElementById("kickSubEnabled");
  const kickGiftEnabledEl = document.getElementById("kickGiftEnabled");
  
  state.config.eventValues.kick.subValue = kickSubValueEl ? (parseFloat(kickSubValueEl.value) || 0) : 0;
  state.config.eventValues.kick.giftValue = kickGiftValueEl ? (parseFloat(kickGiftValueEl.value) || 0) : 0;
  state.config.eventValues.kick.subEnabled = kickSubEnabledEl ? kickSubEnabledEl.checked : true;
  state.config.eventValues.kick.giftEnabled = kickGiftEnabledEl ? kickGiftEnabledEl.checked : true;

  if (!state.config.eventValues.twitch) {
    state.config.eventValues.twitch = { subValue: 120, giftValue: 60, bitsValue: 30, subEnabled: true, giftEnabled: true, bitsEnabled: true, platformEnabled: true };
  }
  const twitchSubValueEl = document.getElementById("twitchSubValue");
  const twitchGiftValueEl = document.getElementById("twitchGiftValue");
  const twitchBitsValueEl = document.getElementById("twitchBitsValue");
  const twitchSubEnabledEl = document.getElementById("twitchSubEnabled");
  const twitchGiftEnabledEl = document.getElementById("twitchGiftEnabled");
  const twitchBitsEnabledEl = document.getElementById("twitchBitsEnabled");
  
  state.config.eventValues.twitch.subValue = twitchSubValueEl ? (parseFloat(twitchSubValueEl.value) || 0) : 0;
  state.config.eventValues.twitch.giftValue = twitchGiftValueEl ? (parseFloat(twitchGiftValueEl.value) || 0) : 0;
  state.config.eventValues.twitch.bitsValue = twitchBitsValueEl ? (parseFloat(twitchBitsValueEl.value) || 0) : 0;
  state.config.eventValues.twitch.subEnabled = twitchSubEnabledEl ? twitchSubEnabledEl.checked : true;
  state.config.eventValues.twitch.giftEnabled = twitchGiftEnabledEl ? twitchGiftEnabledEl.checked : true;
  state.config.eventValues.twitch.bitsEnabled = twitchBitsEnabledEl ? twitchBitsEnabledEl.checked : true;

  if (!state.config.eventValues.streamlabs) {
    state.config.eventValues.streamlabs = { donationCurrencies: {}, donationEnabled: true, platformEnabled: true };
  }
  if (!state.config.eventValues.streamlabs.donationCurrencies) {
    state.config.eventValues.streamlabs.donationCurrencies = {};
  }
  const currencySelector = document.getElementById("streamlabsCurrencySelector");
  if (currencySelector && currencySelector.value) {
    const currencyCode = currencySelector.value;
    const modeSelect = document.getElementById(`streamlabsMode_${currencyCode}`);
    if (modeSelect) {
      const mode = modeSelect.value;
      const currencyConfig = state.config.eventValues.streamlabs.donationCurrencies[currencyCode] || {};
      currencyConfig.mode = mode;
      
      if (mode === "multiplier") {
        const multiplierInput = document.getElementById(`streamlabsMultiplier_${currencyCode}`);
        if (multiplierInput) {
          currencyConfig.multiplier = parseFloat(multiplierInput.value) || 0;
        }
        delete currencyConfig.tiers;
      } else {
        const tiers = [];
        let tierIndex = 0;
        while (true) {
          const amountInput = document.getElementById(`streamlabsTierAmount_${currencyCode}_${tierIndex}`);
          const valueInput = document.getElementById(`streamlabsTierValue_${currencyCode}_${tierIndex}`);
          if (!amountInput || !valueInput) break;
          
          const amount = parseFloat(amountInput.value) || 0;
          const value = parseFloat(valueInput.value) || 0;
          if (amount > 0 || value > 0) {
            tiers.push({ amount, value });
          }
          tierIndex++;
        }
        currencyConfig.tiers = tiers.length > 0 ? tiers : [{ amount: 1, value: 0 }];
        delete currencyConfig.multiplier;
      }
      
      state.config.eventValues.streamlabs.donationCurrencies[currencyCode] = currencyConfig;
    }
  }
  const streamlabsDonationEnabledEl = document.getElementById("streamlabsDonationEnabled");
  state.config.eventValues.streamlabs.donationEnabled = streamlabsDonationEnabledEl ? streamlabsDonationEnabledEl.checked : true;

  if (!state.config.eventValues.donationalerts) {
    state.config.eventValues.donationalerts = { donationCurrencies: {}, donationEnabled: true, platformEnabled: true };
  }
  if (!state.config.eventValues.donationalerts.donationCurrencies) {
    state.config.eventValues.donationalerts.donationCurrencies = {};
  }
  const donationalertsCurrencySelector = document.getElementById("donationalertsCurrencySelector");
  if (donationalertsCurrencySelector && donationalertsCurrencySelector.value) {
    const currencyCode = donationalertsCurrencySelector.value;
    const modeSelect = document.getElementById(`donationalertsMode_${currencyCode}`);
    if (modeSelect) {
      const mode = modeSelect.value;
      const currencyConfig = state.config.eventValues.donationalerts.donationCurrencies[currencyCode] || {};
      currencyConfig.mode = mode;
      
      if (mode === "multiplier") {
        const multiplierInput = document.getElementById(`donationalertsMultiplier_${currencyCode}`);
        if (multiplierInput) {
          currencyConfig.multiplier = parseFloat(multiplierInput.value) || 0;
        }
        delete currencyConfig.tiers;
      } else {
        const tiers = [];
        let tierIndex = 0;
        while (true) {
          const amountInput = document.getElementById(`donationalertsTierAmount_${currencyCode}_${tierIndex}`);
          const valueInput = document.getElementById(`donationalertsTierValue_${currencyCode}_${tierIndex}`);
          if (!amountInput || !valueInput) break;
          
          const amount = parseFloat(amountInput.value) || 0;
          const value = parseFloat(valueInput.value) || 0;
          if (amount > 0 || value > 0) {
            tiers.push({ amount, value });
          }
          tierIndex++;
        }
        currencyConfig.tiers = tiers.length > 0 ? tiers : [{ amount: 1, value: 0 }];
        delete currencyConfig.multiplier;
      }
      
      state.config.eventValues.donationalerts.donationCurrencies[currencyCode] = currencyConfig;
    }
  }
  const donationalertsDonationEnabledEl = document.getElementById("donationalertsDonationEnabled");
  state.config.eventValues.donationalerts.donationEnabled = donationalertsDonationEnabledEl ? donationalertsDonationEnabledEl.checked : true;

  const kickPlatformEnabledEl = document.getElementById("kickPlatformEnabled");
  const twitchPlatformEnabledEl = document.getElementById("twitchPlatformEnabled");
  const streamlabsPlatformEnabledEl = document.getElementById("streamlabsPlatformEnabled");
  const donationalertsPlatformEnabledEl = document.getElementById("donationalertsPlatformEnabled");
  
  if (kickPlatformEnabledEl) state.config.eventValues.kick.platformEnabled = kickPlatformEnabledEl.checked;
  if (twitchPlatformEnabledEl) state.config.eventValues.twitch.platformEnabled = twitchPlatformEnabledEl.checked;
  if (streamlabsPlatformEnabledEl) state.config.eventValues.streamlabs.platformEnabled = streamlabsPlatformEnabledEl.checked;
  if (donationalertsPlatformEnabledEl) state.config.eventValues.donationalerts.platformEnabled = donationalertsPlatformEnabledEl.checked;

  updateUnitLabels();
  updateDisplay();
  saveAllConfig();
}

if (metricType) {
  metricType.addEventListener("change", () => {
    updateMetricTypeUI();
    generateStreamlabsCurrencyInputs();
    generateDonationalertsCurrencyInputs();
    setTimeout(() => {
      updateUnitLabels();
      applyMetricsNow();
    }, 50);
  });
}

if (distanceDisplayMode) {
  distanceDisplayMode.addEventListener("change", () => {
    state.distanceDisplayMode = distanceDisplayMode.value;
    const { updateDisplay } = require("./display");
    updateDisplay();
    saveAllConfig();
  });
}

if (customUnitInput) {
  customUnitInput.addEventListener("input", () => {
    updateMetricTypeUI();
    updateUnitLabels();
    applyMetricsNow();
  });
}
function validateStartingValue(value, metricType) {
  if (metricType === "time") {
    return { valid: true, error: "" };
  }
  
  if (!value || value.trim() === "") {
    return { valid: true, error: "" };
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return { valid: false, error: "Please enter a valid number" };
  }
  
  if (numValue < 0) {
    return { valid: false, error: "Value cannot be negative" };
  }
  
  if (!/^[0-9]+(\.[0-9]*)?$/.test(value.trim())) {
    return { valid: false, error: "Only numbers and one decimal point allowed" };
  }
  
  return { valid: true, error: "" };
}

function showStartingValueError(message) {
  if (startingValueError) {
    startingValueError.textContent = message;
    startingValueError.style.display = message ? "block" : "none";
  }
  if (startingValue) {
    startingValue.classList.toggle("input-invalid", !!message);
  }
}

if (startingValue) {
  startingValue.addEventListener("keydown", (e) => {
    if (state.metricType === "time") {
      return;
    }
    const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (allowedKeys.includes(e.key)) {
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    if (e.key >= "0" && e.key <= "9") {
      return;
    }
    if (e.key === "." && !e.target.value.includes(".")) {
      return;
    }
    e.preventDefault();
  });
  
  startingValue.addEventListener("input", (e) => {
    if (state.metricType === "time") {
      showStartingValueError("");
      return;
    }
    
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, "");
    
    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) {
      const firstDot = value.indexOf(".");
      value = value.substring(0, firstDot + 1) + value.substring(firstDot + 1).replace(/\./g, "");
    }
    
    if (value && parseFloat(value) < 0) {
      value = "0";
    }
    
    if (e.target.value !== value) {
      e.target.value = value;
    }
    
    const validation = validateStartingValue(value, state.metricType);
    showStartingValueError(validation.error);
    
    if (validation.valid) {
      applyMetricsNow();
    }
  });
  
  startingValue.addEventListener("blur", (e) => {
    if (state.metricType === "time") {
      showStartingValueError("");
      return;
    }
    const validation = validateStartingValue(e.target.value, state.metricType);
    showStartingValueError(validation.error);
  });
  
  startingValue.addEventListener("paste", (e) => {
    if (state.metricType === "time") {
      return;
    }
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData("text");
    let value = paste.replace(/[^0-9.]/g, "");
    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) {
      const firstDot = value.indexOf(".");
      value = value.substring(0, firstDot + 1) + value.substring(firstDot + 1).replace(/\./g, "");
    }
    if (value && parseFloat(value) < 0) {
      value = "0";
    }
    e.target.value = value;
    const validation = validateStartingValue(value, state.metricType);
    showStartingValueError(validation.error);
    if (validation.valid) {
      applyMetricsNow();
    }
  });
}

[timeDays, timeHours, timeMinutes, timeSeconds].forEach(input => {
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-" || e.key === ".") {
        e.preventDefault();
      }
    });
    
    input.addEventListener("input", (e) => {
      let value = e.target.value;
      value = value.replace(/[eE\+\-\.]/g, "");
      if (e.target.value !== value) {
        e.target.value = value;
      }
      
      const timeValue = updateTimeValueFromInputs();
      if (startingValue) {
        startingValue.value = formatValue(timeValue);
      }
      applyMetricsNow();
    });
    
    input.addEventListener("blur", () => {
      if (input === timeHours && (input.value < 0 || input.value > 23)) {
        input.value = Math.max(0, Math.min(23, parseInt(input.value) || 0));
      }
      if ((input === timeMinutes || input === timeSeconds) && (input.value < 0 || input.value > 59)) {
        input.value = Math.max(0, Math.min(59, parseInt(input.value) || 0));
      }
      if (input === timeDays && input.value < 0) {
        input.value = Math.max(0, parseInt(input.value) || 0);
      }
      const value = updateTimeValueFromInputs();
      if (startingValue) {
        startingValue.value = formatValue(value);
      }
      applyMetricsNow();
    });
  }
});


if (timeInputContainer) {
  timeInputContainer.style.display = "none";
}

function generateStreamlabsCurrencyInputs() {
  const container = document.getElementById("streamlabsDonationCurrencies");
  if (!container) return;
  
  container.innerHTML = "";
  
  const selectorWrapper = document.createElement("div");
  selectorWrapper.style.cssText = "margin-bottom: 16px;";
  
  const selectorLabel = document.createElement("label");
  selectorLabel.textContent = "Select Currency:";
  selectorLabel.style.cssText = "display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: var(--text-primary);";
  
  const currencySelect = document.createElement("select");
  currencySelect.className = "input";
  currencySelect.id = "streamlabsCurrencySelector";
  currencySelect.style.cssText = "width: 100%; margin-bottom: 12px;";
  
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select Currency --";
  currencySelect.appendChild(defaultOption);
  
  STREAMLABS_CURRENCIES.forEach(currency => {
    const option = document.createElement("option");
    option.value = currency.code;
    option.textContent = `${currency.code} - ${currency.name}`;
    currencySelect.appendChild(option);
  });
  
  selectorWrapper.appendChild(selectorLabel);
  selectorWrapper.appendChild(currencySelect);
  container.appendChild(selectorWrapper);
  
  const configContainer = document.createElement("div");
  configContainer.id = "streamlabsCurrencyConfig";
  configContainer.style.cssText = "display: none;";
  container.appendChild(configContainer);
  
  function showCurrencyConfig(currencyCode) {
    configContainer.innerHTML = "";
    configContainer.style.display = currencyCode ? "block" : "none";
    
    if (!currencyCode) return;
    
    const currency = STREAMLABS_CURRENCIES.find(c => c.code === currencyCode);
    if (!currency) return;
    
    const currencyData = state.config.eventValues?.streamlabs?.donationCurrencies?.[currencyCode] || {};
    const mode = currencyData.mode || "multiplier";
    
    const currencyCard = document.createElement("div");
    currencyCard.className = "form-group event-value-group";
    
    const header = document.createElement("div");
    header.className = "event-value-header";
    
    const label = document.createElement("label");
    label.textContent = `${currency.code} - ${currency.name}`;
    
    const modeSelectWrapper = document.createElement("div");
    modeSelectWrapper.className = "custom-dropdown-wrapper";
    
    const modeSelect = document.createElement("select");
    modeSelect.className = "input";
    modeSelect.id = `streamlabsMode_${currencyCode}`;
    modeSelect.style.cssText = "width: 140px; font-size: 12px; padding: 6px 8px; display: none;";
    modeSelect.innerHTML = `
      <option value="multiplier">Multiplier (1$ = X)</option>
      <option value="tiered">Tiered (1$=X, 2$=Y)</option>
      <option value="fixed">Fixed Tiers</option>
    `;
    modeSelect.value = mode;
    
    const dropdownButton = document.createElement("button");
    dropdownButton.type = "button";
    dropdownButton.className = "custom-dropdown-button";
    dropdownButton.setAttribute("aria-haspopup", "listbox");
    dropdownButton.setAttribute("aria-expanded", "false");
    
    const selectedSpan = document.createElement("span");
    selectedSpan.className = "custom-dropdown-selected";
    selectedSpan.textContent = modeSelect.options[modeSelect.selectedIndex].text;
    
    const arrowSpan = document.createElement("span");
    arrowSpan.className = "custom-dropdown-arrow";
    arrowSpan.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L1 4h10z" fill="currentColor"></path></svg>`;
    
    const dropdownMenu = document.createElement("div");
    dropdownMenu.className = "custom-dropdown-menu";
    dropdownMenu.setAttribute("role", "listbox");
    
    Array.from(modeSelect.options).forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = `custom-dropdown-option ${option.value === mode ? "selected" : ""}`;
      optionDiv.setAttribute("role", "option");
      optionDiv.setAttribute("data-value", option.value);
      optionDiv.setAttribute("data-index", index);
      optionDiv.textContent = option.text;
      dropdownMenu.appendChild(optionDiv);
    });
    
    dropdownButton.appendChild(selectedSpan);
    dropdownButton.appendChild(arrowSpan);
    modeSelectWrapper.appendChild(dropdownButton);
    modeSelectWrapper.appendChild(dropdownMenu);
    modeSelectWrapper.appendChild(modeSelect);
    
    header.appendChild(label);
    header.appendChild(modeSelectWrapper);
    currencyCard.appendChild(header);
    
    const contentDiv = document.createElement("div");
    contentDiv.id = `streamlabsContent_${currencyCode}`;
    currencyCard.appendChild(contentDiv);
    
    configContainer.appendChild(currencyCard);
    
    dropdownMenu.querySelectorAll(".custom-dropdown-option").forEach(option => {
      option.addEventListener("click", () => {
        const value = option.getAttribute("data-value");
        modeSelect.value = value;
        
        selectedSpan.textContent = option.textContent;
        
        dropdownMenu.querySelectorAll(".custom-dropdown-option").forEach(opt => {
          opt.classList.remove("selected");
        });
        option.classList.add("selected");
        
        modeSelectWrapper.classList.remove("open");
        dropdownButton.setAttribute("aria-expanded", "false");
        
        updateCurrencyUI();
        applyMetricsNow();
      });
    });
    
    dropdownButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = modeSelectWrapper.classList.contains("open");
      
      if (isOpen) {
        modeSelectWrapper.classList.remove("open");
        dropdownButton.setAttribute("aria-expanded", "false");
        currencyCard.classList.remove("dropdown-open");
      } else {
        document.querySelectorAll(".custom-dropdown-wrapper.open").forEach(dd => {
          if (dd !== modeSelectWrapper) {
            dd.classList.remove("open");
            dd.querySelector(".custom-dropdown-button").setAttribute("aria-expanded", "false");
            const otherCard = dd.closest(".event-value-group");
            if (otherCard) otherCard.classList.remove("dropdown-open");
          }
        });
        modeSelectWrapper.classList.add("open");
        dropdownButton.setAttribute("aria-expanded", "true");
        currencyCard.classList.add("dropdown-open");
      }
    });
    
    const closeDropdownHandler = (e) => {
      if (!modeSelectWrapper.contains(e.target)) {
        modeSelectWrapper.classList.remove("open");
        dropdownButton.setAttribute("aria-expanded", "false");
        currencyCard.classList.remove("dropdown-open");
      }
    };
    document.addEventListener("click", closeDropdownHandler);
    
    function updateCurrencyUI() {
      const currentMode = modeSelect.value;
      contentDiv.innerHTML = "";
      
      if (currentMode === "multiplier") {
        const multiplierWrapper = document.createElement("div");
        multiplierWrapper.className = "input-wrapper-with-unit";
        
        const multiplierInput = document.createElement("input");
        multiplierInput.type = "number";
        multiplierInput.id = `streamlabsMultiplier_${currencyCode}`;
        multiplierInput.className = "input";
        multiplierInput.step = "0.01";
        multiplierInput.min = "0";
        multiplierInput.value = currencyData.multiplier || "0";
        multiplierInput.placeholder = "Units per 1 currency unit";
        
        const unitLabel = document.createElement("span");
        unitLabel.className = "unit-label-inline";
        let unitText = "units";
        if (state.metricType === "time") {
          unitText = "seconds";
        } else if (state.metricType === "distance") {
          unitText = "meters";
        } else {
          unitText = state.customUnit || "units";
        }
        unitLabel.textContent = unitText;
        
        multiplierWrapper.appendChild(multiplierInput);
        multiplierWrapper.appendChild(unitLabel);
        contentDiv.appendChild(multiplierWrapper);
        
        const hint = document.createElement("p");
        hint.style.cssText = "font-size: 12px; color: var(--text-secondary); margin-top: 6px;";
        hint.textContent = `Example: ${currencyData.multiplier || 1} = ${currencyCode} 1.00 = ${(currencyData.multiplier || 1).toFixed(2)} ${unitText}`;
        contentDiv.appendChild(hint);
        
        multiplierInput.addEventListener("input", () => {
          applyMetricsNow();
          hint.textContent = `Example: ${multiplierInput.value || 0} = ${currencyCode} 1.00 = ${(parseFloat(multiplierInput.value) || 0).toFixed(2)} ${unitText}`;
        });
      } else {
        const tiersContainer = document.createElement("div");
        tiersContainer.id = `streamlabsTiers_${currencyCode}`;
        tiersContainer.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
        
        const addTierBtn = document.createElement("button");
        addTierBtn.className = "btn btn-secondary";
        addTierBtn.style.cssText = "width: 100%; margin-top: 8px;";
        addTierBtn.textContent = "Add Tier";
        
        const tiers = currencyData.tiers || [];
        if (tiers.length === 0) {
          tiers.push({ amount: 1, value: 0 });
        }
        
        function renderTiers() {
          tiersContainer.innerHTML = "";
          tiers.forEach((tier, index) => {
            const tierRow = document.createElement("div");
            tierRow.style.cssText = "display: flex; gap: 8px; align-items: center; width: 100%;";
            
            const amountWrapper = document.createElement("div");
            amountWrapper.className = "number-input-wrapper";
            amountWrapper.style.cssText = "flex: 1; min-width: 0;";
            
            const amountInput = document.createElement("input");
            amountInput.type = "number";
            amountInput.className = "input";
            amountInput.step = "0.01";
            amountInput.min = "0";
            amountInput.value = tier.amount || "0";
            amountInput.placeholder = "Amount";
            amountInput.style.cssText = "width: 100%;";
            amountInput.id = `streamlabsTierAmount_${currencyCode}_${index}`;
            
            amountWrapper.appendChild(amountInput);
            
            const valueWrapper = document.createElement("div");
            valueWrapper.className = "input-wrapper-with-unit currency-input-wrapper";
            valueWrapper.style.cssText = "flex: 1; min-width: 0;";
            
            const valueInput = document.createElement("input");
            valueInput.type = "number";
            valueInput.className = "input";
            valueInput.step = "0.01";
            valueInput.min = "0";
            valueInput.value = tier.value || "0";
            valueInput.placeholder = "Value";
            valueInput.id = `streamlabsTierValue_${currencyCode}_${index}`;
            
            const unitLabel = document.createElement("span");
            unitLabel.className = "unit-label-inline";
            let unitText = "units";
            if (state.metricType === "time") {
              unitText = "seconds";
            } else if (state.metricType === "distance") {
              unitText = "meters";
            } else {
              unitText = state.customUnit || "units";
            }
            unitLabel.textContent = unitText;
            
            valueWrapper.appendChild(valueInput);
            valueWrapper.appendChild(unitLabel);
            
            const removeBtn = document.createElement("button");
            removeBtn.className = "btn btn-icon";
            removeBtn.style.cssText = "width: 32px; height: 32px; padding: 0; flex-shrink: 0;";
            removeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            
            if (tiers.length > 1) {
              removeBtn.addEventListener("click", () => {
                tiers.splice(index, 1);
                renderTiers();
                applyMetricsNow();
              });
            } else {
              removeBtn.disabled = true;
              removeBtn.style.opacity = "0.5";
            }
            
            amountInput.addEventListener("input", () => {
              tier.amount = parseFloat(amountInput.value) || 0;
              applyMetricsNow();
            });
            
            valueInput.addEventListener("input", () => {
              tier.value = parseFloat(valueInput.value) || 0;
              applyMetricsNow();
            });
            
            tierRow.appendChild(amountWrapper);
            tierRow.appendChild(valueWrapper);
            tierRow.appendChild(removeBtn);
            tiersContainer.appendChild(tierRow);
          });
        }
        
        renderTiers();
        contentDiv.appendChild(tiersContainer);
        
        addTierBtn.addEventListener("click", () => {
          tiers.push({ amount: 0, value: 0 });
          renderTiers();
          applyMetricsNow();
        });
        
        contentDiv.appendChild(addTierBtn);
        
        const hint = document.createElement("p");
        hint.style.cssText = "font-size: 12px; color: var(--text-secondary); margin-top: 6px;";
        if (currentMode === "tiered") {
          hint.textContent = "Tiered: Uses the highest tier where donation amount >= tier amount. Example: $25.56 matches $25 tier.";
        } else {
          hint.textContent = "Fixed: Uses exact tier match. Amounts like $25.56 will match $25 tier (rounded down).";
        }
        contentDiv.appendChild(hint);
      }
    }
    
    updateCurrencyUI();
    
    modeSelect.addEventListener("change", () => {
      updateCurrencyUI();
      applyMetricsNow();
    });
  }
  
  currencySelect.addEventListener("change", () => {
    showCurrencyConfig(currencySelect.value);
  });
  
  const savedCurrency = localStorage.getItem("streamlabsSelectedCurrency");
  if (savedCurrency && STREAMLABS_CURRENCIES.find(c => c.code === savedCurrency)) {
    currencySelect.value = savedCurrency;
    showCurrencyConfig(savedCurrency);
  }
  
  currencySelect.addEventListener("change", () => {
    localStorage.setItem("streamlabsSelectedCurrency", currencySelect.value);
    showCurrencyConfig(currencySelect.value);
  });
}

function generateDonationalertsCurrencyInputs() {
  const container = document.getElementById("donationalertsDonationCurrencies");
  if (!container) return;
  
  container.innerHTML = "";
  
  const selectorWrapper = document.createElement("div");
  selectorWrapper.style.cssText = "margin-bottom: 16px;";
  
  const selectorLabel = document.createElement("label");
  selectorLabel.textContent = "Select Currency:";
  selectorLabel.style.cssText = "display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: var(--text-primary);";
  
  const currencySelect = document.createElement("select");
  currencySelect.className = "input";
  currencySelect.id = "donationalertsCurrencySelector";
  currencySelect.style.cssText = "width: 100%; margin-bottom: 12px;";
  
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select Currency --";
  currencySelect.appendChild(defaultOption);
  
  DONATIONALERTS_CURRENCIES.forEach(currency => {
    const option = document.createElement("option");
    option.value = currency.code;
    option.textContent = `${currency.code} - ${currency.name}`;
    currencySelect.appendChild(option);
  });
  
  selectorWrapper.appendChild(selectorLabel);
  selectorWrapper.appendChild(currencySelect);
  container.appendChild(selectorWrapper);
  
  const configContainer = document.createElement("div");
  configContainer.id = "donationalertsCurrencyConfig";
  configContainer.style.cssText = "display: none;";
  container.appendChild(configContainer);
  
  function showCurrencyConfig(currencyCode) {
    configContainer.innerHTML = "";
    configContainer.style.display = currencyCode ? "block" : "none";
    
    if (!currencyCode) return;
    
    const currency = DONATIONALERTS_CURRENCIES.find(c => c.code === currencyCode);
    if (!currency) return;
    
    const currencyData = state.config.eventValues?.donationalerts?.donationCurrencies?.[currencyCode] || {};
    const mode = currencyData.mode || "multiplier";
    
    const currencyCard = document.createElement("div");
    currencyCard.className = "form-group event-value-group";
    
    const header = document.createElement("div");
    header.className = "event-value-header";
    
    const label = document.createElement("label");
    label.textContent = `${currency.code} - ${currency.name}`;
    
    const modeSelectWrapper = document.createElement("div");
    modeSelectWrapper.className = "custom-dropdown-wrapper";
    
    const modeSelect = document.createElement("select");
    modeSelect.className = "input";
    modeSelect.id = `donationalertsMode_${currencyCode}`;
    modeSelect.style.cssText = "width: 140px; font-size: 12px; padding: 6px 8px; display: none;";
    modeSelect.innerHTML = `
      <option value="multiplier">Multiplier (1$ = X)</option>
      <option value="tiered">Tiered (1$=X, 2$=Y)</option>
      <option value="fixed">Fixed Tiers</option>
    `;
    modeSelect.value = mode;
    
    const dropdownButton = document.createElement("button");
    dropdownButton.type = "button";
    dropdownButton.className = "custom-dropdown-button";
    dropdownButton.setAttribute("aria-haspopup", "listbox");
    dropdownButton.setAttribute("aria-expanded", "false");
    
    const selectedSpan = document.createElement("span");
    selectedSpan.className = "custom-dropdown-selected";
    selectedSpan.textContent = modeSelect.options[modeSelect.selectedIndex].text;
    
    const arrowSpan = document.createElement("span");
    arrowSpan.className = "custom-dropdown-arrow";
    arrowSpan.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L1 4h10z" fill="currentColor"></path></svg>`;
    
    const dropdownMenu = document.createElement("div");
    dropdownMenu.className = "custom-dropdown-menu";
    dropdownMenu.setAttribute("role", "listbox");
    
    Array.from(modeSelect.options).forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = `custom-dropdown-option ${option.value === mode ? "selected" : ""}`;
      optionDiv.setAttribute("role", "option");
      optionDiv.setAttribute("data-value", option.value);
      optionDiv.setAttribute("data-index", index);
      optionDiv.textContent = option.text;
      dropdownMenu.appendChild(optionDiv);
    });
    
    dropdownButton.appendChild(selectedSpan);
    dropdownButton.appendChild(arrowSpan);
    modeSelectWrapper.appendChild(dropdownButton);
    modeSelectWrapper.appendChild(dropdownMenu);
    modeSelectWrapper.appendChild(modeSelect);
    
    header.appendChild(label);
    header.appendChild(modeSelectWrapper);
    currencyCard.appendChild(header);
    
    const contentDiv = document.createElement("div");
    contentDiv.id = `donationalertsContent_${currencyCode}`;
    currencyCard.appendChild(contentDiv);
    
    configContainer.appendChild(currencyCard);
    
    dropdownMenu.querySelectorAll(".custom-dropdown-option").forEach(option => {
      option.addEventListener("click", () => {
        const value = option.getAttribute("data-value");
        modeSelect.value = value;
        
        selectedSpan.textContent = option.textContent;
        
        dropdownMenu.querySelectorAll(".custom-dropdown-option").forEach(opt => {
          opt.classList.remove("selected");
        });
        option.classList.add("selected");
        
        modeSelectWrapper.classList.remove("open");
        dropdownButton.setAttribute("aria-expanded", "false");
        currencyCard.classList.remove("dropdown-open");
        
        updateCurrencyUI();
        applyMetricsNow();
      });
    });
    
    dropdownButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = modeSelectWrapper.classList.contains("open");
      
      if (isOpen) {
        modeSelectWrapper.classList.remove("open");
        dropdownButton.setAttribute("aria-expanded", "false");
        currencyCard.classList.remove("dropdown-open");
      } else {
        document.querySelectorAll(".custom-dropdown-wrapper.open").forEach(dd => {
          if (dd !== modeSelectWrapper) {
            dd.classList.remove("open");
            dd.querySelector(".custom-dropdown-button").setAttribute("aria-expanded", "false");
            const otherCard = dd.closest(".event-value-group");
            if (otherCard) otherCard.classList.remove("dropdown-open");
          }
        });
        modeSelectWrapper.classList.add("open");
        dropdownButton.setAttribute("aria-expanded", "true");
        currencyCard.classList.add("dropdown-open");
      }
    });
    
    const closeDropdownHandler = (e) => {
      if (!modeSelectWrapper.contains(e.target)) {
        modeSelectWrapper.classList.remove("open");
        dropdownButton.setAttribute("aria-expanded", "false");
        currencyCard.classList.remove("dropdown-open");
      }
    };
    document.addEventListener("click", closeDropdownHandler);
    
    function updateCurrencyUI() {
      const currentMode = modeSelect.value;
      contentDiv.innerHTML = "";
      
      if (currentMode === "multiplier") {
        const multiplierWrapper = document.createElement("div");
        multiplierWrapper.className = "input-wrapper-with-unit";
        
        const multiplierInput = document.createElement("input");
        multiplierInput.type = "number";
        multiplierInput.id = `donationalertsMultiplier_${currencyCode}`;
        multiplierInput.className = "input";
        multiplierInput.step = "0.01";
        multiplierInput.min = "0";
        multiplierInput.value = currencyData.multiplier || "0";
        multiplierInput.placeholder = "Units per 1 currency unit";
        
        const unitLabel = document.createElement("span");
        unitLabel.className = "unit-label-inline";
        let unitText = "units";
        if (state.metricType === "time") {
          unitText = "seconds";
        } else if (state.metricType === "distance") {
          unitText = "meters";
        } else {
          unitText = state.customUnit || "units";
        }
        unitLabel.textContent = unitText;
        
        multiplierWrapper.appendChild(multiplierInput);
        multiplierWrapper.appendChild(unitLabel);
        contentDiv.appendChild(multiplierWrapper);
        
        const hint = document.createElement("p");
        hint.style.cssText = "font-size: 12px; color: var(--text-secondary); margin-top: 6px;";
        hint.textContent = `Example: ${currencyData.multiplier || 1} = ${currencyCode} 1.00 = ${(currencyData.multiplier || 1).toFixed(2)} ${unitText}`;
        contentDiv.appendChild(hint);
        
        multiplierInput.addEventListener("input", () => {
          applyMetricsNow();
          hint.textContent = `Example: ${multiplierInput.value || 0} = ${currencyCode} 1.00 = ${(parseFloat(multiplierInput.value) || 0).toFixed(2)} ${unitText}`;
        });
      } else {
        const tiersContainer = document.createElement("div");
        tiersContainer.id = `donationalertsTiers_${currencyCode}`;
        tiersContainer.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
        
        const addTierBtn = document.createElement("button");
        addTierBtn.className = "btn btn-secondary";
        addTierBtn.style.cssText = "width: 100%; margin-top: 8px;";
        addTierBtn.textContent = "Add Tier";
        
        const tiers = currencyData.tiers || [];
        if (tiers.length === 0) {
          tiers.push({ amount: 1, value: 0 });
        }
        
        function renderTiers() {
          tiersContainer.innerHTML = "";
          tiers.forEach((tier, index) => {
            const tierRow = document.createElement("div");
            tierRow.style.cssText = "display: flex; gap: 8px; align-items: center; width: 100%;";
            
            const amountWrapper = document.createElement("div");
            amountWrapper.className = "number-input-wrapper";
            amountWrapper.style.cssText = "flex: 1; min-width: 0;";
            
            const amountInput = document.createElement("input");
            amountInput.type = "number";
            amountInput.className = "input";
            amountInput.step = "0.01";
            amountInput.min = "0";
            amountInput.value = tier.amount || "0";
            amountInput.placeholder = "Amount";
            amountInput.style.cssText = "width: 100%;";
            amountInput.id = `donationalertsTierAmount_${currencyCode}_${index}`;
            
            amountWrapper.appendChild(amountInput);
            
            const valueWrapper = document.createElement("div");
            valueWrapper.className = "input-wrapper-with-unit currency-input-wrapper";
            valueWrapper.style.cssText = "flex: 1; min-width: 0;";
            
            const valueInput = document.createElement("input");
            valueInput.type = "number";
            valueInput.className = "input";
            valueInput.step = "0.01";
            valueInput.min = "0";
            valueInput.value = tier.value || "0";
            valueInput.placeholder = "Value";
            valueInput.id = `donationalertsTierValue_${currencyCode}_${index}`;
            
            const unitLabel = document.createElement("span");
            unitLabel.className = "unit-label-inline";
            let unitText = "units";
            if (state.metricType === "time") {
              unitText = "seconds";
            } else if (state.metricType === "distance") {
              unitText = "meters";
            } else {
              unitText = state.customUnit || "units";
            }
            unitLabel.textContent = unitText;
            
            valueWrapper.appendChild(valueInput);
            valueWrapper.appendChild(unitLabel);
            
            const removeBtn = document.createElement("button");
            removeBtn.className = "btn btn-icon";
            removeBtn.style.cssText = "width: 32px; height: 32px; padding: 0; flex-shrink: 0;";
            removeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            
            if (tiers.length > 1) {
              removeBtn.addEventListener("click", () => {
                tiers.splice(index, 1);
                renderTiers();
                applyMetricsNow();
              });
            } else {
              removeBtn.disabled = true;
              removeBtn.style.opacity = "0.5";
            }
            
            amountInput.addEventListener("input", () => {
              tier.amount = parseFloat(amountInput.value) || 0;
              applyMetricsNow();
            });
            
            valueInput.addEventListener("input", () => {
              tier.value = parseFloat(valueInput.value) || 0;
              applyMetricsNow();
            });
            
            tierRow.appendChild(amountWrapper);
            tierRow.appendChild(valueWrapper);
            tierRow.appendChild(removeBtn);
            tiersContainer.appendChild(tierRow);
          });
        }
        
        renderTiers();
        contentDiv.appendChild(tiersContainer);
        
        addTierBtn.addEventListener("click", () => {
          tiers.push({ amount: 0, value: 0 });
          renderTiers();
          applyMetricsNow();
        });
        
        contentDiv.appendChild(addTierBtn);
        
        const hint = document.createElement("p");
        hint.style.cssText = "font-size: 12px; color: var(--text-secondary); margin-top: 6px;";
        if (currentMode === "tiered") {
          hint.textContent = "Tiered: Uses the highest tier where donation amount >= tier amount. Example: $25.56 matches $25 tier.";
        } else {
          hint.textContent = "Fixed: Uses exact tier match. Amounts like $25.56 will match $25 tier (rounded down).";
        }
        contentDiv.appendChild(hint);
      }
    }
    
    updateCurrencyUI();
    
    modeSelect.addEventListener("change", () => {
      updateCurrencyUI();
      applyMetricsNow();
    });
  }
  
  currencySelect.addEventListener("change", () => {
    localStorage.setItem("donationalertsSelectedCurrency", currencySelect.value);
    showCurrencyConfig(currencySelect.value);
  });
  
  const savedCurrency = localStorage.getItem("donationalertsSelectedCurrency");
  if (savedCurrency && DONATIONALERTS_CURRENCIES.find(c => c.code === savedCurrency)) {
    currencySelect.value = savedCurrency;
    showCurrencyConfig(savedCurrency);
  }
}

function initializeMetricsUI() {
  if (metricType) {
    if (state.metricType && metricType.value !== state.metricType) {
      metricType.value = state.metricType;
    }
    
    updateMetricTypeUI();
    
    if (state.metricType === "time") {
      if (state.currentValue > 0) {
        updateTimeInputsFromValue(state.currentValue);
      }
    } else if (startingValue) {
      if (state.metricType === "distance") {
        startingValue.value = state.startingValue !== undefined ? state.startingValue : (state.currentValue || "0.0");
      } else {
        startingValue.value = state.startingValue !== undefined ? state.startingValue : (state.currentValue || 0);
      }
    }
    
    if (distanceDisplayMode && state.distanceDisplayMode) {
      distanceDisplayMode.value = state.distanceDisplayMode;
    }
  }
  
  if (!state.config.eventValues) {
    state.config.eventValues = {
      kick: { subValue: 120, giftValue: 60, subEnabled: true, giftEnabled: true, platformEnabled: true },
      twitch: { subValue: 120, giftValue: 60, bitsValue: 30, subEnabled: true, giftEnabled: true, bitsEnabled: true, platformEnabled: true },
      streamlabs: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true },
      donationalerts: { donationCurrencies: {}, donationEnabled: true, platformEnabled: true }
    };
  }

  generateStreamlabsCurrencyInputs();
  generateDonationalertsCurrencyInputs();
  
  setTimeout(() => {
    updateUnitLabels();
  }, 50);
  
  setTimeout(() => {
    if (typeof window.initNumberInputs === "function") {
      window.initNumberInputs();
    }
  }, 100);

  const kickValues = state.config.eventValues.kick || {};
  const kickPlatformEnabledEl = document.getElementById("kickPlatformEnabled");
  if (kickPlatformEnabledEl) kickPlatformEnabledEl.checked = kickValues.platformEnabled !== false;
  const kickSubValueEl = document.getElementById("kickSubValue");
  const kickGiftValueEl = document.getElementById("kickGiftValue");
  const kickSubEnabledEl = document.getElementById("kickSubEnabled");
  const kickGiftEnabledEl = document.getElementById("kickGiftEnabled");
  
  if (kickSubValueEl) kickSubValueEl.value = kickValues.subValue !== undefined ? kickValues.subValue : 120;
  if (kickGiftValueEl) kickGiftValueEl.value = kickValues.giftValue !== undefined ? kickValues.giftValue : 60;
  if (kickSubEnabledEl) kickSubEnabledEl.checked = kickValues.subEnabled !== false;
  if (kickGiftEnabledEl) kickGiftEnabledEl.checked = kickValues.giftEnabled !== false;

  const twitchValues = state.config.eventValues.twitch || {};
  const twitchSubValueEl = document.getElementById("twitchSubValue");
  const twitchGiftValueEl = document.getElementById("twitchGiftValue");
  const twitchBitsValueEl = document.getElementById("twitchBitsValue");
  const twitchSubEnabledEl = document.getElementById("twitchSubEnabled");
  const twitchGiftEnabledEl = document.getElementById("twitchGiftEnabled");
  const twitchBitsEnabledEl = document.getElementById("twitchBitsEnabled");
  const twitchPlatformEnabledEl = document.getElementById("twitchPlatformEnabled");
  
  if (twitchSubValueEl) twitchSubValueEl.value = twitchValues.subValue !== undefined ? twitchValues.subValue : 120;
  if (twitchGiftValueEl) twitchGiftValueEl.value = twitchValues.giftValue !== undefined ? twitchValues.giftValue : 60;
  if (twitchBitsValueEl) twitchBitsValueEl.value = twitchValues.bitsValue !== undefined ? twitchValues.bitsValue : 30;
  if (twitchSubEnabledEl) twitchSubEnabledEl.checked = twitchValues.subEnabled !== false;
  if (twitchGiftEnabledEl) twitchGiftEnabledEl.checked = twitchValues.giftEnabled !== false;
  if (twitchBitsEnabledEl) twitchBitsEnabledEl.checked = twitchValues.bitsEnabled !== false;
  if (twitchPlatformEnabledEl) twitchPlatformEnabledEl.checked = twitchValues.platformEnabled !== false;

  const streamlabsValues = state.config.eventValues.streamlabs || {};
  const streamlabsDonationEnabledEl = document.getElementById("streamlabsDonationEnabled");
  const streamlabsPlatformEnabledEl = document.getElementById("streamlabsPlatformEnabled");
  if (streamlabsDonationEnabledEl) streamlabsDonationEnabledEl.checked = streamlabsValues.donationEnabled !== false;
  if (streamlabsPlatformEnabledEl) streamlabsPlatformEnabledEl.checked = streamlabsValues.platformEnabled !== false;
  
  if (streamlabsValues.donationCurrencies) {
    STREAMLABS_CURRENCIES.forEach(currency => {
      const currencyData = streamlabsValues.donationCurrencies[currency.code];
      if (currencyData) {
        const modeSelect = document.getElementById(`streamlabsMode_${currency.code}`);
        if (modeSelect) {
          modeSelect.value = currencyData.mode || "multiplier";
          const contentDiv = document.getElementById(`streamlabsContent_${currency.code}`);
          if (contentDiv) {
            const event = new Event("change");
            modeSelect.dispatchEvent(event);
          }
        }
        
        if (currencyData.mode === "multiplier") {
          const multiplierInput = document.getElementById(`streamlabsMultiplier_${currency.code}`);
          if (multiplierInput && currencyData.multiplier !== undefined) {
            multiplierInput.value = currencyData.multiplier;
          }
        } else if (currencyData.tiers) {
          setTimeout(() => {
            currencyData.tiers.forEach((tier, index) => {
              const amountInput = document.getElementById(`streamlabsTierAmount_${currency.code}_${index}`);
              const valueInput = document.getElementById(`streamlabsTierValue_${currency.code}_${index}`);
              if (amountInput) amountInput.value = tier.amount || 0;
              if (valueInput) valueInput.value = tier.value || 0;
            });
          }, 100);
        }
      }
    });
  }

  const donationalertsValues = state.config.eventValues.donationalerts || {};
  const donationalertsDonationEnabledEl = document.getElementById("donationalertsDonationEnabled");
  const donationalertsPlatformEnabledEl = document.getElementById("donationalertsPlatformEnabled");
  if (donationalertsDonationEnabledEl) donationalertsDonationEnabledEl.checked = donationalertsValues.donationEnabled !== false;
  if (donationalertsPlatformEnabledEl) donationalertsPlatformEnabledEl.checked = donationalertsValues.platformEnabled !== false;
  
  const platformToggleInputs = ["kickPlatformEnabled", "twitchPlatformEnabled", "streamlabsPlatformEnabled", "donationalertsPlatformEnabled"];
  platformToggleInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("change", () => {
        applyMetricsNow();
      });
    }
  });
}

initializeMetricsUI();

module.exports = { applyMetricsNow, initializeMetricsUI };