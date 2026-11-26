# Control Center for GNOME

A macOS-inspired GNOME Shell extension with individually blurred Liquid Glass pills.

> **Status:** Front-end MVP scaffold. The panel indicator and popup UI are implemented in source. Runtime behavior still needs testing on a real GNOME session. System controls are visual placeholders.

## What is implemented

- Panel indicator to open the Control Center.
- macOS-inspired compact popup layout.
- Separate pill surfaces for Wi-Fi, Bluetooth, media, Airplane Mode, Focus, Display, and Sound.
- Each pill has its own `bms-popup-blur-target` class.
- Transparent popup/layout shell with a translucent fallback style on individual pills.
- GNOME Shell ES module extension structure.

## Important: per-pill blur

[Blur my Shell](https://github.com/aunetx/blur-my-shell) is the optional blur provider.

The extension integration guide documents `bms-popup-blur-target`. This class is applied to **each individual pill**, never just to the outer popup. Blur my Shell follows each pill's own `border-radius`, leaving the gaps between pills visually distinct.

The popup itself is a transparent layout container. Without Blur my Shell, each pill retains a translucent CSS fallback.

Official reference: [Blur my Shell extension integration guide](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md).

## Compatibility

The metadata currently allows installation on GNOME Shell 45–50. This is an initial compatibility range to avoid blocking installation on common ES-module-based GNOME releases; it is **not a claim that every version has been runtime-tested**. The initial development target remains GNOME Shell 49.

## Install from source

```bash
git clone https://github.com/abazic/Control-Center-for-GNOME.git
cd Control-Center-for-GNOME

gnome-extensions pack --force --out-dir=dist .
gnome-extensions install --force dist/control-center@abazic.github.io.shell-extension.zip
gnome-extensions enable control-center@abazic.github.io
```

After installation, the **Control Center grid icon should appear in the GNOME top panel**. Click it to open the popup.

If the extension was installed before this update, reinstall the newly packaged ZIP so that the updated metadata and code replace the old copy. On Wayland, log out and log back in if GNOME Shell does not reload the extension.

Check whether GNOME sees the extension:

```bash
gnome-extensions list --enabled
gnome-extensions info control-center@abazic.github.io
```

Inspect Shell errors:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

If it does not appear or fails to enable, include the output of the commands above and:

```bash
gnome-shell --version
```

## Roadmap

### Front end

- [x] Add extension metadata and ES module entry point.
- [x] Add top-panel indicator and popup.
- [x] Build the first Control Center pill layout.
- [x] Assign a separate Blur my Shell target to every pill.
- [x] Add transparent popup shell and translucent pill fallback.
- [ ] Verify install, enable, and popup rendering on real GNOME sessions.
- [ ] Tune layout against the supplied macOS Control Center reference.
- [ ] Add hover, pressed, active, and disabled visual states.
- [ ] Add responsive sizing and light/dark appearance handling.

### System integrations

- [ ] Wi-Fi and Bluetooth state/actions.
- [ ] Airplane Mode where supported.
- [ ] MPRIS media controls.
- [ ] Focus / Do Not Disturb.
- [ ] Display brightness.
- [ ] Sound volume and output selection.
- [ ] GNOME Settings shortcuts.

## Project structure

```text
.
├── extension.js
├── metadata.json
├── stylesheet.css
├── README.md
└── .gitignore
```

## Contributing

Bug reports and pull requests are welcome. Include your GNOME Shell version, Wayland/X11 session type, whether Blur my Shell is enabled, and relevant Shell logs.

## Credits

- [Blur my Shell](https://github.com/aunetx/blur-my-shell) — optional blur provider and documented per-surface integration.
- macOS Control Center — visual reference.

## License

No license has been selected yet.
