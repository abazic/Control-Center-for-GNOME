# Control Center for GNOME

A macOS-inspired Control Center for GNOME Shell, designed around a compact, elegant panel and a Liquid Glass visual style.

> **Project status:** Early planning / initial setup. The repository is being bootstrapped; the interface and features described below are goals, not implemented functionality.

## Vision

Bring the convenience and visual language of macOS Control Center to the GNOME desktop while keeping the experience native to GNOME Shell.

The extension aims to provide a single, quick-access panel for common system controls. Its visual identity is built from individually blurred, translucent control pills—not one large blurred panel.

### Design goals

- **macOS-inspired layout** — compact pills and grouped controls, following the supplied Control Center reference.
- **Per-pill Liquid Glass** — each control card/pill is its own blur target, with its own rounded corners and glass surface.
- **Blur my Shell integration** — use Blur my Shell's documented styling hook and the user's configured popup blur pipeline.
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

Each item or grouped control surface should be implemented as an individual pill/card wherever the design calls for a separate glass surface. The exact controls available may depend on GNOME Shell APIs, the system environment, and hardware support. Unsupported controls should be hidden or presented as unavailable rather than simulated.

## Visual direction: Liquid Glass

The target is a collection of glass-like pills arranged inside a Control Center popup. The blur should affect each pill individually, allowing the gaps between pills and the popup's surrounding area to remain visually distinct.

Planned visual characteristics:

- **Independent blur per pill:** every glass pill/card is a separate blur target.
- **Pill-shaped blur boundaries:** Blur my Shell follows each target surface's own `border-radius`.
- Semi-transparent surfaces, subtle highlights, soft borders, and restrained shadows.
- Consistent spacing between pills so the wallpaper can remain visible between them.
- Smooth, restrained transitions for opening the panel and changing control states.
- Accessible contrast and legible text in both light and dark environments.

The outer Control Center popup is a layout container, not the single blur target for the entire interface. Avoid applying the blur class only to the popup root: doing so would blur the whole panel rather than produce the intended per-pill effect.

### Blur my Shell integration

[Blur my Shell](https://github.com/aunetx/blur-my-shell) is the intended blur provider.

According to its [extension integration guide](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md), an extension can add the `bms-popup-blur-target` style class to a surface to make that surface follow Blur my Shell's Popups settings, including the selected blur pipeline and static/dynamic behavior.

**Implementation requirement:** add `bms-popup-blur-target` to every individual pill/card surface that should receive the glass blur. Do not add it only to the outer Control Center popup container. Each pill's own `border-radius` defines the blur's rounded boundary. When these targets are inside a popup menu, Blur my Shell blurs the surfaces individually rather than blurring the entire menu; the parent menu itself has no background of its own while those targets are present.

Add the class when constructing each pill, or at the latest before the popup is first shown. Blur my Shell documents that a popup with no blur-target surface at that time is not searched again. It also adds `bms-popup-blurred` to surfaces it has blurred, which an extension can use to avoid duplicating its own blur treatment.

This integration is optional: the documented class has no effect when Blur my Shell is not installed. The Control Center must remain usable without it, with a fallback style for the individual pills. This project should use Blur my Shell's documented styling hooks rather than copy or bundle its implementation.

## Development roadmap

The work is divided into small milestones so that the extension can be tested incrementally.

- [ ] **1. Project foundation**
  - [ ] Define the extension structure and metadata.
  - [ ] Select and document the initial GNOME Shell version target.
  - [ ] Add a minimal extension entry point and a repeatable local development workflow.

- [ ] **2. Control Center shell**
  - [ ] Create the panel entry point and popup layout container.
  - [ ] Implement the macOS-inspired grid and individual pill/card components.
  - [ ] Add responsive sizing, spacing, and per-pill rounded corners.

- [ ] **3. Per-pill Liquid Glass styling**
  - [ ] Add `bms-popup-blur-target` to each individual pill/card surface.
  - [ ] Keep the outer popup container out of the blur-target role.
  - [ ] Verify that each pill blurs independently and follows its own border radius.
  - [ ] Verify the effect with Blur my Shell enabled and the desired popup pipeline selected.
  - [ ] Implement a graceful per-pill fallback when Blur my Shell is absent or disabled.
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
| Control Center UI and pill components | Not started |
| Per-pill Blur my Shell integration | Specified; not implemented |
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
5. Test the panel, individual pill surfaces, and their controls in a development GNOME session.
6. Test per-pill blur with Blur my Shell installed and configured, then repeat without it to verify the fallback.

Exact commands and dependencies will be documented after the initial project structure is in place.

## Contributing

Ideas, bug reports, and contributions are welcome. Until the initial implementation is available, opening an issue to discuss the design or feature scope is the best way to help shape the project.

When contributing implementation changes, please include the GNOME Shell version and session type used for testing, and describe any required extensions or system services.

## Credits and references

- [Blur my Shell](https://github.com/aunetx/blur-my-shell) — blur effects and documented extension integration.
- [Blur my Shell extension integration guide](https://github.com/aunetx/blur-my-shell/blob/master/docs/extension-integration.md) — per-surface popup blur targets and styling hooks.
- The macOS Control Center screenshot supplied as the project's visual reference.

## License

A project license has not been selected yet. Licensing information will be added when the repository's license is established.
