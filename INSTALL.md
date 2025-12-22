# Installation Guide for Users

## Download

Download the latest release from:
**https://github.com/cli1337/subathon-app/releases**

Choose the installer for your operating system:

### Windows
- **Installer**: `Subathon App-X.X.X-x64.exe` (recommended)
  - Double-click to install
  - Follow the installation wizard
  - Creates desktop and start menu shortcuts
  
- **Portable**: `Subathon App-X.X.X-x64.exe` (portable version)
  - No installation required
  - Extract and run directly
  - Good for USB drives

### macOS
- **Disk Image**: `Subathon App-X.X.X-x64.dmg`
  1. Download the .dmg file
  2. Double-click to open
  3. Drag Subathon App to Applications folder
  4. Open from Applications (may need to allow in Security settings)

- **ZIP Archive**: `Subathon App-X.X.X-x64.zip`
  1. Download and extract
  2. Move to Applications folder
  3. Open from Applications

### Linux
- **AppImage** (recommended): `Subathon App-X.X.X-x86_64.AppImage`
  1. Download the AppImage
  2. Make it executable: `chmod +x Subathon\ App-*.AppImage`
  3. Double-click to run (or run from terminal)

- **Debian/Ubuntu**: `Subathon App-X.X.X-amd64.deb`
  1. Download the .deb file
  2. Install: `sudo dpkg -i Subathon\ App-*.deb`
  3. Launch from applications menu

- **Fedora/RHEL**: `Subathon App-X.X.X-x86_64.rpm`
  1. Download the .rpm file
  2. Install: `sudo rpm -i Subathon\ App-*.rpm`
  3. Launch from applications menu

## System Requirements

### Windows
- Windows 10 or later (64-bit)
- 100MB free disk space

### macOS
- macOS 10.13 or later
- 100MB free disk space

### Linux
- Most modern distributions (Ubuntu 18.04+, Fedora 28+, etc.)
- 100MB free disk space

## First Launch

1. Launch Subathon App
2. Configure your platform (Kick or Twitch) - see [QUICKSTART.md](QUICKSTART.md)
3. Set up your metrics
4. Configure the overlay for OBS
5. Start your subathon!

## Updating

1. Download the latest release
2. Install over the existing installation (Windows/macOS)
3. Or replace the AppImage (Linux)

Your settings and profiles are saved separately and will be preserved.

## Uninstalling

### Windows
- Go to Settings → Apps → Subathon App → Uninstall
- Or use Control Panel → Programs and Features

### macOS
- Drag Subathon App from Applications to Trash
- Empty Trash

### Linux
- **Debian/Ubuntu**: `sudo apt remove subathon-app`
- **Fedora/RHEL**: `sudo rpm -e subathon-app`
- **AppImage**: Just delete the file

## Troubleshooting

### App Won't Start

- Make sure you have the latest version
- Check system requirements
- Try running from terminal/command prompt to see error messages
- Check antivirus isn't blocking the app

### Overlay Not Working

- Make sure the app is running
- Check the overlay port in settings (default: 55814)
- Verify firewall isn't blocking the port
- Try accessing `http://localhost:55814/overlay` in a browser

### Platform Connection Issues

- See the main [README.md](README.md) troubleshooting section
- Verify your platform credentials are correct
- Check that your channel is live

## Getting Help

- Check the [README.md](README.md) for documentation
- See [QUICKSTART.md](QUICKSTART.md) for setup guide
- Open an [issue](https://github.com/cli1337/subathon-app/issues) on GitHub

