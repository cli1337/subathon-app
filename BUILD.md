# Building and Distributing Subathon App

This guide explains how to build installers for Windows, macOS, and Linux.

## Prerequisites

1. Install electron-builder:
```bash
npm install --save-dev electron-builder
```

2. Make sure you have the icon file at: `pages/assets/img/icon.png`
   - Recommended sizes: 256x256, 512x512, 1024x1024
   - Formats: PNG or ICO (Windows), PNG or ICNS (macOS), PNG (Linux)

## Building Locally

### Build for Current Platform

```bash
npm run build
```

This will build an installer for your current operating system.

### Build for Specific Platform

```bash
# Windows (creates .exe installer and portable)
npm run build:win

# macOS (creates .dmg and .zip)
npm run build:mac

# Linux (creates AppImage, .deb, and .rpm)
npm run build:linux
```

### Build for All Platforms

```bash
npm run build:all
```

**Note**: Building for macOS on Windows/Linux requires a Mac. Building for Windows on macOS/Linux is possible but may have limitations.

## Output

Built installers will be in the `dist/` directory:

### Windows
- `Subathon App-1.0.0-x64.exe` - NSIS installer (64-bit)
- `Subathon App-1.0.0-ia32.exe` - NSIS installer (32-bit)
- `Subathon App-1.0.0-x64.exe` - Portable version (64-bit)

### macOS
- `Subathon App-1.0.0-x64.dmg` - Disk image
- `Subathon App-1.0.0-x64.zip` - ZIP archive

### Linux
- `Subathon App-1.0.0-x86_64.AppImage` - AppImage (portable)
- `Subathon App-1.0.0-amd64.deb` - Debian package
- `Subathon App-1.0.0-x86_64.rpm` - RPM package

## Automated Builds with GitHub Actions

When you push a tag (e.g., `v1.0.1`), GitHub Actions will automatically:

1. Build installers for Windows, macOS, and Linux
2. Create a GitHub release
3. Attach all installers to the release

### Steps:

1. Update version and create tag:
```bash
npm run version:patch
# or
npm run version:minor
# or
npm run version:major
```

2. Push the tag (already done by the script):
```bash
git push --tags
```

3. GitHub Actions will automatically:
   - Build installers for all platforms
   - Create a release
   - Upload installers as release assets

4. Users can download installers from:
   - https://github.com/cli1337/subathon-app/releases

## Manual Release Process

If you prefer to build manually and upload:

1. Build locally:
```bash
npm run build:all
```

2. Create a GitHub release:
   - Go to https://github.com/cli1337/subathon-app/releases
   - Click "Draft a new release"
   - Select your tag
   - Upload files from `dist/` directory
   - Publish

## Code Signing (Optional)

For production releases, you may want to code sign your applications:

### Windows
- Requires a code signing certificate
- Add to `package.json`:
```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "password"
}
```

### macOS
- Requires Apple Developer account
- Add to `package.json`:
```json
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

### Linux
- Usually not required, but you can sign AppImages

## Troubleshooting

### Build Fails

- Make sure all dependencies are installed: `npm install`
- Check that the icon file exists at the specified path
- Ensure you have enough disk space
- On Windows, you may need to install NSIS

### macOS Build on Non-Mac

- You cannot build macOS installers on Windows/Linux
- Use GitHub Actions or a Mac for macOS builds

### Large File Sizes

- Electron apps are typically 100-200MB
- This is normal due to bundled Chromium and Node.js
- Consider using compression or code splitting if needed

## Configuration

Build configuration is in `package.json` under the `"build"` key. You can customize:

- App ID and product name
- Icon paths
- Installer options
- File inclusions/exclusions
- Platform-specific settings

See [electron-builder documentation](https://www.electron.build/) for more options.

