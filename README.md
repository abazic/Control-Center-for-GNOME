# Control Center for GNOME

A macOS-inspired GNOME Shell extension with individually blurred Liquid Glass pills.

> **Status:** Native integration in progress. The existing popup layout and stylesheet are preserved. Wi-Fi, Bluetooth, Do Not Disturb, display brightness (GNOME Shell 49+), and output volume are connected to system services. Runtime verification is still required on a real GNOME 51 Wayland session.

## What is implemented

- Panel indicator to open the Control Center.
- macOS-inspired compact popup layout.
- Separate pill surfaces for Wi-Fi, Bluetooth, media, Focus, Display, and Sound.
- Wi-Fi enable/disable through NetworkManager D-Bus.
- Bluetooth power through the BlueZ Adapter1 D-Bus API.
- Focus / Do Not Disturb through `org.gnome.desktop.notifications` (`show-banners`).
- Display brightness through GNOME Shell's `org.gnome.Shell.Brightness` D-Bus interface (GNOME 49+).
- Output volume through GVC / the PulseAudio-compatible audio server, including PipeWire-Pulse.
- MPRIS media controls for the active session player (previous, play/pause, next, title, and artist).
- Airplane Mode coordination for Wi-Fi, Bluetooth, and WWAN when the modem exposes that control; the previous radio states are restored when disabling it.
- Audio output switching through GVC; click the speaker shortcut to cycle through available output sinks.
- Each pill has its own `bms-popup-blur-target` class.
- Transparent popup/layout shell with a translucent fallback style on individual pills.
- GNOME Shell ES module extension structure.

## Important: per-pill blur

[Blur my Shell](https://github.com/aunetx/blur-my-shell) is the optional blur provider.

The extension integration guide documents `bms-popup-blur-target`. This class is applied to **each individual pill**, never just to the outer popup. Blur my Shell follows each pill's own `border-radius`, leaving the gaps between pills visually distinct.

The popup itself is a transparent layout container. Without Blur my Shell, each pill retains a translucent CSS fallback.

Official reference: [Blur my Shell extension integration guide](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md).

## Compatibility

The metadata allows GNOME Shell 45–51. The primary development target is **GNOME Shell 51.1 on CachyOS / Wayland**. Some integrations are version- or service-dependent: the Shell brightness D-Bus interface is available on GNOME 49 and later, while Wi-Fi, Bluetooth, Do Not Disturb, and audio depend on NetworkManager, BlueZ, the GNOME notification schema, and GVC respectively. This compatibility range is not a claim that every version has been runtime-tested.

## Install from source

```bash
git clone https://github.com/abazic/Control-Center-for-GNOME.git
cd Control-Center-for-GNOME

gnome-extensions pack --force --extra-source=control-center-symbolic.svg --out-dir=dist .
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

- [x] Wi-Fi state/actions through NetworkManager.
- [x] Bluetooth power/state through BlueZ.
- [x] Focus / Do Not Disturb through GSettings.
- [x] Display brightness through GNOME Shell D-Bus (GNOME 49+).
- [x] Output volume through GVC.
- [x] Airplane Mode coordination where supported (NetworkManager Wi-Fi/WWAN + BlueZ Bluetooth).
- [x] MPRIS media controls (active player selection and metadata).
- [x] Audio output switching through GVC (cycle available output sinks).
- [ ] GNOME Settings shortcuts.

## Project structure

```text
.
├── extension.js
├── system.js
├── media.js
├── metadata.json
├── stylesheet.css
├── control-center-symbolic.svg
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
