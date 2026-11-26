# Control Center for GNOME

A macOS-inspired Control Center for GNOME Shell, designed around a compact, elegant panel and a Liquid Glass visual style.

> **Project status:** Early planning / initial setup. The repository is currently being bootstrapped; the interface and features described below are goals, not implemented functionality.

## Vision

Bring the convenience and visual language of macOS Control Center to the GNOME desktop while keeping the experience native to GNOME Shell.

The extension aims to provide a single, quick-access panel for common system controls, with a translucent glass appearance inspired by the reference design.

### Design goals

- **macOS-inspired layout** — compact tiles and grouped controls, following the supplied Control Center reference.
- **Liquid Glass appearance** — translucent surfaces, background blur, subtle highlights, soft borders, and rounded corners.
- **Native GNOME experience** — implemented as a GNOME Shell extension and integrated with the desktop rather than running as a separate application.
- **Useful at a glance** — clear states, readable labels, and quick access to frequently used controls.
- **Maintainable and adaptable** — keep UI components modular and account for GNOME Shell version differences.

## Planned interface

The initial layout is intended to include:

| Component | Intended role |
| --- | --- |
| Wi-Fi | Show connection state and provide quick access to network controls |
| Bluetooth | Show Bluetooth state and provide quick access to device controls |
| Airplane Mode | Toggle wireless connectivity where supported by the system |
| Media Player | Display current media information and playback controls |
| Focus | Provide a quick entry point for focus / Do Not Disturb functionality |
| Display | Provide access to brightness controls where supported |
| Sound | Provide volume controls and audio access |
| Settings shortcut | Open the relevant GNOME settings panel |

The exact controls available may depend on GNOME Shell APIs, the system environment, and hardware support. Unsupported controls should be hidden or presented as unavailable rather than simulated.

## Visual direction: Liquid Glass

The visual target is a glass-like panel that lets the desktop wallpaper and surrounding environment subtly show through.

Planned visual characteristics:

- Background blur with adjustable strength where supported.
- Semi-transparent light and dark surfaces.
- Rounded cards and consistent spacing.
- Subtle borders, highlights, and shadows to create depth.
- Smooth, restrained transitions for opening the panel and changing control states.
- Accessible contrast and legible text in both light and dark environments.

### Blur my Shell integration

[Blur my Shell](https://github.com/aunetx/blur-my-shell) is the intended source of blur integration and visual inspiration.

Its extension integration guide documents the `bms-popup-blur-target` style class. Applying this class to the extension's surface allows Blur my Shell to handle the popup blur using the user's configured popup pipeline, including its Liquid Glass pipeline when selected. The integration is designed to be optional: the class has no effect when Blur my Shell is not installed.

Implementation reference: [Integrating with Blur my Shell](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md).

**Important:** Blur my Shell is a separate GNOME Shell extension. This project should integrate with its documented styling hooks rather than copy or bundle its implementation. The Control Center should remain usable without Blur my Shell; a suitable non-blurred translucent fallback style will be needed.

## Development roadmap

The work is divided into small milestones so that the extension can be tested incrementally.

- [ ] **1. Project foundation**
  - [ ] Define the extension structure and metadata.
  - [ ] Select and document the initial GNOME Shell version target.
  - [ ] Add a minimal extension entry point and a repeatable local development workflow.

- [ ] **2. Control Center shell**
  - [ ] Create the panel entry point and popup container.
  - [ ] Implement the macOS-inspired grid and card layout.
  - [ ] Add responsive sizing, spacing, and rounded corners.

- [ ] **3. Liquid Glass styling**
  - [ ] Add the Blur my Shell popup integration class.
  - [ ] Verify the effect with Blur my Shell enabled and its Liquid Glass pipeline selected.
  - [ ] Implement a graceful fallback when Blur my Shell is absent or disabled.
  - [ ] Check contrast and readability over different wallpapers.

- [ ] **4. System controls**
  - [ ] Implement Wi-Fi and Bluetooth state presentation and actions.
  - [ ] Implement Airplane Mode where supported.
  - [ ] Add media playback integration.
  - [ ] Add Focus / Do Not Disturb access.
  - [ ] Add display brightness and sound controls where supported.
  - [ ] Add shortcuts to relevant GNOME Settings pages.

- [ ] **5. Polish and compatibility**
  - [ ] Add transitions and interaction feedback.
  - [ ] Handle unavailable services and hardware safely.
  - [ ] Test on the documented GNOME Shell versions and Wayland/X11 sessions where applicable.
  - [ ] Document installation, configuration, and troubleshooting.

- [ ] **6. Release preparation**
  - [ ] Add screenshots and a short feature demonstration.
  - [ ] Add contribution and issue-reporting guidance.
  - [ ] Validate packaging and prepare an initial release.

## Current progress

At this stage, the repository is at the project-planning stage. No working extension features are claimed yet.

| Area | Status |
| --- | --- |
| Product direction and visual reference | Defined |
| Initial feature scope | Planned |
| Repository / extension scaffold | Not started |
| Control Center UI | Not started |
| Blur my Shell integration | Not started |
| System control functionality | Not started |
| Testing and release | Not started |

Progress should be updated as implementation is merged. A roadmap item should only be marked complete after the feature exists in the repository and has been tested.

## Getting started

Development setup instructions will be added once the extension scaffold and supported GNOME Shell target are established.

The intended development workflow is:

1. Clone this repository.
2. Install the development tools required by the selected GNOME Shell extension workflow.
3. Build or install the extension into the local user's GNOME extensions directory.
4. Enable the extension in GNOME Extensions.
5. Test the panel and its controls in a development GNOME session.
6. Test optional blur integration with Blur my Shell installed, then repeat without it to verify the fallback.

Exact commands and dependencies will be documented after the initial project structure is in place.

## Contributing

Ideas, bug reports, and contributions are welcome. Until the initial implementation is available, opening an issue to discuss the design or feature scope is the best way to help shape the project.

When contributing implementation changes, please include the GNOME Shell version and session type used for testing, and describe any required extensions or system services.

## Credits and references

- [Blur my Shell](https://github.com/aunetx/blur-my-shell) — blur effects and documented extension integration.
- [Blur my Shell extension integration guide](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md) — popup blur integration and styling hooks.
- The macOS Control Center screenshot supplied as the project's visual reference.

## License

A project license has not been selected yet. Licensing information will be added when the repository's license is established.
