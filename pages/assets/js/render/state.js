
const { ipcRenderer } = require("electron");


const state = {
  currentProfileId: "default",
  profiles: {},
  currentValue: 0,
  isRunning: false,
  isPaused: false,
  metricType: "time",
  customUnit: "",
  events: [],
  totalEvents: 0,
  valueAdded: 0,
  config: {
    subValue: 120,
    giftValue: 60,
    bitsValue: 30,
    donationValue: 60,
    followValue: 0
  },
  platforms: {
    twitch: { connected: false, ws: null },
    kick: { configured: false }
  },
  reducer: {
    enabled: false,
    amountPerSecond: 1
  },
  overlay: {
    port: 55814,
    fontSize: 72,
    textColor: "#ffffff",
    background: "transparent",
    bgColor: "#000000",
    unitPosition: "bottom",
    unitAlignment: "center",
    pausedText: "PAUSED",
    stoppedText: "STOPPED",
    pausedTextSize: 48,
    pausedTextColor: "#ffaa00",
    showValueWhenPaused: true,
    showValueWhenStopped: true,
    showUnitWhenPaused: true,
    showUnitWhenStopped: true,
    enableValueAnimation: true,
    animationSpeed: 1000,
    gifterPosition: "bottom-left",
    overlayPageBg: "#000000",
    textShadow: {
      enabled: true,
      x: 0,
      y: 4,
      blur: 12,
      color: "#000000"
    },
    statusTextShadow: {
      enabled: true,
      x: 0,
      y: 4,
      blur: 12,
      color: "#000000"
    },
    unitSize: 24,
    unitColor: "#ffffff",
    unitPrefix: "",
    unitSuffix: "",
    gifterCard: {
      animation: "slideUp",
      size: 100,
      bgColor: "#000000",
      borderColor: "#ffffff",
      nameSize: 12,
      nameColor: "#ffffff",
      amountSize: 13,
      amountColor: "#22c55e",
      unitSize: 8
    }
  },
  kick: {
    pusherRegion: "ws-us2",
    pusherKey: "32cbd69e4b950bf97679",
    chatroomId: "",
    username: "",
    configured: false
  },
  twitch: {
    username: "",
    oauth: "",
    channel: "",
    configured: false
  },
  settings: {
    autoSave: false,
    soundAlerts: false,
    startMinimized: false
  }
};


module.exports = { state };