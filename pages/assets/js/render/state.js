
const { ipcRenderer } = require("electron");


const state = {
  currentProfileId: "default",
  profiles: {},
  currentValue: 0,
  startingValue: 0,
  isRunning: false,
  isPaused: false,
  metricType: "time",
  customUnit: "",
  events: [],
  totalEvents: 0,
  valueAdded: 0,
  config: {
    eventValues: {
      kick: {
        subValue: 120,
        giftValue: 60,
        subEnabled: true,
        giftEnabled: true,
        platformEnabled: true
      },
      twitch: {
        subValue: 120,
        giftValue: 60,
        bitsValue: 30,
        subEnabled: true,
        giftEnabled: true,
        bitsEnabled: true,
        platformEnabled: true
      },
      streamlabs: {
        donationCurrencies: {},
        donationEnabled: true,
        platformEnabled: true
      },
      donationalerts: {
        donationCurrencies: {},
        donationEnabled: true,
        platformEnabled: true
      }
    }
  },
  platforms: {
    twitch: { connected: false, ws: null, enabled: true },
    kick: { configured: false, enabled: true },
    streamlabs: { enabled: true },
    donationalerts: { enabled: true }
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
  streamlabs: {
    socketToken: "",
    configured: false
  },
  settings: {
    autoSave: false,
    soundAlerts: false,
    startMinimized: false
  },
  distanceDisplayMode: "meters"
};


module.exports = { state };