# Control Center for GNOME

A macOS-inspired Control Center for GNOME Shell, built around compact **Liquid Glass-style tiles** with optional per-tile blur through Blur my Shell.

The extension adds its own panel indicator and popup. It provides custom controls for common system settings while continuing to use GNOME's system services.

> **Development status:** The UI and system integrations are implemented in source. The primary development environment is GNOME Shell 51.1 on CachyOS / Wayland. Runtime compatibility across the full metadata version range has not yet been verified. Please report the GNOME Shell version and session type with any bug report.

## Features

### System controls

- **Wi-Fi**
  - Toggle wireless networking on or off.
  - Open the available network list from the Wi-Fi tile.
  - Network selection and authentication are handled by GNOME / NetworkManager; this extension does not collect or store Wi-Fi passwords.
- **Bluetooth**
  - Toggle the Bluetooth adapter on or off.
  - Open the Bluetooth device menu.
- **Airplane Mode**
  - Turn off Wi-Fi, WWAN (when exposed by NetworkManager), and Bluetooth together.
  - Restore the radio states that were active before Airplane Mode was enabled.
- **Focus / Do Not Disturb**
  - Toggle notification banners through the `org.gnome.desktop.notifications` GSettings schema.
- **Display**
  - Adjust display brightness using GNOME Shell's `Main.brightnessManager.globalScale` API (GNOME 49+).
- **Sound**
  - Adjust the default output volume and toggle mute.
  - Open GNOME's sound-output menu to choose an output device.
  - Audio control uses GVC and works with the PulseAudio-compatible audio server, including PipeWire-Pulse.
- **Power Mode**
  - Open GNOME's native power-profile menu. Available profiles depend on the hardware and system configuration.

### Media player

- Detects MPRIS media players on the session D-Bus.
- Shows the active player's track title and artist.
- Provides previous, play / pause, and next controls when supported by the player.

### Optional extension integrations

- **Mirror** — opens the device menu supplied by the [Mirror GNOME extension](https://extensions.gnome.org/extension/9053/mirror/) (`mirror@distro.com`).
- **Caffeine** — opens the timer menu supplied by the [Caffeine GNOME extension](https://extensions.gnome.org/extension/517/caffeine/) (`caffeine@patapon.info`) and reflects its enabled state.

Mirror and Caffeine are not bundled with this project. Install and enable them separately to use their shortcuts. If an integration is unavailable, its menu cannot be opened.

### Additional Quick Settings tiles

When the custom Control Center popup is open, the extension can discover eligible third-party toggle items from GNOME's native Quick Settings grid and display them as additional tiles. This depends on GNOME Shell's internal Quick Settings objects and is therefore version-sensitive.

### Appearance and preferences

- A macOS-inspired popup with separate rounded tile surfaces.
- Optional per-tile blur integration using the `bms-popup-blur-target` class.
- Translucent CSS fallback styling when Blur my Shell is not installed or not providing blur.
- Preferences let you choose **Small**, **Medium**, or **Large** sizes independently for Wi-Fi, Bluetooth, Airplane Mode, Focus, Mirror, and Caffeine tiles.
  - Small: 60 × 60 px
  - Medium: 130 × 60 px
  - Large: 130 × 130 px
- The Media Player tile currently stays at Large size.
- The **Kunci Quick Settings bawaan** preference locks the native Quick Settings menu while this extension is enabled. The native panel icon remains visible, but its menu cannot be opened. Turn the preference off to restore the native menu.

## Blur my Shell integration

[Blur my Shell](https://github.com/aunetx/blur-my-shell) is an optional blur provider.

Each tile surface receives its own `bms-popup-blur-target` class rather than applying the class only to the outer popup. This lets Blur my Shell follow each tile's rounded corners while preserving the gaps between tiles.

The outer popup remains a transparent layout container. Without Blur my Shell, each tile uses the extension's translucent CSS background.

The integration follows the [Blur my Shell extension integration guide](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md).

## Compatibility and limitations

- `metadata.json` currently declares GNOME Shell versions **45–51**. This is a declared compatibility range, not a statement that every version has been tested.
- The main development target is **GNOME Shell 51.1 on CachyOS / Wayland**.
- Brightness control depends on GNOME Shell's brightness manager and is implemented for GNOME 49+.
- Wi-Fi requires NetworkManager; Bluetooth requires BlueZ; audio requires GVC and a compatible audio server; media controls require an MPRIS-compatible player.
- Some menus and integrations use GNOME Shell internal objects, including Quick Settings toggle objects and `Main.extensionManager`. These are not stable public APIs and may change between GNOME releases.
- Locking the native Quick Settings menu does not guarantee that every keyboard shortcut or other Shell entry point that can open native Quick Settings is intercepted.
- Third-party Quick Settings tiles are discovered dynamically and may not all be compatible with this custom interface.
- System-state synchronization is implemented through service and settings signals, but should be tested on the GNOME version and hardware you use.

## Installation from source

### Requirements

- GNOME Shell with the `gnome-extensions` command-line utility.
- `glib-compile-schemas` (for the GSettings schema).
- NetworkManager for Wi-Fi, BlueZ for Bluetooth, and GVC / a PulseAudio-compatible server for audio controls.
- [Blur my Shell](https://extensions.gnome.org/extension/)
  is optional and only needed for the blur effect.

### Build and install

Clone the repository and package the extension:

```bash
git clone https://github.com/abazic/Control-Center-for-GNOME.git
cd Control-Center-for-GNOME

glib-compile-schemas schemas/

mkdir -p dist
gnome-extensions pack --force \
  --extra-source=control-center-symbolic.svg \
  --out-dir=dist .

gnome-extensions install --force \
  dist/control-center@abazic.github.io.shell-extension.zip

gnome-extensions enable control-center@abazic.github.io
```

After installation, the Control Center icon should appear in the GNOME top panel. Select it to open the popup.

If the extension was installed previously, install the newly built ZIP again so the installed copy contains the latest files. On Wayland, log out and log back in if GNOME Shell does not reload the extension.

### Verify the installation

```bash
gnome-extensions list --enabled
gnome-extensions info control-center@abazic.github.io
gnome-shell --version
```

To follow GNOME Shell logs while testing:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

If Preferences reports that a GSettings key is missing, verify that the installed extension contains the schema XML and that the schema is compiled:

```bash
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/control-center@abazic.github.io"
glib-compile-schemas "$EXT_DIR/schemas/"
```

Then log out and back in so GNOME Shell reloads the installed extension and its schema.

## Project structure

```text
.
├── extension.js
├── system.js
├── media.js
├── prefs.js
├── schemas/
│   └── org.gnome.shell.extensions.control-center.gschema.xml
├── metadata.json
├── stylesheet.css
├── control-center-symbolic.svg
└── README.md
```

- `extension.js` — panel indicator, popup UI, tile layout, and GNOME Shell integrations.
- `system.js` — system settings and controls for networking, Bluetooth, brightness, notifications, and audio.
- `media.js` — MPRIS player discovery and playback controls.
- `prefs.js` and `schemas/` — extension preferences and their GSettings schema.
- `stylesheet.css` — popup and tile styling.

## Contributing

Bug reports and pull requests are welcome.

When reporting a problem, include:

- GNOME Shell version (`gnome-shell --version`)
- Distribution and session type (Wayland or X11)
- Whether Blur my Shell is installed and enabled
- Whether Mirror or Caffeine is installed and enabled, if the issue involves either integration
- Relevant GNOME Shell logs

Please test changes on a real GNOME session and make sure objects, signal handlers, and GLib sources are cleaned up when the extension is disabled.

## Credits

- [Blur my Shell](https://github.com/aunetx/blur-my-shell) — optional blur provider and per-surface integration reference.
- macOS Control Center — visual design reference.

## License

This project is licensed under the **GNU General Public License v3.0 or later** (`GPL-3.0-or-later`). You may use, study, modify, and redistribute the software under the terms of that license. See the [LICENSE](LICENSE) file for the complete license text.

The license applies to the project's original code. Third-party components, assets, and code remain subject to their respective licenses and attribution requirements.
