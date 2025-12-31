
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
    streamlabs: {
      socketToken: state.streamlabs.socketToken || ""
    },
    donationalerts: {
      accessToken: state.donationalerts?.accessToken || "",
      configured: state.donationalerts?.configured || false
    },
    metricState: {
      currentValue: state.currentValue,
      startingValue: state.startingValue,
      metricType: state.metricType,
      customUnit: state.customUnit,
      totalEvents: state.totalEvents,
      valueAdded: state.valueAdded,
      distanceDisplayMode: state.distanceDisplayMode || "meters"
    },
    eventValues: JSON.parse(JSON.stringify(state.config.eventValues || {})),
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
    platforms: state.platforms,
    events: state.events
  });
}

module.exports = { saveAllConfig };
