# Control Center for GNOME

A macOS-inspired GNOME Shell extension with individually blurred Liquid Glass pills.

> **Status:** Early MVP. The initial panel UI and per-pill Blur my Shell hooks are in place. System-control integrations are not implemented yet, and the extension has not yet been runtime-tested on a GNOME desktop.

## Vision

Bring the convenience and visual language of macOS Control Center to GNOME Shell while keeping the experience native to the desktop.

The outer popup is only a layout container. **Each pill is its own Blur my Shell target** so the blur follows the pill's own rounded corners and leaves the gaps between pills visually clear.

## Current UI

The first UI scaffold includes:

- A panel indicator that opens the Control Center popup.
- Wi-Fi and Bluetooth tiles.
- A media-player preview tile.
- Airplane Mode and Focus tiles.
- Display and Sound placeholder tiles.
- Separate `bms-popup-blur-target` classes on each pill surface.

The tiles are currently visual placeholders. They do not yet read or change Wi-Fi, Bluetooth, airplane mode, media, brightness, or volume system state.

## Liquid Glass and Blur my Shell

[Blur my Shell](https://github.com/aunetx/blur-my-shell) is the optional blur provider.

The extension integration guide documents the `bms-popup-blur-target` class. This project applies that class to **each individual pill surface**, not to the popup root:

- Every pill/card that should be blurred gets `bms-popup-blur-target`.
- The pill's own `border-radius` defines its blur boundary.
- The popup root is a transparent layout shell, not a single blur surface.
- When Blur my Shell is unavailable, the CSS provides a translucent fallback for each pill.

See the official [Blur my Shell extension integration guide](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md).

## Requirements

- GNOME Shell **49** (initial development target).
- Blur my Shell is optional, but required for the intended dynamic blur effect.
- A GNOME session in which extensions can be enabled.

The `shell-version` metadata currently declares GNOME Shell 49 only. Broader version support should be added only after testing.

## Install for development

Clone the repository:

```bash
git clone https://github.com/abazic/Control-Center-for-GNOME.git
cd Control-Center-for-GNOME
```

Package and install the extension:

```bash
gnome-extensions pack --force --out-dir=dist .
gnome-extensions install --force dist/control-center@abazic.github.io.shell-extension.zip
gnome-extensions enable control-center@abazic.github.io
```

If the extension does not appear immediately, log out and back in (especially on Wayland), then enable it from GNOME Extensions.

To inspect extension errors:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

## Roadmap

### 1. Foundation and UI

- [x] Add GNOME extension metadata and ES module entry point.
- [x] Add a panel indicator and Control Center popup.
- [x] Build the initial macOS-inspired pill layout.
- [x] Add individual `bms-popup-blur-target` classes to pill surfaces.
- [ ] Runtime-test on GNOME Shell 49.
- [ ] Verify independent blur on every pill with Blur my Shell enabled.
- [ ] Verify the translucent fallback without Blur my Shell.

### 2. System controls

- [ ] Read and toggle Wi-Fi state.
- [ ] Read and toggle Bluetooth state.
- [ ] Implement Airplane Mode where supported.
- [ ] Integrate MPRIS media playback controls.
- [ ] Integrate Focus / Do Not Disturb.
- [ ] Connect Display brightness control.
- [ ] Connect Sound volume and output controls.
- [ ] Add a shortcut to GNOME Settings.

### 3. Polish and compatibility

- [ ] Add interaction states, transitions, and accessibility support.
- [ ] Handle unavailable services and hardware safely.
- [ ] Test performance and memory cleanup.
- [ ] Test additional GNOME Shell versions before declaring support.
- [ ] Add screenshots and release packaging.

## Project structure

```text
.
├── extension.js    # GNOME Shell extension entry point and popup UI
├── metadata.json   # Extension metadata and supported Shell version
├── stylesheet.css  # Liquid Glass pill styling
└── README.md
```

## Contributing

Issues and pull requests are welcome. When reporting a bug, include:

- GNOME Shell version.
- Wayland or X11 session.
- Whether Blur my Shell is installed and enabled.
- Relevant GNOME Shell log output.

Please do not mark a feature complete until it is implemented and tested on a real GNOME session.

## Credits

- [Blur my Shell](https://github.com/aunetx/blur-my-shell) — optional blur engine and per-surface integration.
- macOS Control Center — visual reference for the layout and interaction concept.

## License

No license has been selected yet. Licensing information will be added once the project license is chosen.
