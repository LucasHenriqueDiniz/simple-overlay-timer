# Overlay Timer

Overlay Timer is a lightweight, customizable timer/stopwatch overlay built with **Tauri v2**, **React 19**, and **TypeScript**. It stays on top of your games or work apps and gives you visual feedback, sounds, and notifications without breaking focus.

## Features

- 🎯 **Multiple Timers & Stopwatches** – each with its own icon, color, and shortcut
- 👋 **Welcome Tour** – guides first-time users through creating their first timer
- ⌨️ **Global Shortcuts** – low-level hook keeps shortcuts working even in fullscreen games
- 🔁 **Repeats & Intervals** – countdowns can auto-repeat, with optional interval notifications
- 🍅 **Pomodoro Presets** – two ready-to-use presets plus your own preset library
- 🔔 **Flexible Notifications** – system toast, sound, or both; custom text per timer/interval
- 🎨 **Customizable Overlay** – monitor selection, corner presets, compact mode, colors
- 🕹️ **Game-Friendly Reset** – default `Ctrl+Alt+P` resets everything (configurable)

## Screenshots

![Settings window](.github/assets/config-screen.png)

![Overlay timers](.github/assets/overlay.png)

## Download

Grab the latest Windows installer from the [Releases page](https://github.com/LucasHenriqueDiniz/simple-overlay-timer/releases) and run it. The app lives in the tray and automatically keeps your previous configuration.

## Usage

1. **Open Settings** – right-click the tray icon → “Settings”.
2. **Create timers** – choose countdown or stopwatch, icon, duration, repeats, intervals, and notifications.
3. **Assign shortcuts** – timer shortcuts need at least one modifier (Alt/Ctrl/Shift/Meta).
4. **Use presets** – the Keybinds tab includes Pomodoro focus/break presets; edit or create your own.
5. **Start timers** – press the shortcut or click “Play” in the Timers tab. Tap again to restart; hold for stopwatch reset.
6. **Reset all** – tray menu or the global reset shortcut stops every timer at once.

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

For packaging/distribution details, check [`DISTRIBUTION.md`](DISTRIBUTION.md).

## Roadmap

Planned work and upcoming releases live in [`TODO.md`](TODO.md).

## License

Released under the [MIT License](LICENSE).

## Contributing

Issues and PRs are welcome. If you build a cool preset or find a bug, open a ticket so we can keep improving the overlay. Thanks!
