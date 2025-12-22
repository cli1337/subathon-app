const { state } = require("./state");
const { updateDisplay, updateStats, updateConnectionStatus } = require("./display");
const { saveAllConfig } = require("./config");

let intervalId = null;
let reducerIntervalId = null;

module.exports.intervalId = () => intervalId;
module.exports.reducerIntervalId = () => reducerIntervalId;

function stopTimer() {
  state.isRunning = false;
  state.isPaused = false;
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const reducerEnabledCheckbox = document.getElementById("reducerEnabled");
  const toggleReducerBtn = document.getElementById("toggleReducerBtn");

  if (startBtn) {
    startBtn.disabled = false;
    startBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>`;
    startBtn.title = "Start";
  }

  if (pauseBtn) {
    pauseBtn.disabled = true;
    pauseBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>`;
    pauseBtn.title = "Pause";
    pauseBtn.removeAttribute("data-state");
  }
  if (intervalId) clearInterval(intervalId);
  intervalId = null;

  if (state.reducer.enabled) {
    stopReducer();
    state.reducer.enabled = false;
    if (reducerEnabledCheckbox) reducerEnabledCheckbox.checked = false;

    if (toggleReducerBtn) {
      const reducerBtnIcon = document.getElementById("reducerBtnIcon");
      const svg = reducerBtnIcon || toggleReducerBtn.querySelector("svg");
      if (svg) {
        svg.style.color = "var(--text-secondary)";
        svg.style.filter = "none";
        toggleReducerBtn.style.background = "";
        toggleReducerBtn.style.border = "";
        toggleReducerBtn.title = "Reducer OFF – Click to enable";
      }
    }

    updateStats();
  }

  if (toggleReducerBtn) {
    toggleReducerBtn.disabled = true;
  }
  updateConnectionStatus();
  updateDisplay();
}

function startReducer() {

  if (reducerIntervalId || !state.reducer.enabled || !state.isRunning) return;

  reducerIntervalId = setInterval(() => {

    if (!state.isRunning) {
      stopReducer();
      return;
    }

    if (state.currentValue > 0) {
      const delta = state.reducer.amountPerSecond || 0;
      state.currentValue = Math.max(0, state.currentValue - delta);
      updateDisplay();
      saveAllConfig();

      if (state.currentValue <= 0) {
        stopReducer(); 

        stopTimer(); 

        return;
      }
    } else {

      state.currentValue = 0;
      stopReducer(); 

      stopTimer(); 

      return;
    }
  }, 1000);
}

function stopReducer() {
  if (reducerIntervalId) clearInterval(reducerIntervalId);
  reducerIntervalId = null;
}

function startTimer() {
  if (state.isRunning) return;

  state.isRunning = true;
  state.isPaused = false;
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const toggleReducerBtn = document.getElementById("toggleReducerBtn");

  if (startBtn) {
    startBtn.disabled = false;
    startBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="6" width="12" height="12"></rect>
      </svg>`;
    startBtn.title = "Stop";
  }

  if (pauseBtn) {
    pauseBtn.disabled = false;
    pauseBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>`;
    pauseBtn.title = "Pause";
    pauseBtn.setAttribute("data-state", "running");
  }

  if (toggleReducerBtn) {
    toggleReducerBtn.disabled = false;
  }

  updateConnectionStatus();
  updateDisplay();

  if (state.metricType === "time") {
    intervalId = setInterval(() => {
      if (!state.isPaused && state.isRunning) {

        if (state.currentValue > 0) {
          state.currentValue--;
          if (state.currentValue < 0) state.currentValue = 0;
        }

        updateDisplay();
        saveAllConfig();
      }
    }, 1000);
  }

  if (state.reducer.enabled && state.isRunning && !state.isPaused) {
    startReducer();
  }
}

function pauseTimer() {
  state.isPaused = !state.isPaused;
  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    if (state.isPaused) {

      pauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>`;
      pauseBtn.title = "Resume";
      pauseBtn.setAttribute("data-state", "paused");
    } else {

      pauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>`;
      pauseBtn.title = "Pause";
      pauseBtn.setAttribute("data-state", "running");
    }
  }

  updateConnectionStatus();
  updateDisplay();
  saveAllConfig();
}

module.exports = { startTimer, stopTimer, pauseTimer, startReducer, stopReducer };