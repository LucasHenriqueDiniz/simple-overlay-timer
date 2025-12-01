# TODO - Future Features

## Bugs & Regressions

- **Overlay jumps to main monitor after editing a timer**
  - Reproduce: configure overlay on secondary monitor → edit timer → overlay snaps back to primary
  - Desired: keep stored monitor/corner position when updating timers

## High Priority Features

- **Rename config `icons` → `timers`**

  - Update types, persistence, migration helpers, and UI copy

- **Quick Create Timer flow**
  - Fast path to spawn a temporary timer without full modal
  - Ideas: tray shortcut, global hotkey dialog, or context action on overlay

## Medium Priority / UX Improvements

- **Resume timers after restart**

  - Persist running timer state (start time, remaining, repeat/interval info)
  - On launch, calculate remaining time and resume automatically

- **Pause/Resume support**

  - Toggle pause with same key
  - Store elapsed time and resume accurately

- **Timer history & stats**

  - Usage counts, total tracked time, last-run list
  - Export data (CSV/JSON)

- **Custom sound notifications**

  - Upload user audio, select multiple sound options, preview, per-timer volume

- **Visual customization**

  - Overlay opacity, size scaling, font size, themes, animations

- **Timer preset library**

  - Bundled presets (Pomodoro, raid timers, cooking, exercise, meditation)
  - Easy way to add/share community presets

- **Import / Export configuration**

  - Backup/restore, share configs, migrate between machines

- **Advanced timer behaviors**

  - Warnings at X seconds, multi-phase timers, groups, dependencies

- **UI / UX polish**

  - Drag-and-drop ordering, templates/gallery, search/filter, keyboard navigation
  - Tooltips/help text, richer onboarding/walkthrough

- **Overlay filtering**

  - Option to hide timers that are idle/paused from the overlay
  - Configurable toggle per user, surfaces only active timers when enabled

- **Performance & QoL**

  - Launch minimized to tray, auto-start with Windows, update checker
  - Better logging/reporting, performance profiling
  - Research Windows code signing: certificate purchase, signtool pipeline, secret storage, to eliminate SmartScreen warnings

## Implementation Ideas (scratchpad)

- **Quick Create Timer**

  - Tray “Quick Timer…” → duration input → temporary timer
  - Global shortcut (e.g. `Ctrl+Shift+T`) toggles quick timer dialog
  - Overlay right-click → “Add Quick Timer”

- **Repeat Timer Enhancements**

  - Add explicit `repeat` flag + indicator
  - Stop repeat with same shortcut or stop action

- **Pause/Resume Mechanics**
  - `paused` state storing elapsed time
  - Visual pause indicator in overlay

## Notes

- Quick timers could save into config or exist ephemerally
- Repeat timers must honor original duration and optionally cap repeat count
- Presets should stay accessible without cluttering UI
- Custom audio should support common formats (mp3, wav, ogg)

## Release Roadmap

- **v0.1.4 – Persistent Timers**

  - Save running timer state (duration, elapsed, repeat/interval progress) before exit
  - On restart, restore timers where they left off and continue countdowns/intervals

- **v0.1.5 – Alarm Mode**
  - Allow timers to behave like alarms (trigger at specific clock times)
  - Optional recurring alarms (daily/weekly), custom sounds, and snooze actions
