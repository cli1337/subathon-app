
const { ipcRenderer } = require("electron");
const { state } = require("./state");

function saveAllConfig() {
  ipcRenderer.send("save-config", {
    overlayPort: state.overlay.port,
    kick: {
      pusherRegion: state.kick.pusherRegion,
      pusherKey: state.kick.pusherKey,
      chatroomId: state.kick.chatroomId,
      username: state.kick.username
    },
    twitch: {
      username: state.twitch.username,
      oauth: state.twitch.oauth,
      channel: state.twitch.channel
    },
    metricState: {
      currentValue: state.currentValue,
      metricType: state.metricType,
      customUnit: state.customUnit,
      totalEvents: state.totalEvents,
      valueAdded: state.valueAdded
    },
    reducer: state.reducer,
    settings: state.settings,
    overlay: {
      ...state.overlay,
      unitPosition: state.overlay.unitPosition || "bottom",
      unitAlignment: state.overlay.unitAlignment || "center",
      pausedText: state.overlay.pausedText || "PAUSED",
      stoppedText: state.overlay.stoppedText || "STOPPED",
      pausedTextSize: state.overlay.pausedTextSize || 48,
      pausedTextColor: state.overlay.pausedTextColor || "#ffaa00",
      showValueWhenPaused: state.overlay.showValueWhenPaused !== false,
      showValueWhenStopped: state.overlay.showValueWhenStopped !== false
    },
    events: state.events
  });
}

module.exports = { saveAllConfig };
