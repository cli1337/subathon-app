# Subathon App

A powerful Electron-based subathon application supporting multiple streaming platforms including Twitch and KICK, with fully customizable metric tracking, real-time event detection, and beautiful overlay displays.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Electron](https://img.shields.io/badge/electron-39.2.6-47848F.svg)

## Features

### 🎮 Multi-Platform Support
- **Kick.com Integration**: Real-time websocket connection to Kick chatrooms for subscription and gift subscription events
- **Twitch Integration**: IRC-based connection to Twitch channels for subscription and gift subscription events
- **Connection Status Indicators**: Visual indicators showing websocket connection status for each platform
- **Platform Switcher**: Animated UI to switch between platform configurations

### ⏱️ Flexible Metric Tracking
- **Multiple Metric Types**: 
  - Time-based tracking (seconds, hours, minutes)
  - Distance-based tracking (meters, kilometers)
  - Custom unit tracking
- **Configurable Event Values**: Set custom values for subscriptions, gifts, bits, donations, and follows
- **Real-time Updates**: Live value updates as events are detected

### 🎨 Customizable Overlay
- **Web-based Overlay**: Accessible via localhost for OBS integration
- **Fully Customizable**: 
  - Font size, colors, and positioning
  - Unit display (prefix/suffix)
  - Background and text shadows
  - Paused/stopped state displays
  - Gifter card animations and styling
- **Multiple Animation Options**: Slide-up, fade, and more for gifter cards

### 📊 Dashboard & Analytics
- **Real-time Statistics**: Total events, value added, current metric value
- **Event History**: Recent events list with platform indicators
- **Profile Management**: Multiple profiles for different subathon sessions
- **Metrics Configuration**: Easy setup for different metric types

### ⚙️ Advanced Features
- **Reducer System**: Automatic value reduction over time
- **Manual Event Entry**: Add custom events manually
- **Auto-save**: Automatic configuration saving
- **Keyboard Navigation**: Tab key to navigate between sidebar sections
- **External Link Handling**: All links open in default browser

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/cli1337/subathon-app.git
cd subathon-app
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the application:
```bash
npm start
```

## Configuration

### Kick Platform Setup

1. Navigate to the **Platforms** page
2. Click on the **Kick** tab
3. Enter your Kick username
4. Click "Get Chatroom ID" to open the Kick API
5. Copy the `id` field from the JSON response
6. Paste it into the "Chatroom ID" field
7. Click "Save Configuration"

The app will automatically connect to your Kick chatroom and start detecting subscription events.

### Twitch Platform Setup

1. Navigate to the **Platforms** page
2. Click on the **Twitch** tab
3. Enter your Twitch username
4. Generate an OAuth token at [twitchtokengenerator.com](https://twitchtokengenerator.com/)
   - Make sure to include the `chat:read` scope
5. Paste the OAuth token (should start with `oauth:`)
6. Enter the channel name (usually same as username)
7. Click "Save Configuration"

The app will automatically connect to your Twitch channel via IRC and start detecting subscription events.

### Overlay Setup

1. Navigate to the **Overlay** page
2. Configure your overlay settings:
   - Font size, colors, and positioning
   - Unit display options
   - Background settings
   - Gifter card styling
3. The overlay will be available at `http://localhost:55814/overlay` (or your configured port)
4. Add this URL as a Browser Source in OBS

## Usage

### Starting a Subathon

1. Configure your platforms (Kick and/or Twitch)
2. Set your metric type and initial value in the **Metrics** page
3. Configure event values in the **Dashboard**
4. Click **Start** to begin tracking
5. Events will automatically be detected and added to your subathon

### Pausing/Resuming

- Click **Pause** to temporarily pause the timer
- Click **Resume** to continue from where you left off
- The overlay will display "PAUSED" when paused

### Resetting

- Click **Reset** to clear all events and reset the value to 0
- This will clear your event history

### Reducer

Enable the reducer to automatically decrease your metric value over time:
1. Navigate to the **Reducer** page
2. Enable the reducer
3. Set the amount per second to reduce
4. The reducer only runs when the subathon is active and not paused

## Project Structure

```
subathon-app/
├── main.js                 # Electron main process
├── preload.js             # Preload script
├── package.json           # Project dependencies and scripts
├── pages/
│   ├── index.html         # Main application window
│   ├── overlay.html       # Overlay page
│   ├── loading.html       # Loading screen
│   ├── assets/
│   │   ├── css/          # Stylesheets
│   │   ├── js/           # JavaScript modules
│   │   └── img/          # Images and icons
│   └── partials/         # Page partials
├── scripts/              # Utility scripts
└── README.md            # This file
```

## Development

### Running in Development Mode

```bash
npm start
```

### Building for Production

Build installers for distribution:

```bash
# Install electron-builder (first time only)
npm install --save-dev electron-builder

# Build for current platform
npm run build

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux   # Linux

# Build for all platforms
npm run build:all
```

Built installers will be in the `dist/` directory.

See [BUILD.md](BUILD.md) for detailed build instructions.

## Keyboard Shortcuts

- **Tab**: Navigate to next sidebar section
- **Shift+Tab**: Navigate to previous sidebar section
- **Ctrl+C**: Copy
- **Ctrl+V**: Paste
- **Ctrl+T**: Add test event (development)

## Troubleshooting

### Connection Issues

- **Kick not connecting**: 
  - Verify your Chatroom ID is correct
  - Check that the Pusher region matches your location
  - Ensure your Kick channel is live

- **Twitch not connecting**:
  - Verify your OAuth token is valid and includes `chat:read` scope
  - Check that your channel name is correct
  - Ensure your Twitch channel is live

### Overlay Not Showing

- Verify the overlay port is not blocked by firewall
- Check that the overlay URL is correct in OBS
- Ensure the subathon is running

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

**cliquant**

- GitHub: [@cli1337](https://github.com/cli1337)

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Uses [Express](https://expressjs.com/) for overlay server
- WebSocket support via [ws](https://github.com/websockets/ws)

## Changelog

### Version 1.0.0
- Initial release
- Kick platform support with websocket connection
- Twitch platform support with IRC connection
- Customizable overlay system
- Multiple metric types (time, distance, custom)
- Profile management
- Reducer system
- Real-time event tracking

---

For more information, visit the [GitHub repository](https://github.com/cli1337/subathon-app).

