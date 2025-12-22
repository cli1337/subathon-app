const {
	app,
	BrowserWindow,
	ipcMain,
	shell
} = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
const http = require("http");

const DEV_MODE = true;
console.log('Starting Subathon App');
console.log('DEV_MODE:', DEV_MODE);
let loadingWindow;
let mainWindow;
let overlayServer;
let overlayApp;
let overlayServerData = {
	lastOverlayData: {
		value: "00:00:00",
		unit: "TIME",
		status: "stopped"
	},
	lastGifterData: null,
	gifterDataTimeout: null
};
let dataDir = "";
let profilesDir = "";
let currentProfileId = "default";
let profiles = {};
let config = {};

const defaultConfig = {
	overlayPort: 55814,
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
		username: ""
	},

	twitch: {
		username: "",
		oauth: "",
		channel: ""
	},

	metricState: {
		currentValue: 0,
		metricType: "time",
		customUnit: "",
		totalEvents: 0,
		valueAdded: 0
	},

	reducer: {
		enabled: false,
		amountPerSecond: 1
	},

	settings: {
		autoSave: false,
		soundAlerts: false,
		startMinimized: false
	}
};

function loadProfiles() {
	const profilesPath = path.join(profilesDir, "profiles.json");
	if (!fs.existsSync(profilesPath)) {
		profiles = {
			default: {
				id: "default",
				name: "Default Profile",
				createdAt: new Date().toISOString()
			}
		};
		saveProfiles();
		return;
	}
	try {
		profiles = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
	} catch (err) {
		console.error("Error loading profiles:", err);
		profiles = {
			default: {
				id: "default",
				name: "Default Profile",
				createdAt: new Date().toISOString()
			}
		};
		saveProfiles();
	}
}

function saveProfiles() {
	const profilesPath = path.join(profilesDir, "profiles.json");
	fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

function getProfilePath(profileId) {
	return path.join(profilesDir, `profile_${profileId}.json`);
}

function loadProfileConfig(profileId) {
	const profilePath = getProfilePath(profileId);
	if (!fs.existsSync(profilePath)) {
		const newConfig = JSON.parse(JSON.stringify(defaultConfig));
		saveProfileConfig(profileId, newConfig);
		return newConfig;
	}
	try {
		const saved = JSON.parse(fs.readFileSync(profilePath, "utf8"));
		const profileConfig = JSON.parse(JSON.stringify(defaultConfig));
		if (saved.overlayPort !== undefined) {
			profileConfig.overlayPort = saved.overlayPort;
			profileConfig.overlay.port = saved.overlayPort;
		}
		if (saved.overlay) Object.assign(profileConfig.overlay, saved.overlay);
		if (saved.kick) Object.assign(profileConfig.kick, saved.kick);
		if (saved.metricState) Object.assign(profileConfig.metricState, saved.metricState);
		if (saved.reducer) Object.assign(profileConfig.reducer, saved.reducer);
		if (saved.settings) Object.assign(profileConfig.settings, saved.settings);
		if (saved.events) profileConfig.events = saved.events || [];
		return profileConfig;
	} catch (err) {
		console.error(`Error loading profile ${profileId}:`, err);
		return JSON.parse(JSON.stringify(defaultConfig));
	}
}

function saveProfileConfig(profileId, profileConfig) {
	const profilePath = getProfilePath(profileId);
	fs.writeFileSync(profilePath, JSON.stringify(profileConfig, null, 2));
}




function loadConfig() {
	config = loadProfileConfig(currentProfileId);
}

function saveConfig() {
	saveProfileConfig(currentProfileId, config);
}

ipcMain.on("autosave", (event, partial) => {
	if (partial.metricState) Object.assign(config.metricState, partial.metricState);
	if (partial.reducer) Object.assign(config.reducer, partial.reducer);
	saveConfig();
});

ipcMain.on("save-config", (event, data) => {
	if (data.overlayPort !== undefined) {
		config.overlayPort = data.overlayPort;
		config.overlay.port = data.overlayPort;
	}
	if (data.kick) Object.assign(config.kick, data.kick);
	if (data.twitch) Object.assign(config.twitch, data.twitch);
	if (data.metricState) Object.assign(config.metricState, data.metricState);
	if (data.reducer) Object.assign(config.reducer, data.reducer);
	if (data.overlay) Object.assign(config.overlay, data.overlay);
	if (data.settings) Object.assign(config.settings, data.settings);
	if (data.events) config.events = data.events;

	saveConfig();

	if (mainWindow) {
		mainWindow.webContents.send("config-updated", config);
	}
});


ipcMain.handle("get-profiles", () => {
	return profiles;
});

ipcMain.handle("get-current-profile", () => {
	return currentProfileId;
});

ipcMain.on("create-profile", (event, profileName) => {
	const profileId = `profile_${Date.now()}`;
	profiles[profileId] = {
		id: profileId,
		name: profileName || `Profile ${Object.keys(profiles).length + 1}`,
		createdAt: new Date().toISOString()
	};
	saveProfiles();
	const newConfig = JSON.parse(JSON.stringify(defaultConfig));
	saveProfileConfig(profileId, newConfig);
	if (mainWindow) {
		mainWindow.webContents.send("profiles-updated", profiles);
	}
});

ipcMain.on("switch-profile", (event, profileId) => {
	if (currentProfileId === profileId) return;

	saveConfig();
	currentProfileId = profileId;
	config = loadProfileConfig(profileId);
	if (mainWindow) {
		mainWindow.webContents.send("profile-switched", {
			profileId,
			config
		});
	}
});

ipcMain.on("delete-profile", (event, profileId) => {
	if (Object.keys(profiles).length <= 1) {
		if (mainWindow) {
			mainWindow.webContents.send("profile-error", "Cannot delete the last profile");
		}
		return;
	}
	if (currentProfileId === profileId) {
		if (mainWindow) {
			mainWindow.webContents.send("profile-error", "Cannot delete active profile");
		}
		return;
	}
	delete profiles[profileId];
	saveProfiles();
	const profilePath = getProfilePath(profileId);
	if (fs.existsSync(profilePath)) {
		fs.unlinkSync(profilePath);
	}
	if (mainWindow) {
		mainWindow.webContents.send("profiles-updated", profiles);
	}
});

ipcMain.handle("check-can-modify-profile", (event) => {

	return true;
});

ipcMain.handle("load-config", () => {
	const response = {
		...config
	};
	if (config.events) response.events = config.events;
	return response;
});

ipcMain.on("load-config", (event) => {
	const response = {
		...config
	};
	if (config.events) response.events = config.events;
	event.reply("config-loaded", response);
});

ipcMain.handle("open-external", (event, url) => {
	shell.openExternal(url);
});

function broadcastConfig() {
	if (mainWindow) mainWindow.webContents.send("config-updated", config);
}




function stopOverlayServer() {
	if (overlayServer) {
		overlayServer.close(() => {
			console.log('Overlay server stopped');
		});
		overlayServer = null;
		overlayApp = null;
	}
}

function startOverlayServer() {

	stopOverlayServer();

	overlayApp = express();
	const server = http.createServer(overlayApp);
	overlayApp.use(express.json());

	overlayApp.get("/overlay", (req, res) =>
		res.sendFile(path.join(__dirname, "pages", "overlay.html"))
	);
	
	overlayApp.use(
		"/assets",
		express.static(path.join(__dirname, "pages", "assets"))
	);

	overlayApp.get("/data", (req, res) => {
		res.json({
			value: overlayServerData.lastOverlayData.value || "00:00:00",
			unit: overlayServerData.lastOverlayData.unit || "TIME",
			status: overlayServerData.lastOverlayData.status || "stopped",
			pausedText: overlayServerData.lastOverlayData.pausedText || config.overlay.pausedText || "PAUSED",
			stoppedText: overlayServerData.lastOverlayData.stoppedText || config.overlay.stoppedText || "STOPPED",
			pausedTextSize: overlayServerData.lastOverlayData.pausedTextSize || config.overlay.pausedTextSize || 48,
			pausedTextColor: overlayServerData.lastOverlayData.pausedTextColor || config.overlay.pausedTextColor || "#ffaa00",
			showValueWhenPaused: config.overlay.showValueWhenPaused !== false,
			showValueWhenStopped: config.overlay.showValueWhenStopped !== false,
			showUnitWhenPaused: config.overlay.showUnitWhenPaused !== false,
			showUnitWhenStopped: config.overlay.showUnitWhenStopped !== false,
			enableValueAnimation: config.overlay.enableValueAnimation !== false,
			animationSpeed: overlayServerData.lastOverlayData.animationSpeed || config.overlay.animationSpeed || 1000,
			gifterPosition: config.overlay.gifterPosition || "bottom-left",
			overlayPageBg: overlayServerData.lastOverlayData.overlayPageBg || config.overlay.overlayPageBg || "#000000",
			textShadow: overlayServerData.lastOverlayData.textShadow || config.overlay.textShadow || {
				enabled: true,
				x: 0,
				y: 4,
				blur: 12,
				color: "#000000"
			},
			statusTextShadow: overlayServerData.lastOverlayData.statusTextShadow || config.overlay.statusTextShadow || {
				enabled: true,
				x: 0,
				y: 4,
				blur: 12,
				color: "#000000"
			},
			gifterCard: overlayServerData.lastOverlayData.gifterCard || config.overlay.gifterCard || {
				animation: "slideUp",
				size: 100,
				bgColor: "#000000",
				borderColor: "#ffffff",
				nameSize: 12,
				nameColor: "#ffffff",
				amountSize: 13,
				amountColor: "#22c55e",
				unitSize: 8
			},
			unitPosition: overlayServerData.lastOverlayData.unitPosition || config.overlay.unitPosition || "bottom",
			unitAlignment: overlayServerData.lastOverlayData.unitAlignment || config.overlay.unitAlignment || "center",
			unitSize: overlayServerData.lastOverlayData.unitSize || config.overlay.unitSize || 24,
			unitColor: overlayServerData.lastOverlayData.unitColor || config.overlay.unitColor || "#ffffff",
			textColor: config.overlay.textColor || "#ffffff",
			fontSize: config.overlay.fontSize || 72,
			background: config.overlay.background || "transparent",
			bgColor: config.overlay.bgColor || "#000000",
			gifter: overlayServerData.lastGifterData
		});
	});

	ipcMain.on("overlay-update", (event, data) => {
		overlayServerData.lastOverlayData = {
			value: data.value || overlayServerData.lastOverlayData.value,
			unit: data.unit || overlayServerData.lastOverlayData.unit,
			status: data.status || overlayServerData.lastOverlayData.status,
			pausedText: data.pausedText,
			stoppedText: data.stoppedText,
			pausedTextSize: data.pausedTextSize,
			pausedTextColor: data.pausedTextColor,
			unitPosition: data.unitPosition,
			unitAlignment: data.unitAlignment,
			unitSize: data.unitSize,
			unitColor: data.unitColor,
			enableValueAnimation: data.enableValueAnimation,
			animationSpeed: data.animationSpeed,
			showUnitWhenPaused: data.showUnitWhenPaused,
			showUnitWhenStopped: data.showUnitWhenStopped,
			gifterPosition: data.gifterPosition,
			overlayPageBg: data.overlayPageBg,
			textShadow: data.textShadow,
			statusTextShadow: data.statusTextShadow,
			gifterCard: data.gifterCard
		};
	});

	ipcMain.on("gifter-update", (event, data) => {
		overlayServerData.lastGifterData = {
			name: data.name,
			amount: data.amount,
			unit: data.unit
		};

		if (overlayServerData.gifterDataTimeout) {
			clearTimeout(overlayServerData.gifterDataTimeout);
		}
		overlayServerData.gifterDataTimeout = setTimeout(() => {
			overlayServerData.lastGifterData = null;
		}, 5000);
	});

	server.listen(config.overlayPort, "127.0.0.1", () => {
		console.log(`Overlay server at http://localhost:${config.overlayPort}/overlay`);
	});

	overlayServer = server;
}


ipcMain.on("restart-overlay-server", (event, newPort) => {
	config.overlayPort = newPort;
	config.overlay.port = newPort;
	saveConfig();
	startOverlayServer();
	if (mainWindow) {
		mainWindow.webContents.send("overlay-server-restarted", {
			port: newPort
		});
	}
});




function createLoadingWindow() {
	loadingWindow = new BrowserWindow({
		width: 359,
		height: 400,
		frame: false,
		backgroundColor: "#0a0a0a",
		webSecurity: false,
		resizable: false,
		center: true,
		icon: path.join(__dirname, "pages", "assets", "img", "icon.png"),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
		show: false,
	});

	loadingWindow.loadFile(path.join(__dirname, "pages", "loading.html"));


	loadingWindow.webContents.once("did-finish-load", () => {
		loadingWindow.webContents.executeJavaScript(`
    if (typeof window !== 'undefined') {
      window.DEV_MODE = ${DEV_MODE};
      const statusEl = document.querySelector('.status');
      if (statusEl && window.DEV_MODE) {
        statusEl.innerHTML = 'Loading components...<br><span style="color: #53fc18; font-size: 11px; margin-top: 8px; display: block;">DEV_MODE = True</span>';
      }
    }
  `);
		loadingWindow.show();
	});

	loadingWindow.on("closed", () => {
		loadingWindow = null;
	});
}

function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		frame: false,
		backgroundColor: "#0a0a0a",
		webSecurity: false,
		icon: path.join(__dirname, "pages", "assets", "img", "icon.png"),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		},
		show: false,
	});


	const showMainWindow = () => {
		if (loadingWindow) {
			setTimeout(() => {
				loadingWindow.close();
				mainWindow.show();
			}, 500);
		} else {
			mainWindow.show();
		}
	};

	mainWindow.loadFile(path.join(__dirname, "pages", "index.html"));
	mainWindow.webContents.once("did-finish-load", () => {
		mainWindow.webContents.executeJavaScript(`
			if (typeof window !== 'undefined') {
				window.DEV_MODE = ${DEV_MODE};
			}
		`);
		showMainWindow();
	});

	// Handle external links - open in default browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});

	// Prevent navigation to external URLs
	mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
		const parsedUrl = new URL(navigationUrl);
		if (parsedUrl.origin !== `file://${__dirname.replace(/\\/g, "/")}`) {
			event.preventDefault();
			shell.openExternal(navigationUrl);
		}
	});

	ipcMain.on("window-minimize", () => mainWindow.minimize());
	ipcMain.on("window-maximize", () => {
		if (mainWindow.isMaximized()) mainWindow.unmaximize();
		else mainWindow.maximize();
	});
	ipcMain.on("window-close", () => mainWindow.close());

	mainWindow.on("maximize", () => mainWindow.webContents.send("window-maximized"));
	mainWindow.on("unmaximize", () => mainWindow.webContents.send("window-unmaximized"));
}

app.whenReady().then(() => {
	dataDir = path.join(app.getPath("userData"), "data");
	profilesDir = path.join(dataDir, "profiles");
	if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, {
		recursive: true
	});
	if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, {
		recursive: true
	});
	loadProfiles();
	loadConfig();
	startOverlayServer();

	createLoadingWindow();

	createMainWindow();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createLoadingWindow();
		createMainWindow();
	}
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});