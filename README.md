# Simple Overlay Timer

A lightweight, customizable overlay timer application built with Tauri v2, React, and TypeScript. Perfect for gaming, productivity, and any scenario where you need visual timers that don't interfere with your workflow.

## Features

- 🎯 **Multiple Timers**: Create and manage multiple independent timers
- ⌨️ **Global Shortcuts**: Start timers with customizable keyboard shortcuts (works even in games)
- 🎨 **Customizable Appearance**: Choose colors, icons, and display modes
- 📍 **Multi-Monitor Support**: Position timers on any monitor with preset or custom positions
- 🔔 **Notifications**: Get notified when timers complete (Windows notifications + sound)
- 🎮 **Game-Friendly**: Low-level keyboard hooks ensure shortcuts work in fullscreen games
- 🔄 **Reset All**: Quickly reset all running timers with a single shortcut or tray menu option

## Installation

### Windows

Download the latest release from the [Releases](https://github.com/LucasHenriqueDiniz/simple-overlay-timer/releases) page and run the installer.

## Usage

1. **Configure Timers**: Right-click the tray icon and select "Settings"
2. **Add Timers**: Click "Add New Icon" to create a new timer
3. **Set Shortcuts**: Configure keyboard shortcuts for each timer (must include Alt, Ctrl, Shift, or Meta)
4. **Position Overlay**: Choose monitor and position (preset corners or custom)
5. **Start Timers**: Press your configured shortcuts to start timers
6. **Reset All**: Use the tray menu or configured shortcut to reset all timers

## Development

### Prerequisites

- Node.js 18+ and npm
- Rust (latest stable)
- Windows SDK (for Windows builds)

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Building

The application uses Tauri v2 for cross-platform desktop builds. Builds are automatically created via GitHub Actions on every release tag.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
