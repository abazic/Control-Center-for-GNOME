# Changelog

All notable changes to this project will be documented in this file.

This project follows a simple versioning scheme. The entries below describe the initial public release; future releases should add their changes under a new version heading.

## [0.1.0] - 2026-11-27

### Added
- macOS-inspired GNOME Shell Control Center popup with a dedicated panel indicator.
- System tiles for Wi-Fi, Bluetooth, Airplane Mode, Focus / Do Not Disturb, display brightness, sound, and power profiles.
- Airplane Mode handling that remembers and restores the radio states that were active before it was enabled.
- MPRIS media-player detection, track metadata, and playback controls.
- Optional integrations for the Mirror and Caffeine GNOME extensions.
- Discovery of eligible third-party toggles from GNOME Quick Settings.
- Per-tile Small, Medium, and Large sizing preferences for supported tiles.
- Optional per-tile blur integration with Blur my Shell, with translucent styling as a fallback.
- Preference to lock the native Quick Settings popup while keeping its panel icon visible.

### Compatibility
- Verified by the maintainer on CachyOS with GNOME Shell 51.1.
- `metadata.json` declares GNOME Shell 51 only.
- Compatibility with other GNOME Shell major versions has not been verified.

### Notes
- Some integrations rely on GNOME Shell internal APIs and may require updates after GNOME Shell changes.
- Mirror, Caffeine, and Blur my Shell are optional third-party extensions and are not bundled with this project.
- Hardware- and service-dependent controls require their respective system components, such as NetworkManager, BlueZ, GVC, and an MPRIS-compatible media player.
