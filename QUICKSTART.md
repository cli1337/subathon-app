# Quick Start Guide

Get up and running with Subathon App in minutes!

## Installation

```bash
# Clone the repository
git clone https://github.com/cli1337/subathon-app.git
cd subathon-app

# Install dependencies
npm install

# Start the app
npm start
```

## First Time Setup

### 1. Configure a Platform

Choose either Kick or Twitch (or both):

#### Kick Setup
1. Go to **Platforms** → **Kick** tab
2. Enter your Kick username
3. Click "Get Chatroom ID"
4. Copy the `id` from the JSON response
5. Paste it into "Chatroom ID"
6. Click "Save Configuration"

#### Twitch Setup
1. Go to **Platforms** → **Twitch** tab
2. Enter your Twitch username
3. Get an OAuth token from [twitchtokengenerator.com](https://twitchtokengenerator.com/)
   - Make sure to include `chat:read` scope
4. Paste the token (starts with `oauth:`)
5. Enter channel name
6. Click "Save Configuration"

### 2. Configure Metrics

1. Go to **Metrics** page
2. Choose your metric type:
   - **Time**: Track in seconds/hours
   - **Distance**: Track in meters/kilometers
   - **Custom**: Define your own unit
3. Set your starting value
4. Configure event values in **Dashboard**

### 3. Set Up Overlay (for OBS)

1. Go to **Overlay** page
2. Customize the appearance:
   - Font size and color
   - Position and alignment
   - Background settings
3. Copy the overlay URL (default: `http://localhost:55814/overlay`)
4. In OBS, add a **Browser Source** with this URL

### 4. Start Your Subathon!

1. Go to **Dashboard**
2. Click **Start**
3. Events will automatically be detected and added
4. Your overlay will update in real-time

## Tips

- **Pause/Resume**: Use the pause button to temporarily stop tracking
- **Reset**: Clear all events and start fresh
- **Reducer**: Enable in the Reducer page to automatically decrease value over time
- **Profiles**: Create different profiles for different subathon sessions

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Open an [issue](https://github.com/cli1337/subathon-app/issues) on GitHub

Happy streaming! 🎉

